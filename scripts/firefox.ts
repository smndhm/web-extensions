/**
 * Smoke tests of the Firefox builds in a real Firefox.
 *
 * Installs each extension's Firefox zip (.output/*-firefox.zip) as a temporary add-on with
 * Selenium and geckodriver, then:
 * - dzr-tab: opens the new tab page, waits for a real Deezer track and its gradient, checks the
 *   logo and runs axe-core (WCAG 2.2 A/AA);
 * - dzr-link: opens a Deezer track page from a script-opened tab and expects the content script
 *   to redirect it to the desktop app (deezer://) or to close the tab;
 * - music-bridge: opens a Tidal track page and expects the content script to send it to the
 *   redirect service (default platform: Spotify).
 * Screenshots go to .output/firefox/.
 *
 * Usage: pnpm zip:firefox && pnpm test:firefox
 * Needs Firefox; Selenium finds or downloads geckodriver.
 */

import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import webdriver from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = resolve(ROOT, '.output/firefox');
const require = createRequire(resolve(ROOT, 'extensions/dzr-tab/package.json'));
const AXE_SOURCE = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');

// Fixed moz-extension:// hosts for the extensions whose pages the tests open, keyed by add-on ID
const UUIDS = {
  'dzr-tab': { id: '{52114cbe-92a2-4828-8b44-109c35fbc0e7}', uuid: '6f0c1a52-0d5e-4d5b-9a51-6c1b0d6c0002' },
} as const;

async function firefoxZip(extension: 'dzr-link' | 'dzr-tab' | 'music-bridge') {
  const dir = resolve(ROOT, 'extensions', extension);
  const { version } = JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8'));
  const zip = `${extension}-${version}-firefox.zip`;
  if (!(await readdir(resolve(dir, '.output')).catch(() => [])).includes(zip)) {
    throw new Error(`No ${zip} in ${dir}/.output. Did you run pnpm zip:firefox?`);
  }
  return resolve(dir, '.output', zip);
}

const options = new firefox.Options()
  .addArguments('-headless')
  .windowSize({ width: 1280, height: 800 })
  .setPreference(
    'extensions.webextensions.uuids',
    JSON.stringify(Object.fromEntries(Object.values(UUIDS).map(({ id, uuid }) => [id, uuid]))),
  )
  // Let a page close a tab it opened itself (dzr-link closes the Deezer tab after redirecting)
  .setPreference('dom.allow_scripts_to_close_windows', true);
options.setPageLoadStrategy('eager');

// --allow-system-access lets the tests open a new tab through the browser UI (chrome context)
const service = new firefox.ServiceBuilder().addArguments('--allow-system-access');
const driver = await new webdriver.Builder()
  .forBrowser('firefox')
  .setFirefoxOptions(options)
  .setFirefoxService(service)
  .build();
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
    await driver.switchTo().window((await driver.getAllWindowHandles()).find((handle) => !before.includes(handle))!);
    const newTabUrl = `moz-extension://${UUIDS['dzr-tab'].uuid}/newtab.html`;
    await driver.wait(async () => (await driver.getCurrentUrl()) === newTabUrl, 10_000).catch(async () => {
      throw new Error(`the new tab is ${await driver.getCurrentUrl()}, expected ${newTabUrl}`);
    });
    await driver.wait(
      () =>
        driver.executeScript(
          () =>
            !!document.querySelector('.track-title')?.textContent?.trim() &&
            document.body.style.backgroundImage !== '',
        ),
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

    const violations = (await driver.executeAsyncScript(
      `${AXE_SOURCE}
      const done = arguments[arguments.length - 1];
      axe
        .run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })
        .then((result) => done(result.violations.map((v) => v.id + ': ' + v.help)), (error) => done(['axe failed: ' + error]));`,
    )) as string[];
    errors.push(...violations.map((violation) => `dzr-tab: axe ${violation}`));
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
    const tab = (await driver.getAllWindowHandles()).find((handle) => !before.includes(handle))!;
    await driver.switchTo().window(tab);

    let outcome = '';
    await driver.wait(
      async () => {
        if (!(await driver.getAllWindowHandles()).includes(tab)) return (outcome = 'tab closed after redirecting');
        const url = decodeURIComponent(await driver.getCurrentUrl());
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

  // music-bridge: the default platform is Spotify, so a Tidal page goes to the redirect service
  try {
    await driver.installAddon(await firefoxZip('music-bridge'), true);
    // It opens its options on install: let that tab open before counting tabs
    await driver.sleep(2000);
    await driver.switchTo().window(main);
    const before = await driver.getAllWindowHandles();
    await driver.executeScript(() => window.open('https://listen.tidal.com/track/1', '_blank'));
    await driver.wait(async () => (await driver.getAllWindowHandles()).length > before.length, 10_000, 'the Tidal tab did not open');
    await driver.switchTo().window((await driver.getAllWindowHandles()).find((handle) => !before.includes(handle))!);

    let outcome = '';
    await driver.wait(
      async () => {
        // The service may already have redirected to Spotify, or be down (error page with its URL)
        const url = decodeURIComponent(await driver.getCurrentUrl());
        if (url.includes('music-bridge.bricodage.fr/?url=')) return (outcome = `sent to the service (${url})`);
        if (url.startsWith('https://open.spotify.com/')) return (outcome = `redirected to Spotify (${url})`);
        return false;
      },
      20_000,
      'the Tidal page was not sent to the redirect service',
    );
    console.log(`music-bridge: ${outcome}`);
  } catch (error) {
    errors.push(`music-bridge: ${(error as Error).message} (url: ${await driver.getCurrentUrl().catch(() => '?')})`);
    await screenshot('music-bridge').catch(() => {});
  } finally {
    await driver.switchTo().window(main);
  }
} finally {
  await driver.quit();
}

if (errors.length) {
  console.error(`\n${errors.join('\n')}`);
  process.exit(1);
}
console.log('Firefox smoke tests passed');
