/**
 * Takes store screenshots of the new tab page with real Deezer tracks.
 *
 * The tracks are the Deezer track IDs in TRACKS (comma separated), or else the top of the Deezer
 * chart. Each one is put alone in the extension's track cache before opening the new tab page, so
 * the page shows it. Loads the Chrome build (.output/chrome-mv3) in Chromium and saves 1280×800
 * PNGs, the size the stores accept, to .output/screenshots/.
 *
 * Usage: pnpm build && pnpm screenshots [count]
 *        TRACKS=3135556,916424 pnpm screenshots
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import type { DeezerTrack } from '../utils/deezer';

const EXTENSION_DIR = resolve(import.meta.dirname, '../.output/chrome-mv3');
const OUTPUT_DIR = resolve(import.meta.dirname, '../.output/screenshots');
const VIEWPORT = { width: 1280, height: 800 };
const COUNT = Number(process.argv[2] || 5);
const TRACK_IDS = (process.env.TRACKS ?? '').split(/[\s,]+/).filter(Boolean);

async function deezer<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.deezer.com/${path}`);
  const body = (await response.json()) as T & { error?: { message: string } };
  if (!response.ok || body.error) throw new Error(`Deezer API: ${body.error?.message ?? response.status} for ${path}`);
  return body;
}

// Without track IDs, take more chart tracks than needed: some covers yield no usable palette
const tracks = TRACK_IDS.length
  ? await Promise.all(TRACK_IDS.map(id => deezer<DeezerTrack>(`track/${id}`)))
  : (await deezer<{ data: DeezerTrack[] }>(`chart/0/tracks?limit=${COUNT * 2}`)).data;
const wanted = TRACK_IDS.length || COUNT;

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

let taken = 0;
for (const track of tracks) {
  if (taken === wanted) break;
  // The cache of utils/deezer.ts (local:tracks), fresh: the page shows this track without calling the API
  await page.evaluate(
    // @ts-expect-error chrome is the extension API on the extension page
    cached => chrome.storage.local.set({ tracks: { tracks: [cached], fetchedAt: Date.now() } }),
    { type: 'track', title: track.title, link: track.link, artist: track.artist, album: track.album },
  );
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
  if (!ready) {
    console.warn(`Skipped ${track.title} – ${track.artist.name}: no cover or no palette`);
    continue;
  }

  await page.evaluate(() => document.fonts.ready);
  const file = resolve(OUTPUT_DIR, `screenshot-${++taken}.png`);
  await page.screenshot({ path: file });
  console.log(`${file}: ${track.title} – ${track.artist.name}`);
}

await context.close();

if (taken < wanted) {
  throw new Error(`Only ${taken} of ${wanted} screenshots could be taken.`);
}
