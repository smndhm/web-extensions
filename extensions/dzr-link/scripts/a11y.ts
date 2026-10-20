/**
 * Accessibility checks of the moving page ("Deezer Link becomes Music Bridge", opened once on update).
 *
 * Loads the Chrome build (.output/chrome-mv3) in Chromium, in English and French, in light and dark, then checks:
 * - axe-core (@dume/dev-config/a11y: WCAG 2.2 A/AA, best practices, RGAA 4, EN 301 549) reports no violation;
 * - the keyboard order is the store link, then the uninstall button;
 * - the store link goes to Music Bridge on the Chrome Web Store.
 *
 * Usage: pnpm build && pnpm a11y
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { resolve } from 'node:path';
import { audit, tabOrder } from '@dume/dev-config/a11y';
import { chromium } from 'playwright';

const EXTENSION_DIR = resolve(import.meta.dirname, '../.output/chrome-mv3');
const EXPECTED_TAB_ORDER = ['#install', '#uninstall'];

async function check(locale: string, colorScheme: 'light' | 'dark'): Promise<string[]> {
  const name = `${locale} ${colorScheme}`;
  const errors: string[] = [];
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    executablePath: process.env.CHROMIUM_PATH,
    locale,
    colorScheme,
    args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`, `--lang=${locale}`],
  });
  try {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`page error: ${error.message}`));
    await page.goto(`chrome-extension://${new URL(worker.url()).host}/moving.html`);
    await page.waitForFunction(() => document.querySelector('h1')?.textContent);

    errors.push(...(await audit(page)));
    const { ok, order } = await tabOrder(page, EXPECTED_TAB_ORDER);
    if (!ok) errors.push(`keyboard order is ${order.join(' → ')}, expected ${EXPECTED_TAB_ORDER.join(' → ')}`);
    const href = await page.getAttribute('#install', 'href');
    if (!href?.startsWith('https://chromewebstore.google.com/detail/music-bridge/')) errors.push(`the store link is ${href}, expected Music Bridge on the Chrome Web Store`);
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
