/**
 * Renders the store screenshots: composed visuals, in English and French, each with one message
 * (the options page alone does not show what the extension does):
 * 1. a link from another platform opens on yours;
 * 2. the supported platforms.
 * They are 1280×800 PNGs, the size both the Chrome Web Store and addons.mozilla.org accept, saved to
 * .output/screenshots/screenshot-1280x800-<locale>-<n>.png. The platforms appear by name only, without their logos.
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

import { mkdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '../../..');
const OUTPUT_DIR = resolve(import.meta.dirname, '../.output/screenshots');
const VIEWPORT = { width: 1280, height: 800 };
// Bricolage Grotesque (SIL Open Font License), as on the promotional tiles (scripts/store-assets.ts)
const FONT = 'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2';

// Roughly by audience, largest first
const PLATFORMS = ['Spotify', 'YouTube Music', 'Apple Music', 'Amazon Music', 'YouTube', 'SoundCloud', 'Deezer', 'Tidal', 'Pandora'];

const TEXTS: Record<string, { question: string; answer: string; platforms: string }> = {
  en: { question: 'A Spotify link?', answer: 'Opened on Deezer.', platforms: 'All your tracks and albums,<br>on the platform you choose' },
  fr: { question: 'Un lien Spotify ?', answer: 'Ouvert sur Deezer.', platforms: 'Tous vos titres et albums,<br>sur la plateforme de votre choix' },
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

const dataUrl = async (file: string, type: string) => `data:${type};base64,${(await readFile(resolve(ROOT, file))).toString('base64')}`;
const font = await dataUrl(FONT, 'font/woff2');
const icon = await dataUrl('extensions/music-bridge/assets/icon.png', 'image/png');

const style = `
  @font-face { font-family: 'Bricolage Grotesque'; font-weight: 200 800; src: url(${font}); }
  html, body { margin: 0; width: ${VIEWPORT.width}px; height: ${VIEWPORT.height}px; overflow: hidden; }
  body {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: radial-gradient(circle at 15% 20%, #2f2448, #121216 70%); color: #fff; font-family: 'Bricolage Grotesque', sans-serif;
  }
  h1 { margin: 0; font-weight: 800; text-align: center; line-height: 1.06; }
  h1 em { font-style: normal; color: #ff9fbf; }
  .links { display: flex; align-items: center; gap: 34px; margin-top: 64px; }
  .link { width: 390px; box-sizing: border-box; display: flex; gap: 18px; align-items: center; padding: 22px 26px; border-radius: 18px; background: #fff; color: #1b1b1f; font: 16px system-ui, sans-serif; }
  .link small { display: block; color: #888; font-size: 16px; }
  .link b { display: block; margin-top: 4px; font-size: 21px; }
  .link span { display: block; margin-top: 2px; color: #555; font-size: 17px; }
  .cover { width: 72px; height: 72px; flex: none; border-radius: 12px; background: #ddd center / cover; }
  .links img { width: 84px; height: 84px; }
  .platforms { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px 18px; max-width: 1000px; margin-top: 46px; }
  .platforms span { padding: 16px 30px; border: 1px solid #ffffff30; border-radius: 40px; background: #ffffff14; font-size: 26px; text-align: center; }
`;

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

const link = (url: string, { title, artist, cover }: Awaited<ReturnType<typeof track>>) =>
  `<div class="link"><div class="cover" style="background-image: url(${cover})"></div><div><small>${url}</small><b>${escape(title)}</b><span>${escape(artist)}</span></div></div>`;

const visuals = (texts: (typeof TEXTS)[string], shown: Awaited<ReturnType<typeof track>>) => [
  `<h1 style="font-size: 68px">${texts.question}<br><em>${texts.answer}</em></h1>
   <div class="links">${link('open.spotify.com/track/…', shown)}<img src="${icon}" alt="">${link('deezer.com/track/…', shown)}</div>`,
  `<h1 style="font-size: 60px">${texts.platforms}</h1>
   <div class="platforms">${PLATFORMS.map(platform => `<span>${platform}</span>`).join('')}</div>`,
];

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch({ channel: 'chromium', executablePath: process.env.CHROMIUM_PATH });
try {
  const page = await browser.newPage({ viewport: VIEWPORT });
  for (const [locale, texts] of Object.entries(TEXTS)) {
    const shown = await track(locale);
    for (const [index, body] of visuals(texts, shown).entries()) {
      await page.setContent(`<!doctype html><html lang="${locale}"><style>${style}</style><body>${body}</body></html>`);
      await page.evaluate(() => document.fonts.ready);
      const file = resolve(OUTPUT_DIR, `screenshot-1280x800-${locale}-${index + 1}.png`);
      await page.screenshot({ path: file });
      console.log(file);
    }
  }
} finally {
  await browser.close();
}
