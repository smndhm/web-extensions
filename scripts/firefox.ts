/**
 * Smoke tests of the Firefox builds in a real Firefox.
 *
 * Installs each extension's Firefox zip (.output/*-firefox.zip) as a temporary add-on with
 * Selenium and geckodriver, then:
 * - dzr-tab: opens the new tab page, waits for a real Deezer track and its gradient, checks the
 *   logo and runs the shared accessibility audit (@dume/dev-config/a11y);
 * - dzr-link: opens a Deezer track page from a script-opened tab and expects the content script
 *   to redirect it to the desktop app (deezer://) or to close the tab;
 * - music-bridge: opens a Tidal track page and expects it to land on the same track on Spotify (default
 *   platform), the link the redirect service answers.
 * Screenshots go to .output/firefox/.
 *
 * Music Bridge asks a stand-in of its redirect service, run here (its "stub" build, which pnpm test:firefox zips): the
 * tests do not call the real service, a production one. With --live, they install its published build, which asks the
 * real service: on the "Version Packages" pull request, before a release, when its CI is approved (.github/workflows/ci.yml).
 *
 * Usage: pnpm zip:firefox && pnpm test:firefox (pnpm test:firefox:live: against the real service)
 * Needs Firefox; Selenium finds or downloads geckodriver.
 */

import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { axeScript, describeViolations } from '@dume/dev-config/a11y';
import webdriver from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { STUB_SERVICE_URL } from '../extensions/music-bridge/utils/stub-service.ts';

const ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = resolve(ROOT, '.output/firefox');
const LIVE = process.argv.includes('--live');

// The Tidal track the music-bridge test opens, and the same track on Spotify (Never Gonna Give You Up)
const TIDAL_TRACK_URL = 'https://tidal.com/track/491206012';
const SPOTIFY_TRACK_URL = 'https://open.spotify.com/track/4PTG3Z6ehGkBFwjybzWkR8';

// Fixed moz-extension:// hosts for the extensions whose pages the tests open, keyed by add-on ID
const UUIDS = {
  'dzr-tab': { id: '{52114cbe-92a2-4828-8b44-109c35fbc0e7}', uuid: '6f0c1a52-0d5e-4d5b-9a51-6c1b0d6c0002' },
} as const;

async function firefoxZip(extension: 'dzr-link' | 'dzr-tab' | 'music-bridge', mode?: 'stub') {
  const dir = resolve(ROOT, 'extensions', extension);
  const { version } = JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8'));
  const zip = `${extension}-${version}-firefox${mode ? `-${mode}` : ''}.zip`;
  if (!(await readdir(resolve(dir, '.output')).catch(() => [])).includes(zip)) {
    throw new Error(`No ${zip} in ${dir}/.output. Did you run ${mode ? 'pnpm test:firefox' : 'pnpm zip:firefox'}?`);
  }
  return resolve(dir, '.output', zip);
}

// The stand-in of the redirect service: the Spotify track for the Tidal track, in JSON (format=json) or as a
// redirect, as the real service answers. Records the links Music Bridge asks for.
const stubRequests: URL[] = [];
const stubService = createServer((request, response) => {
  const url = new URL(request.url ?? '/', STUB_SERVICE_URL);
  stubRequests.push(url);
  // The background asks it from its moz-extension:// page
  response.setHeader('Access-Control-Allow-Origin', '*');
  const known = url.searchParams.get('url') === TIDAL_TRACK_URL && url.searchParams.get('platform') === 'spotify';
  if (!known) response.writeHead(404, { 'Content-Type': 'application/json' }).end('{}');
  else if (url.searchParams.get('format') === 'json') response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ url: SPOTIFY_TRACK_URL }));
  else response.writeHead(302, { Location: SPOTIFY_TRACK_URL }).end();
});
if (!LIVE) {
  const { hostname, port } = new URL(STUB_SERVICE_URL);
  await new Promise<void>(listening => stubService.listen(Number(port), hostname, listening));
}

const options = new firefox.Options()
  .addArguments('-headless')
  .windowSize({ width: 1280, height: 800 })
  .setPreference('extensions.webextensions.uuids', JSON.stringify(Object.fromEntries(Object.values(UUIDS).map(({ id, uuid }) => [id, uuid]))))
  // Let a page close a tab it opened itself (dzr-link closes the Deezer tab after redirecting)
  .setPreference('dom.allow_scripts_to_close_windows', true);
options.setPageLoadStrategy('eager');

// --allow-system-access lets the tests open a new tab through the browser UI (chrome context)
const service = new firefox.ServiceBuilder().addArguments('--allow-system-access');
const driver = await new webdriver.Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(service).build();
const errors: string[] = [];
await mkdir(OUTPUT_DIR, { recursive: true });

async function screenshot(name: string) {
  await writeFile(resolve(OUTPUT_DIR, `${name}.png`), await driver.takeScreenshot(), 'base64');
}

