/**
 * Takes store screenshots of the new tab page with real Deezer tracks, one set per listing language.
 *
 * PLAYLISTS gives each set's language and Deezer playlist, as "<locale>:<playlist ID>" (comma
 * separated); by default "en:3155776842,fr:1109890291", Top Worldwide for the English listings and
 * Top France for the French ones. Each set takes the first tracks of its playlist, or the Deezer track
 * IDs in TRACKS (comma separated) for every set. Each track is put alone in the extension's track
 * cache before opening the new tab page, so the page shows it. Loads the Chrome build
 * (.output/chrome-mv3) in Chromium, in the set's language, and saves 1280×800 PNGs, the size the stores
 * accept, to .output/screenshots/screenshot-1280x800-<locale>-<n>.png.
 *
 * Usage: pnpm build && pnpm screenshots [count]
 *        PLAYLISTS=fr:1109890291 pnpm screenshots 6
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
const SETS = (process.env.PLAYLISTS?.trim() || 'en:3155776842,fr:1109890291')
  .split(/[\s,]+/)
  .filter(Boolean)
  .map(set => {
    const [locale, playlist] = set.split(':');
    if (!locale || !playlist) throw new Error(`PLAYLISTS: "${set}" is not <locale>:<playlist ID>`);
    return { locale, playlist };
  });

async function deezer<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.deezer.com/${path}`);
  const body = (await response.json()) as T & { error?: { message: string } };
  if (!response.ok || body.error) throw new Error(`Deezer API: ${body.error?.message ?? response.status} for ${path}`);
  return body;
}

async function playlistTracks(id: string, limit: number): Promise<DeezerTrack[]> {
  const { title } = await deezer<{ title: string }>(`playlist/${id}`);
  console.log(`Playlist ${id}: ${title}`);
  return (await deezer<{ data: DeezerTrack[] }>(`playlist/${id}/tracks?limit=${limit}`)).data;
}

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });

async function takeSet({ locale, playlist }: { locale: string; playlist: string }) {
  // Without track IDs, take more tracks than needed: some covers yield no usable palette
  const tracks = TRACK_IDS.length ? await Promise.all(TRACK_IDS.map(id => deezer<DeezerTrack>(`track/${id}`))) : await playlistTracks(playlist, COUNT * 2);
  const wanted = TRACK_IDS.length || COUNT;

  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    executablePath: process.env.CHROMIUM_PATH,
    viewport: VIEWPORT,
    locale,
    // The extension's UI language (browser.i18n), as for a user of this listing
    args: [`--lang=${locale}`, `--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`],
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
    const file = resolve(OUTPUT_DIR, `screenshot-1280x800-${locale}-${++taken}.png`);
    await page.screenshot({ path: file });
    console.log(`${file}: ${track.title} – ${track.artist.name}`);
  }

  await context.close();

  if (taken < wanted) {
    throw new Error(`${locale}: only ${taken} of ${wanted} screenshots could be taken.`);
  }
}

for (const set of SETS) await takeSet(set);
