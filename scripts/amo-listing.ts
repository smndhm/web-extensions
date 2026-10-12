/**
 * Updates an extension's addons.mozilla.org listing from the repository, with the AMO API
 * (https://mozilla.github.io/addons-server/topics/api/addons.html#edit):
 * - name and summary: the name and description of each locale in public/_locales;
 * - description: store/description-<locale>.md;
 * - categories: AMO_CATEGORIES below;
 * - with --images, also the icon (public/icons/128.png) and the screenshots (store/screenshot-*.png,
 *   the English ones when they differ by language): they replace the listing's previews.
 *
 * Usage: node scripts/amo-listing.ts <extension> [--images] [--dry-run]
 * Needs FIREFOX_EXTENSION_ID (the add-on ID), FIREFOX_JWT_ISSUER and FIREFOX_JWT_SECRET (the AMO API
 * key and secret, as for wxt submit), except with --dry-run, which only prints what would be sent.
 */

import { createHmac, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(import.meta.dirname, '..');
const API = 'https://addons.mozilla.org/api/v5/addons/addon';
const DEFAULT_LOCALE = 'en';

// https://github.com/mozilla/addons-server/blob/master/src/olympia/constants/categories.py (up to 3)
const AMO_CATEGORIES: Record<string, string[]> = {
  'dzr-link': ['photos-music-videos'],
  'dzr-tab': ['photos-music-videos', 'tabs'],
  'music-bridge': ['photos-music-videos'],
};

const {
  positionals: [extension],
  values: { images, 'dry-run': dryRun },
} = parseArgs({ allowPositionals: true, options: { 'images': { type: 'boolean', default: false }, 'dry-run': { type: 'boolean', default: false } } });

if (!extension || !AMO_CATEGORIES[extension]) {
  throw new Error(`Usage: node scripts/amo-listing.ts <${Object.keys(AMO_CATEGORIES).join('|')}> [--images] [--dry-run]`);
}

const dir = resolve(ROOT, 'extensions', extension);

/** AMO locale codes: en-US rather than en, pt-BR rather than pt_BR */
const amoLocale = (locale: string): string => (locale === 'en' ? 'en-US' : locale.replace('_', '-'));

const name: Record<string, string> = {};
const summary: Record<string, string> = {};
const description: Record<string, string> = {};
for (const locale of await readdir(resolve(dir, 'public/_locales'))) {
  const messages = JSON.parse(await readFile(resolve(dir, `public/_locales/${locale}/messages.json`), 'utf8')) as Record<string, { message: string }>;
  name[amoLocale(locale)] = messages.name!.message;
  summary[amoLocale(locale)] = messages.description!.message;
  const file = resolve(dir, `store/description-${locale}.md`);
  if (existsSync(file)) description[amoLocale(locale)] = (await readFile(file, 'utf8')).trim();
}
const listing = { name, summary, description, categories: AMO_CATEGORIES[extension] };

const icon = resolve(dir, 'public/icons/128.png');
const allScreenshots = (await readdir(resolve(dir, 'store'))).filter(file => /^screenshot-.*\.png$/.test(file)).toSorted();
// Previews are the same for every language: keep the default locale's when they differ by language
const localized = allScreenshots.filter(file => file.includes(`-${DEFAULT_LOCALE}-`));
const screenshots = (localized.length ? localized : allScreenshots).map(file => resolve(dir, 'store', file));

if (dryRun) {
  console.log(JSON.stringify(listing, null, 2));
  if (images) console.log(`Icon: ${icon}\nPreviews (replacing the current ones):\n${screenshots.map(file => `- ${file}`).join('\n') || '- none'}`);
  process.exit(0);
}

const { FIREFOX_EXTENSION_ID: id, FIREFOX_JWT_ISSUER: issuer, FIREFOX_JWT_SECRET: secret } = process.env;
if (!id || !issuer || !secret) throw new Error('FIREFOX_EXTENSION_ID, FIREFOX_JWT_ISSUER and FIREFOX_JWT_SECRET are required');
const addonUrl = `${API}/${encodeURIComponent(id)}/`;

const encode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');

/** A JWT for one request: https://mozilla.github.io/addons-server/topics/api/auth.html */
function token(): string {
  const iat = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ iss: issuer, jti: randomUUID(), iat, exp: iat + 60 })}`;
  return `${unsigned}.${createHmac('sha256', secret!).update(unsigned).digest('base64url')}`;
}

async function amo<T>(method: string, url: string, body?: object | FormData): Promise<T> {
  const json = body !== undefined && !(body instanceof FormData);
  const response = await fetch(url, {
    method,
    headers: { Authorization: `JWT ${token()}`, ...(json ? { 'Content-Type': 'application/json' } : {}) },
    body: json ? JSON.stringify(body) : body,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`AMO API: ${method} ${url}: ${response.status} ${text}`);
  return (text ? JSON.parse(text) : undefined) as T;
}

const imageForm = async (field: string, file: string, extra: Record<string, string> = {}): Promise<FormData> => {
  const form = new FormData();
  form.append(field, new Blob([await readFile(file)], { type: 'image/png' }), basename(file));
  for (const [key, value] of Object.entries(extra)) form.append(key, value);
  return form;
};

await amo('PATCH', addonUrl, listing);
console.log(`${extension}: name, summary, description and categories updated (${Object.keys(name).join(', ')})`);

if (images) {
  await amo('PATCH', addonUrl, await imageForm('icon', icon));
  console.log(`${extension}: icon updated`);

  if (!screenshots.length) {
    console.log(`${extension}: no screenshots, previews left as they are`);
    process.exit(0);
  }
  const { previews } = await amo<{ previews: { id: number }[] }>('GET', addonUrl);
  // Upload the new previews before deleting the old ones, so the listing never has none
  for (const [position, file] of screenshots.entries()) {
    await amo('POST', `${addonUrl}previews/`, await imageForm('image', file, { position: String(position) }));
    console.log(`${extension}: preview ${basename(file)} uploaded`);
  }
  for (const preview of previews) await amo('DELETE', `${addonUrl}previews/${preview.id}/`);
  console.log(`${extension}: ${previews.length} old previews deleted`);
}
