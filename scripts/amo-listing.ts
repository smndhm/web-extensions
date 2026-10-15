/**
 * Updates an extension's addons.mozilla.org listing from the repository, with the AMO API
 * (https://mozilla.github.io/addons-server/topics/api/addons.html#edit):
 * - name and summary: the name and description of each locale in public/_locales;
 * - description: store/description-<locale>.md;
 * - categories: AMO_CATEGORIES below; homepage: the extension's folder on GitHub;
 * - privacy policy: store/privacy-<locale>.md, when the extension has one;
 * - with --images, also the icon (store/icon-128x128.png, or else public/icons/128.png) and the screenshots (store/screenshot-*.png,
 *   the English ones when they differ by language): they replace the listing's previews, with their captions
 *   from store/captions.json ({ "<file>": { "<locale>": "<caption>" } }).
 *
 * Usage: node scripts/amo-listing.ts <extension> [--images] [--dry-run]
 *        node scripts/amo-listing.ts <extension> --version-metadata <file>
 * --version-metadata writes, instead, the metadata of the version to submit for wxt submit's
 * --firefox-amo-metadata-file: the notes for reviewers (store/notes-for-reviewers.md) and the release
 * notes (the version's CHANGELOG.md entry, without the dependency updates).
 * Needs FIREFOX_EXTENSION_ID (the add-on ID), FIREFOX_JWT_ISSUER and FIREFOX_JWT_SECRET (the AMO API
 * key and secret, as for wxt submit), except with --dry-run, which only prints what would be sent.
 */

