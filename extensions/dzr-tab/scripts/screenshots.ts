/**
 * Takes store screenshots of the new tab page with real Deezer tracks.
 *
 * Loads the Chrome build (.output/chrome-mv3) in Chromium, opens the new tab page once per
 * screenshot and saves 1280×800 PNGs, the size both the Chrome Web Store and
 * addons.mozilla.org accept, to .output/screenshots/.
 *
 * Usage: pnpm build && pnpm screenshots [count]
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const EXTENSION_DIR = resolve(import.meta.dirname, '../.output/chrome-mv3');
const OUTPUT_DIR = resolve(import.meta.dirname, '../.output/screenshots');
const VIEWPORT = { width: 1280, height: 800 };
const COUNT = Number(process.argv[2] ?? 5);
// Some covers yield no usable palette, or repeat a track already captured: allow a few retries
const MAX_ATTEMPTS = COUNT * 4;

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });

const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  executablePath: process.env.CHROMIUM_PATH,
  viewport: VIEWPORT,
  args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`],
});

// Open the new tab once to learn the extension page's chrome-extension:// URL
const page = await context.newPage();
await page.goto('chrome://newtab/');
const newTabUrl = page.url();
if (!newTabUrl.startsWith('chrome-extension://')) {
  throw new Error(`The extension did not override the new tab page (got ${newTabUrl}). Did you run pnpm build?`);
}

const titles = new Set<string>();

for (let attempt = 1; titles.size < COUNT && attempt <= MAX_ATTEMPTS; attempt++) {
  // The first load fetches tracks from the Deezer API and caches them for an hour; each reload
  // then picks a random cached track
  await page.goto(newTabUrl);

  const ready = await page
    .waitForFunction(
      () => {
        const cover = document.querySelector<HTMLImageElement>('.track-cover img');
        return document.body.style.backgroundImage !== '' && cover !== null && cover.complete && cover.naturalWidth > 0;
      },
      undefined,
      { timeout: 15_000 },
    )
    .then(() => true)
    .catch(() => false);
  if (!ready) continue;

  await page.evaluate(() => document.fonts.ready);
  const title = (await page.locator('.track-title').textContent())?.trim() ?? '';
  const artist = (await page.locator('.track-artist').textContent())?.trim() ?? '';
  if (!title || titles.has(title)) continue;
  titles.add(title);

  const file = resolve(OUTPUT_DIR, `screenshot-${titles.size}.png`);
  await page.screenshot({ path: file });
  console.log(`${file}: ${title} – ${artist}`);
}

await context.close();

if (titles.size < COUNT) {
  throw new Error(`Only ${titles.size} of ${COUNT} screenshots could be taken.`);
}
