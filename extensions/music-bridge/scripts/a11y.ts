/**
 * Accessibility checks of the options page.
 *
 * Loads the Chrome build (.output/chrome-mv3) in Chromium, in English and French, light and dark, and
 * checks the options page in three states: as it opens, with Deezer chosen and "Open links in the desktop app"
 * ticked (the "Close the tab" option and its help show up), and once saved:
 * - axe-core (@dume/dev-config/a11y: WCAG 2.2 A/AA, best practices, RGAA 4, EN 301 549) reports no violation;
 * - the keyboard order is platform → open in app → close the tab → Save → the Odesli link;
 * - the save confirmation is in a status live region, so screen readers announce it.
 *
 * Then, on a music page (served by the script, as the redirect service's "not on this platform" answer), it checks
 * the message Music Bridge shows when it cannot redirect: axe-core again, its text in a status live region, in the
 * extension's language, and its close button, reached with Tab, and Escape, which closes it.
 *
 * Usage: pnpm build && pnpm a11y
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { resolve } from 'node:path';
import { audit, tabOrder } from '@dume/dev-config/a11y';
import { chromium, type BrowserContext, type Page } from 'playwright';

const EXTENSION_DIR = resolve(import.meta.dirname, '../.output/chrome-mv3');

const EXPECTED_TAB_ORDER = ['#streaming-platforms', '#open-app', '#close-tab', 'button[type=submit]', 'footer a'];
const REDIRECT_SERVICE_URL = 'https://music-bridge-redirect.smndhm.workers.dev/';
// A Spotify page in English, whatever the extension's language: the message must say its own
const MUSIC_PAGE_URL = 'https://open.spotify.com/intl-en/track/0000000000000000000000';
const MUSIC_PAGE = '<!doctype html><html lang="en"><head><title>Spotify</title></head><body><main><h1>A track</h1></main></body></html>';

async function axe(page: Page, state: string): Promise<string[]> {
  return (await audit(page)).map(violation => `${state}: ${violation}`);
}

/** The message on a music page Music Bridge cannot redirect, the platform chosen being another one */
async function checkNotice(context: BrowserContext, locale: string): Promise<string[]> {
  const errors: string[] = [];
  // The redirect service has no link for this music, and the music page is ours: the check needs no network
  await context.route(`${REDIRECT_SERVICE_URL}**`, route => route.fulfill({ status: 404, json: { error: 'Not found' } }));
  await context.route(MUSIC_PAGE_URL, route => route.fulfill({ contentType: 'text/html', body: MUSIC_PAGE }));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`music page error: ${error.message}`));
  await page.goto(MUSIC_PAGE_URL);
  const status = page.locator('music-bridge-notice [role="status"]');
  await status.filter({ hasText: /\S/ }).waitFor({ timeout: 10_000 });
  errors.push(...(await axe(page, 'message')));
  const lang = await status.evaluate(element => element.closest('[lang]')?.getAttribute('lang'));
  if (lang !== locale) errors.push(`the message "${await status.textContent()}" is in ${lang}, expected ${locale}`);

  // Its close button is in the keyboard order, and Escape there closes the message
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.querySelector('music-bridge-notice')?.shadowRoot?.activeElement?.tagName);
  if (focused !== 'BUTTON') errors.push(`Tab on the music page lands on ${focused ?? 'the page'}, expected the message's close button`);
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
    // On install, the extension opens its options page in chrome://extensions, which can interrupt this navigation
    const optionsUrl = `chrome-extension://${extensionId}/options.html`;
    await page.goto(optionsUrl).catch(() => page.goto(optionsUrl));
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

    // Saved: the confirmation is announced
    await page.click('button[type=submit]');
    await page.waitForFunction(() => document.querySelector('#save-status')?.textContent);
    const status = await page.evaluate(() => {
      const element = document.querySelector('#save-status')!;
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