try {
  // music-bridge also handles Deezer pages, before dzr-link does (document_start): install it after
  // the dzr-link test
  for (const extension of ['dzr-link', 'dzr-tab'] as const) {
    await driver.installAddon(await firefoxZip(extension), true);
  }
  const main = await driver.getWindowHandle();

  // dzr-tab
  try {
    // WebDriver cannot navigate to moz-extension:// pages: open a new tab like a user would, which
    // also checks that the extension overrides the new tab page
    const before = await driver.getAllWindowHandles();
    await driver.setContext(firefox.Context.CHROME);
    await driver.executeScript('(window.BrowserCommands?.openTab ?? window.BrowserOpenTab)()');
    await driver.setContext(firefox.Context.CONTENT);
    await driver.wait(async () => (await driver.getAllWindowHandles()).length > before.length, 10_000, 'no new tab opened');
    await driver.switchTo().window((await driver.getAllWindowHandles()).find(handle => !before.includes(handle))!);
    const newTabUrl = `moz-extension://${UUIDS['dzr-tab'].uuid}/newtab.html`;
    await driver
      .wait(async () => (await driver.getCurrentUrl()) === newTabUrl, 10_000)
      .catch(async () => {
        throw new Error(`the new tab is ${await driver.getCurrentUrl()}, expected ${newTabUrl}`);
      });
    await driver.wait(
      () => driver.executeScript(() => !!document.querySelector('.track-title')?.textContent?.trim() && document.body.style.backgroundImage !== ''),
      20_000,
      'no track or gradient after 20 s',
    );
    const page = (await driver.executeScript(() => ({
      title: document.querySelector('.track-title')?.textContent?.trim(),
      artist: document.querySelector('.track-artist')?.textContent?.trim(),
      logo: document.querySelector('#logo a svg') !== null,
      favicon: document.querySelector<HTMLLinkElement>('link[rel~=icon]')?.href,
    }))) as { title: string; artist: string; logo: boolean; favicon: string };
    console.log(`dzr-tab: ${page.title} – ${page.artist}`);
    if (!page.logo) errors.push('dzr-tab: the Deezer logo is missing');

    // The same audit as the accessibility scripts (@dume/dev-config/a11y), in Firefox
    const result = await driver.executeAsyncScript(axeScript());
    if ('error' in (result as object)) throw new Error(`axe failed: ${(result as { error: string }).error}`);
    errors.push(...describeViolations(result as Parameters<typeof describeViolations>[0]).map(violation => `dzr-tab: axe ${violation}`));
    await screenshot('dzr-tab');
  } catch (error) {
    errors.push(`dzr-tab: ${(error as Error).message}`);
    await screenshot('dzr-tab').catch(() => {});
  }

  // dzr-link: open the track from a script so the tab may be closed by the content script
  try {
    await driver.switchTo().window(main);
    const before = await driver.getAllWindowHandles();
    await driver.executeScript(() => window.open('https://www.deezer.com/fr/track/3135556', '_blank'));
    await driver.wait(async () => (await driver.getAllWindowHandles()).length > before.length, 10_000, 'the Deezer tab did not open');
    const tab = (await driver.getAllWindowHandles()).find(handle => !before.includes(handle))!;
    await driver.switchTo().window(tab);

    let outcome = '';
    await driver.wait(
      async () => {
        if (!(await driver.getAllWindowHandles()).includes(tab)) return (outcome = 'tab closed after redirecting');
        // The tab may close between the two calls: Firefox then discards its browsing context
        const url = await driver.getCurrentUrl().then(decodeURIComponent, (error: Error) => {
          if (error.name === 'NoSuchWindowError' || /discarded/i.test(error.message)) return undefined;
          throw error;
        });
        if (url === undefined) return (outcome = 'tab closed after redirecting');
        if (url.includes('deezer://track/3135556')) return (outcome = `redirected (${url})`);
        return false;
      },
      20_000,
      'the Deezer page was neither redirected to deezer:// nor closed',
    );
    console.log(`dzr-link: ${outcome}`);
  } catch (error) {
    errors.push(`dzr-link: ${(error as Error).message} (url: ${await driver.getCurrentUrl().catch(() => '?')})`);
    await screenshot('dzr-link').catch(() => {});
  } finally {
    await driver.switchTo().window(main);
  }

  // music-bridge: the default platform is Spotify, so the extension asks the redirect service for the Tidal
  // track on Spotify (Never Gonna Give You Up) and goes there; it stays on Tidal with a message when it cannot
  let notice = '';
  try {
    await driver.installAddon(await firefoxZip('music-bridge', LIVE ? undefined : 'stub'), true);
    // It opens its options on install: let that tab open before counting tabs
    await driver.sleep(2000);
    await driver.switchTo().window(main);
    const before = await driver.getAllWindowHandles();
    await driver.executeScript((url: string) => window.open(url, '_blank'), TIDAL_TRACK_URL);
    await driver.wait(async () => (await driver.getAllWindowHandles()).length > before.length, 10_000, 'the Tidal tab did not open');
    await driver.switchTo().window((await driver.getAllWindowHandles()).find(handle => !before.includes(handle))!);

    let outcome = '';
    await driver.wait(
      async () => {
        const url = decodeURIComponent(await driver.getCurrentUrl());
        if (url.startsWith('https://open.spotify.com/')) return (outcome = `redirected to Spotify (${url})`);
        // The message the extension shows when the service has no link, or fails
        notice = await driver
          .executeScript<string>(() => document.querySelector('music-bridge-notice')?.shadowRoot?.textContent?.replace(/\s+/g, ' ').trim() ?? '')
          .catch(() => '');
        return false;
      },
      20_000,
      'the Tidal page did not land on Spotify',
    );
    console.log(`music-bridge: ${outcome}${LIVE ? ', through the real service' : ''}`);
    // The stand-in answered it: Music Bridge asked it for the Tidal link, then went through it
    if (!LIVE && !stubRequests.some(url => url.searchParams.get('format') === 'json')) errors.push('music-bridge: the redirect service was not asked');
  } catch (error) {
    errors.push(`music-bridge: ${(error as Error).message} (url: ${await driver.getCurrentUrl().catch(() => '?')}${notice ? `, message: ${notice}` : ''})`);
    await screenshot('music-bridge').catch(() => {});
  } finally {
    await driver.switchTo().window(main);
  }
} finally {
  await driver.quit();
  stubService.close();
}

if (errors.length) {
  console.error(`\n${errors.join('\n')}`);
  process.exit(1);
}
console.log('Firefox smoke tests passed');