import { createHmac, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(import.meta.dirname, '..');
const API = 'https://addons.mozilla.org/api/v5/addons/addon';
const REPO = 'https://github.com/smndhm/web-extensions';
const DEFAULT_LOCALE = 'en';

// https://github.com/mozilla/addons-server/blob/master/src/olympia/constants/categories.py (up to 3)
const AMO_CATEGORIES: Record<string, string[]> = {
  'dzr-link': ['photos-music-videos'],
  'dzr-tab': ['photos-music-videos', 'tabs'],
  'music-bridge': ['photos-music-videos'],
};

const {
  positionals: [extension],
  values: { images, 'dry-run': dryRun, 'version-metadata': versionMetadata },
} = parseArgs({
  allowPositionals: true,
  options: { 'images': { type: 'boolean', default: false }, 'dry-run': { type: 'boolean', default: false }, 'version-metadata': { type: 'string' } },
});

if (!extension || !AMO_CATEGORIES[extension]) {
  throw new Error(`Usage: node scripts/amo-listing.ts <${Object.keys(AMO_CATEGORIES).join('|')}> [--images] [--dry-run]`);
}

const dir = resolve(ROOT, 'extensions', extension);
const readIfExists = async (file: string): Promise<string | undefined> => (existsSync(file) ? (await readFile(file, 'utf8')).trim() : undefined);

/** The CHANGELOG.md entry of `version`, as a Markdown list, without the commit hashes and the dependency updates */
function releaseNotes(changelog: string, version: string): string | undefined {
  const entry = changelog.split(/^## /m).find(section => section.startsWith(`${version}\n`));
  if (!entry) return undefined;
  const items = entry
    .split(/^- /m)
    .slice(1)
    .map(item =>
      item
        .replace(/^[0-9a-f]{7,}: /, '')
        .replace(/^### .*$/m, '')
        .trim(),
    )
    .filter(item => item && !item.startsWith('Updated dependency'));
  return items.length ? items.map(item => `- ${item.replace(/\n\s*/g, ' ')}`).join('\n') : undefined;
}

if (versionMetadata) {
  const { version } = JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8')) as { version: string };
  const notes = releaseNotes((await readIfExists(resolve(dir, 'CHANGELOG.md'))) ?? '', version);
  const approvalNotes = await readIfExists(resolve(dir, 'store/notes-for-reviewers.md'));
  const metadata = { version: { ...(approvalNotes && { approval_notes: approvalNotes }), ...(notes && { release_notes: { 'en-US': notes } }) } };
  await writeFile(resolve(versionMetadata), JSON.stringify(metadata, null, 2));
  console.log(`${extension} ${version}: version metadata written to ${versionMetadata}\n${JSON.stringify(metadata, null, 2)}`);
  process.exit(0);
}

/** AMO locale codes: en-US rather than en, pt-BR rather than pt_BR */
const amoLocale = (locale: string): string => (locale === 'en' ? 'en-US' : locale.replace('_', '-'));

const name: Record<string, string> = {};
const summary: Record<string, string> = {};
const description: Record<string, string> = {};
const privacyPolicy: Record<string, string> = {};
for (const locale of await readdir(resolve(dir, 'public/_locales'))) {
  const messages = JSON.parse(await readFile(resolve(dir, `public/_locales/${locale}/messages.json`), 'utf8')) as Record<string, { message: string }>;
  name[amoLocale(locale)] = messages.name!.message;
  summary[amoLocale(locale)] = messages.description!.message;
  const text = await readIfExists(resolve(dir, `store/description-${locale}.md`));
  if (text) description[amoLocale(locale)] = text;
  const privacy = await readIfExists(resolve(dir, `store/privacy-${locale}.md`));
  if (privacy) privacyPolicy[amoLocale(locale)] = privacy;
}
const listing = { name, summary, description, categories: AMO_CATEGORIES[extension], homepage: { 'en-US': `${REPO}/tree/main/extensions/${extension}` } };

// The store icon, when the extension has one: Music Bridge's manifest icons change colors with each release
const icon = resolve(dir, existsSync(resolve(dir, 'store/icon-128x128.png')) ? 'store/icon-128x128.png' : 'public/icons/128.png');
const allScreenshots = (await readdir(resolve(dir, 'store'))).filter(file => /^screenshot-.*\.png$/.test(file)).toSorted();
// Previews are the same for every language: keep the default locale's when they differ by language
const localized = allScreenshots.filter(file => file.includes(`-${DEFAULT_LOCALE}-`));
const screenshots = (localized.length ? localized : allScreenshots).map(file => resolve(dir, 'store', file));
const captionsFile = resolve(dir, 'store/captions.json');
const captions = (existsSync(captionsFile) ? JSON.parse(await readFile(captionsFile, 'utf8')) : {}) as Record<string, Record<string, string>>;
/** A screenshot's caption in each locale, with AMO locale codes */
const captionOf = (file: string): Record<string, string> | undefined => {
  const caption = captions[basename(file)];
  return caption && Object.fromEntries(Object.entries(caption).map(([locale, text]) => [amoLocale(locale), text]));
};
// store/captions.json also gives the order of the previews
const order = Object.keys(captions);
const rank = (file: string) => (order.includes(basename(file)) ? order.indexOf(basename(file)) : order.length);
screenshots.sort((a, b) => rank(a) - rank(b));
for (const file of screenshots) if (!captionOf(file)) console.warn(`${extension}: no caption for ${basename(file)} in store/captions.json`);

if (dryRun) {
  console.log(JSON.stringify(listing, null, 2));
  if (Object.keys(privacyPolicy).length) console.log(JSON.stringify({ privacy_policy: privacyPolicy }, null, 2));
  if (images)
    console.log(`Icon: ${icon}\nPreviews (replacing the current ones):\n${screenshots.map(file => `- ${file} ${JSON.stringify(captionOf(file) ?? {})}`).join('\n') || '- none'}`);
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

const THROTTLE_RETRIES = 3;
// Longer waits mean AMO's hourly or daily limit: better fail and run again later than hold a runner
const MAX_THROTTLE_WAIT = 120;

async function amo<T>(method: string, url: string, body?: object | FormData, retries = THROTTLE_RETRIES): Promise<T> {
  const json = body !== undefined && !(body instanceof FormData);
  const response = await fetch(url, {
    method,
    headers: { Authorization: `JWT ${token()}`, ...(json ? { 'Content-Type': 'application/json' } : {}) },
    body: json ? JSON.stringify(body) : body,
  });
  const text = await response.text();
  // AMO throttles the API right after a version upload: wait as long as it says, then try again
  if (response.status === 429 && retries > 0) {
    const seconds = Number(response.headers.get('Retry-After') ?? /available in (\d+) seconds/.exec(text)?.[1] ?? 60);
    if (seconds > MAX_THROTTLE_WAIT) {
      throw new Error(`AMO API throttled for ${Math.ceil(seconds / 60)} minutes: run again after ${new Date(Date.now() + seconds * 1000).toISOString()}`);
    }
    console.log(`AMO API throttled: retrying in ${seconds + 1} s`);
    await new Promise(done => setTimeout(done, (seconds + 1) * 1000));
    return amo<T>(method, url, body, retries - 1);
  }
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
console.log(`${extension}: name, summary, description, categories and homepage updated (${Object.keys(name).join(', ')})`);
if (Object.keys(privacyPolicy).length) {
  await amo('PATCH', `${addonUrl}eula_policy/`, { privacy_policy: privacyPolicy });
  console.log(`${extension}: privacy policy updated`);
}

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
    const preview = await amo<{ id: number }>('POST', `${addonUrl}previews/`, await imageForm('image', file, { position: String(position) }));
    // The caption can't be sent with the image (multipart form): set it afterwards
    const caption = captionOf(file);
    if (caption) await amo('PATCH', `${addonUrl}previews/${preview.id}/`, { caption });
    console.log(`${extension}: preview ${basename(file)} uploaded`);
  }
  for (const preview of previews) await amo('DELETE', `${addonUrl}previews/${preview.id}/`);
  console.log(`${extension}: ${previews.length} old previews deleted`);
}
