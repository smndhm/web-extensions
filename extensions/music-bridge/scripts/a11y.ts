/**
 * Accessibility checks of the options page.
 *
 * Loads the Chrome build (.output/chrome-mv3) in Chromium, in English and French, light and dark, and
 * checks the options page in three states: as it opens, with Deezer chosen and "Open links in the desktop app"
 * ticked (the "Close the tab" option and its help show up), saved as it changes:
 * - axe-core (@dume/dev-config/a11y: WCAG 2.2 A/AA, best practices, RGAA 4, EN 301 549) reports no violation;
 * - the keyboard order is platform → open in app → close the tab → the Odesli link;
 * - the confirmation next to a setting changed is in a status live region, so screen readers announce it.
 *
 * Then, on a music page (served by the script, as the redirect service's "not on this platform" answer), it checks
 * the message Music Bridge shows when it cannot redirect: axe-core again, its text in a status live region, in the
 * extension's language, its link to search the platform then its close button, reached with Tab, and Escape, which
 * closes it.
 *
 * Usage: pnpm build && pnpm a11y
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { resolve } from 'node:path';
import { audit, tabOrder } from '@dume/dev-config/a11y';
import { chromium, type BrowserContext, type Page } from 'playwright';

const EXTENSION_DIR = resolve(import.meta.dirname, '../.output/chrome-mv3');

const EXPECTED_TAB_ORDER = ['#streaming-platforms', '#open-app', '#close-tab', 'footer a'];
// The redirect service, at both its addresses (bricodage.fr, workers.dev when it cannot be reached)
const REDIRECT_SERVICE_URLS = ['https://music-bridge.bricodage.fr/', 'https://music-bridge-redirect.smndhm.workers.dev/'];
// A Spotify page in English, whatever the extension's language: the message must say its own
const MUSIC_PAGE_URL = 'https://open.spotify.com/intl-en/track/0000000000000000000000';
// What the redirect service tells of the music it has no link for
const NOT_FOUND_MUSIC = { type: 'song', title: 'A track', artistName: 'An artist' };
const MUSIC_PAGE = '<!doctype html><html lang="en"><head><title>Spotify</title></head><body><main><h1>A track</h1></main></body></html>';

async function axe(page: Page, state: string): Promise<string[]> {
  return (await audit(page)).map(violation => `${state}: ${violation}`);
}

/** The message on a music page Music Bridge cannot redirect, the platform chosen being another one */
async function checkNotice(context: BrowserContext, locale: string): Promise<string[]> {
  const errors: string[] = [];
  // The redirect service has no link for this music, and the music page is ours: the check needs no network
  for (const service of REDIRECT_SERVICE_URLS) await context.route(`${service}**`, route => route.fulfill({ status: 404, json: NOT_FOUND_MUSIC }));
  await context.route(MUSIC_PAGE_URL, route => route.fulfill({ contentType: 'text/html', body: MUSIC_PAGE }));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`music page error: ${error.message}`));
  await page.goto(MUSIC_PAGE_URL);
  const status = page.locator('music-bridge-notice [role="status"]');
  await status.filter({ hasText: /\S/ }).waitFor({ timeout: 10_000 });
  errors.push(...(await axe(page, 'message')));
  const lang = await status.evaluate(element => element.closest('[lang]')?.getAttribute('lang'));
  if (lang !== locale) errors.push(`the message "${await status.textContent()}" is in ${lang}, expected ${locale}`);

  // Its search link, then its close button, are in the keyboard order, and Escape there closes the message
  const search = await page.evaluate(() => document.querySelector('music-bridge-notice')?.shadowRoot?.querySelector('a')?.href);
  if (!search?.startsWith('https://www.deezer.com/search/')) errors.push(`the message's search link is ${search}, expected a Deezer search`);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const focusedOnTab = async () => {
    await page.keyboard.press('Tab');
    return page.evaluate(() => document.querySelector('music-bridge-notice')?.shadowRoot?.activeElement?.tagName);
  };
  const focused = [await focusedOnTab(), await focusedOnTab()];
  if (focused.join() !== 'A,BUTTON') errors.push(`Tab on the music page lands on ${focused.join(' → ')}, expected the message's search link → close button`);
  await page.keyboard.press('Escape');
  if (await page.locator('music-bridge-notice').count()) errors.push('Escape on the close button does not close the message');
  await page.close();
  return errors;
}

async function check(locale: string, colorScheme: 'light' | 'dark'): Promise<string[]> {
  const name = `${locale} ${colorScheme}`;
  const errors: string[] = [];
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    executablePath: process.env.CHROMIUM_PATH,
    locale,
    colorScheme,
    // As on Windows: the desktop app options are hidden on Linux, where CI runs
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`, `--lang=${locale}`],
  });
  try {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    const extensionId = new URL(worker.url()).host;
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`page error: ${error.message}`));
    // On install, the extension opens its options page (runtime.openOptionsPage), which can interrupt this navigation,
    // more than once: try again, a few times
    const optionsUrl = `chrome-extension://${extensionId}/options.html`;
    for (let attempt = 1; ; attempt++) {
      try {
        await page.goto(optionsUrl);
        break;
      } catch (error) {
        if (attempt === 5) throw error;
        await page.waitForTimeout(500);
      }
    }
    await page.waitForFunction(() => document.querySelector('#streaming-platforms option') !== null);

    // As it opens: the default platform, "Open links in the desktop app" unticked
    errors.push(...(await axe(page, 'as it opens')));

    // With the app option ticked: "Close the tab" and its help show up
    await page.selectOption('#streaming-platforms', 'deezer');
    await page.check('#open-app');
    if (!(await page.isVisible('#close-tab'))) errors.push('"Close the tab" is not shown once "Open links in the desktop app" is ticked');
    errors.push(...(await axe(page, 'with the app option')));
    const { ok, order } = await tabOrder(page, EXPECTED_TAB_ORDER);
    if (!ok) {
      errors.push(`keyboard order is ${order.join(' → ')}, expected ${EXPECTED_TAB_ORDER.join(' → ')}`);
    }

    // Saved as it changes: the confirmation next to the option ticked is announced
    await page.waitForFunction(() => document.querySelector('#open-app-status')?.textContent);
    const status = await page.evaluate(() => {
      const element = document.querySelector('#open-app-status')!;
      return { role: element.getAttribute('role'), text: element.textContent };
    });
    if (status.role !== 'status') errors.push(`the save confirmation "${status.text}" is not in a status live region`);
    errors.push(...(await axe(page, 'saved')));

    // Deezer is now the platform: a Spotify page it has no link for shows the message
    errors.push(...(await checkNotice(context, locale)));
  } finally {
    await context.close();
  }
  console.log(`${errors.length ? '✗' : '✓'} ${name}`);
  return errors.map(error => `${name}: ${error}`);
}

const errors: string[] = [];
for (const locale of ['en', 'fr']) {
  for (const colorScheme of ['light', 'dark'] as const) {
    errors.push(...(await check(locale, colorScheme)));
  }
}

if (errors.length) {
  console.error(`\n${errors.join('\n')}`);
  process.exit(1);
}
