/**
 * Renders the store screenshots: composed visuals, in English and French, each with one message
 * (the options page alone does not show what the extension does):
 * 1. a link from another platform opens on yours;
 * 2. the supported platforms.
 * They are 1280×800 PNGs, the size both the Chrome Web Store and addons.mozilla.org accept, saved to
 * .output/screenshots/. The track shown is a hit of the year in the screenshot's market (international for English,
 * France for French), with its cover from the public Deezer API (a gradient when there is none); the platforms appear by name only, without their logos.
 *
 * Usage: pnpm screenshots
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

const PLATFORMS = ['Amazon Music', 'Apple Music', 'Deezer', 'Pandora', 'Spotify', 'Tidal', 'YouTube Music', 'SoundCloud', 'YouTube'];

const TEXTS = {
  en: { question: 'A Spotify link?', answer: 'Opened on Deezer.', track: 'SWIM', artist: 'BTS', platforms: 'All your tracks and albums,<br>on the platform you choose' },
  fr: {
    question: 'Un lien Spotify ?',
    answer: 'Ouvert sur Deezer.',
    track: 'Maladie',
    artist: 'Mauvais Djo',
    platforms: 'Tous vos titres et albums,<br>sur la plateforme de votre choix',
  },
};

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
  .cover { width: 72px; height: 72px; flex: none; border-radius: 12px; background: conic-gradient(from 30deg, #ff5a8a, #ff9f45, #ffd23f, #4fd8ff, #a46bd6, #ff5a8a); }
  .links img { width: 84px; height: 84px; }
  .platforms { display: grid; grid-template-columns: repeat(3, auto); gap: 16px 18px; margin-top: 46px; }
  .platforms span { padding: 16px 30px; border: 1px solid #ffffff30; border-radius: 40px; background: #ffffff14; font-size: 26px; text-align: center; }
`;

/** Case and accent insensitive comparison */
const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;

/** The track's cover from the public Deezer API, as a data URL, or undefined (with a warning) when there is none */
async function cover(track: string, artist: string): Promise<string | undefined> {
  try {
    const search = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(`${artist} ${track}`)}&limit=25`);
    const { data = [], error } = (await search.json()) as {
      data?: { title: string; artist: { name: string }; album: { cover_big: string } }[];
      error?: { message: string };
    };
    if (error) throw new Error(error.message);
    const found = data.find(result => same(result.artist.name, artist) && same(result.title, track)) ?? data.find(result => same(result.artist.name, artist));
    if (!found) throw new Error(`not found among ${data.length} results`);
    const image = await fetch(found.album.cover_big);
    return `data:${image.headers.get('content-type') ?? 'image/jpeg'};base64,${Buffer.from(await image.arrayBuffer()).toString('base64')}`;
  } catch (error) {
    console.warn(`No cover for ${track} (${artist}), a gradient instead: ${error instanceof Error ? error.message : error}`);
    return undefined;
  }
}

const link = (url: string, track: string, artist: string, image?: string) =>
  `<div class="link"><div class="cover"${image ? ` style="background: url(${image}) center / cover"` : ''}></div><div><small>${url}</small><b>${track}</b><span>${artist}</span></div></div>`;

const visuals = (texts: (typeof TEXTS)['en'], image?: string) => [
  `<h1 style="font-size: 68px">${texts.question}<br><em>${texts.answer}</em></h1>
   <div class="links">${link('open.spotify.com/track/…', texts.track, texts.artist, image)}<img src="${icon}" alt="">${link('deezer.com/track/…', texts.track, texts.artist, image)}</div>`,
  `<h1 style="font-size: 60px">${texts.platforms}</h1>
   <div class="platforms">${PLATFORMS.map(platform => `<span>${platform}</span>`).join('')}</div>`,
];

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch({ channel: 'chromium', executablePath: process.env.CHROMIUM_PATH });
try {
  const page = await browser.newPage({ viewport: VIEWPORT });
  for (const [locale, texts] of Object.entries(TEXTS)) {
    const image = await cover(texts.track, texts.artist);
    for (const [index, body] of visuals(texts, image).entries()) {
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
