/**
 * Renders the store screenshots: composed visuals, in English and French, each with one message
 * (the options page alone does not show what the extension does):
 * 1. a link from another platform opens on yours;
 * 2. the supported platforms.
 * They are 1280×800 PNGs, the size both the Chrome Web Store and addons.mozilla.org accept, saved to
 * .output/screenshots/screenshot-1280x800-<locale>-<n>.png. The platforms appear by name only, without their logos.
 * They use @dume/ds's classes alone, in its dark theme and the extension's color, as the promotional tiles
 * (scripts/store-assets.ts): their size comes from the screenshot's scale, the design system's sizes growing with it.
 *
 * The track shown, its title, artist and cover, comes from the public Deezer API: the first track of the playlist
 * PLAYLISTS gives for the language, as "<locale>:<playlist ID>" (comma separated); by default
 * "en:3155776842,fr:1109890291", Top Worldwide for English and Top France for French. TRACKS can give a Deezer
 * track ID to show in every language instead.
 *
 * Usage: pnpm screenshots
 *        TRACKS=3135556 pnpm screenshots
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { logo } from './logo.ts';

const OUTPUT_DIR = resolve(import.meta.dirname, '../.output/screenshots');
// The window at a scale that makes 1280×800, wider by the room the design system keeps for a scrollbar, left out of the image
const VIEWPORT = { width: 1120, height: 700, scale: 8 / 7 };
const SCROLLBAR = 15;
// The design system's stylesheet, from a file so that its fonts load, and the color of the options page
const DESIGN_SYSTEM = pathToFileURL(createRequire(import.meta.url).resolve('@dume/ds/styles.css')).href;
const COLOR = (await readFile(resolve(import.meta.dirname, '../entrypoints/options/style.css'), 'utf8')).match(/--ds-b-color-primary: (light-dark\([^;]+\));/)![1]!;

// Deezer first, then roughly by audience
const PLATFORMS = ['Deezer', 'Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'YouTube', 'SoundCloud', 'Tidal', 'Pandora'];

const TEXTS: Record<string, { question: string; answer: string; more: string; platforms: string }> = {
  en: {
    question: 'A Spotify link?',
    answer: 'Opened on Deezer.',
    more: 'And every other way: Apple Music, YouTube Music, Tidal, Amazon Music…',
    platforms: 'All your tracks and albums, on the platform you choose',
  },
  fr: {
    question: 'Un lien Spotify ?',
    answer: 'Ouvert sur Deezer.',
    more: 'Et dans tous les sens : Apple Music, YouTube Music, Tidal, Amazon Music…',
    platforms: 'Tous vos titres et albums, sur la plateforme de votre choix',
  },
};
const PLAYLISTS = Object.fromEntries(
  (process.env.PLAYLISTS?.trim() || 'en:3155776842,fr:1109890291')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(set => {
      const [locale, playlist] = set.split(':');
      if (!locale || !playlist) throw new Error(`PLAYLISTS: "${set}" is not <locale>:<playlist ID>`);
      return [locale, playlist];
    }),
);
const TRACK_ID = (process.env.TRACKS ?? '').split(/[\s,]+/).find(Boolean);

interface DeezerTrack {
  title: string;
  artist: { name: string };
  album: { cover_big: string };
}

const icon = `data:image/svg+xml;base64,${Buffer.from(await logo({ original: true })).toString('base64')}`;

async function deezer<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.deezer.com/${path}`);
  const body = (await response.json()) as T & { error?: { message: string } };
  if (!response.ok || body.error) throw new Error(`Deezer API: ${body.error?.message ?? response.status} for ${path}`);
  return body;
}

/** The track to show in a language, with its cover as a data URL */
async function track(locale: string): Promise<{ title: string; artist: string; cover: string }> {
  const playlist = PLAYLISTS[locale];
  if (!TRACK_ID && !playlist) throw new Error(`PLAYLISTS: no playlist for ${locale}`);
  const found = TRACK_ID ? await deezer<DeezerTrack>(`track/${TRACK_ID}`) : (await deezer<{ data: DeezerTrack[] }>(`playlist/${playlist}/tracks?limit=1`)).data[0];
  if (!found) throw new Error(`Deezer API: playlist ${playlist} is empty`);
  const image = await fetch(found.album.cover_big);
  const cover = `data:${image.headers.get('content-type') ?? 'image/jpeg'};base64,${Buffer.from(await image.arrayBuffer()).toString('base64')}`;
  console.log(`${locale}: ${found.title} (${found.artist.name})`);
  return { title: found.title, artist: found.artist.name, cover };
}

const escape = (text: string) => text.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);

/** A link's preview: the cover, as high as its three lines (16px × 1.2 each, 8px between the address and the title), then the address, the title and the artist */
const link = (url: string, { title, artist, cover }: Awaited<ReturnType<typeof track>>) =>
  `<div class="ds-c-card ds-c-card--horizontal"><img src="${cover}" alt="" width="66" height="66"><div><p>${url}</p><p><strong>${escape(title)}</strong><br>${escape(artist)}</p></div></div>`;

/** Each visual, centered: its heading, the answer in the extension's color, then the links or the platforms */
const visuals = (texts: (typeof TEXTS)[string], shown: Awaited<ReturnType<typeof track>>) => [
  `<div class="ds-c-hero"><h1 class="ds-u-text-center">${texts.question}<br><span class="ds-u-text-primary">${texts.answer}</span></h1></div>
   <div class="ds-l-cluster ds-l-cluster--equal">${link('open.spotify.com/track/…', shown)}<img src="${icon}" alt="" width="72" height="72">${link('deezer.com/track/…', shown)}</div>
   <p class="ds-u-text-center ds-u-text-muted">${texts.more}</p>`,
  `<div class="ds-c-hero" style="--ds-c-hero-size-heading: var(--ds-b-size-48)"><h1 class="ds-u-text-center">${texts.platforms}</h1></div>
   <ul class="ds-l-cluster ds-l-cluster--center" role="list">${PLATFORMS.map(platform => `<li class="ds-c-card">${platform}</li>`).join('')}</ul>`,
];

/** A screenshot's page. Its font, the design system's printed one: a screenshot should not depend on the fonts of the computer that takes it */
const html = (locale: string, body: string) => `<!doctype html>
<html lang="${locale}" data-theme="dark">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="${DESIGN_SYSTEM}">
<style>:root { --ds-b-color-primary: ${COLOR}; --ds-b-font-family: 'Instrument Sans', system-ui, sans-serif; }</style>
</head>
<body class="ds-l-page ds-l-page--centered ds-l-page--tinted">
<main class="ds-l-page__main">
${body}
</main>
</body>
</html>`;

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });

const temporary = await mkdtemp(join(tmpdir(), 'screenshots-'));
const browser = await chromium.launch({ channel: 'chromium', executablePath: process.env.CHROMIUM_PATH });
try {
  const page = await browser.newPage({ viewport: { width: VIEWPORT.width + SCROLLBAR, height: VIEWPORT.height }, deviceScaleFactor: VIEWPORT.scale });
  const source = join(temporary, 'screenshot.html');
  for (const [locale, texts] of Object.entries(TEXTS)) {
    const shown = await track(locale);
    for (const [index, body] of visuals(texts, shown).entries()) {
      await writeFile(source, html(locale, body));
      await page.goto(pathToFileURL(source).href);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(img => img.decode()));
      });
      const file = resolve(OUTPUT_DIR, `screenshot-1280x800-${locale}-${index + 1}.png`);
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height } });
      console.log(file);
    }
  }
} finally {
  await browser.close();
  await rm(temporary, { recursive: true });
}
