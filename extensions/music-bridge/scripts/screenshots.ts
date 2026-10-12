/**
 * Takes store screenshots of the options page.
 *
 * Loads the Chrome build (.output/chrome-mv3) in Chromium, opens the options page in English and
 * French, light and dark, with Deezer chosen and "Open in desktop app" ticked, and saves 1280×800
 * PNGs, the size both the Chrome Web Store and addons.mozilla.org accept, to .output/screenshots/.
 *
 * Usage: pnpm build && pnpm screenshots
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const EXTENSION_DIR = resolve(import.meta.dirname, '../.output/chrome-mv3');
const OUTPUT_DIR = resolve(import.meta.dirname, '../.output/screenshots');
const VIEWPORT = { width: 1280, height: 800 };
// The options page is made to fit in the browser settings: enlarge it to fill the screenshot
const ZOOM = 1.75;

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });

for (const locale of ['en', 'fr']) {
  for (const colorScheme of ['light', 'dark'] as const) {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      executablePath: process.env.CHROMIUM_PATH,
      viewport: VIEWPORT,
      locale,
      colorScheme,
      args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`, `--lang=${locale}`],
    });
    try {
      const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
      const extensionId = new URL(worker.url()).host;
      // @ts-expect-error chrome is the extension API in the service worker
      await worker.evaluate(() => chrome.storage.local.set({ platform: 'deezer', openInApp: true }));

      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/options.html`);
      await page.waitForFunction(() => document.querySelector('#streaming-platforms option') !== null);
      await page.addStyleTag({ content: `html { zoom: ${ZOOM}; }` });
      await page.evaluate(() => document.fonts.ready);

      const file = resolve(OUTPUT_DIR, `screenshot-1280x800-${locale}-${colorScheme}.png`);
      await page.screenshot({ path: file });
      console.log(file);
    } finally {
      await context.close();
    }
  }
}
