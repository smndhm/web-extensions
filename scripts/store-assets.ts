/**
 * Renders each extension's images from one source icon, the same way for all extensions:
 * - public/icons/{16,32,48,128}.png, the manifest icons;
 * - store/icon-128x128.png, store/logo-300x300.png, and store/promo-440x280-<locale>.png and store/promo-1400x560-<locale>.png
 *   (promotional tiles) for each locale, named after their type and size, for the store listings: the icon, the name and
 *   the description of the extension (public/_locales/<locale>/messages.json), with @dume/ds's classes alone, in its dark
 *   theme and the extension's color. Their size comes from the screenshot's scale, the design system's sizes growing with it.
 * Music Bridge's manifest icons are its logo in the colors of the current version, drawn at random for each release
 * (extensions/music-bridge/scripts/logo.ts); its store images keep the logo's own colors.
 *
 * Usage: pnpm store-assets [extension…], all extensions by default
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { logo } from '../extensions/music-bridge/scripts/logo.ts';

const ROOT = resolve(import.meta.dirname, '..');
// Playwright is a dependency of the extensions with browser scripts
const { chromium } = createRequire(resolve(ROOT, 'extensions/dzr-tab/package.json'))('playwright') as typeof import('playwright');

const svgDataUrl = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const deezerHeart = async () => svgDataUrl(await readFile(resolve(ROOT, 'shared/assets/deezer-heart.svg'), 'utf8'));
/** Each extension's icon for the manifest and for the store images, as SVG data URLs */
const SOURCES: Record<string, () => Promise<{ icon: string; store: string }>> = {
  'dzr-link': async () => ({ icon: await deezerHeart(), store: await deezerHeart() }),
  'dzr-tab': async () => ({ icon: await deezerHeart(), store: await deezerHeart() }),
  'music-bridge': async () => ({ icon: svgDataUrl(await logo()), store: svgDataUrl(await logo({ original: true })) }),
};
/** Each extension's color, as on its pages: the design system's states and gradient come from it */
const pageColor = async (file: string) => (await readFile(resolve(ROOT, file), 'utf8')).match(/--ds-b-color-primary: (light-dark\([^;]+\));/)![1]!;
const COLORS: Record<string, () => Promise<string>> = {
  'dzr-link': () => pageColor('extensions/dzr-link/entrypoints/moving/style.css'),
  // Deezer Tab's pages do not use the design system: a purple close to its heart, whose contrasts pass its tests
  'dzr-tab': async () => 'light-dark(#7b1fd6, #c58bff)',
  'music-bridge': () => pageColor('extensions/music-bridge/entrypoints/options/style.css'),
};
const extensions = process.argv.slice(2);
for (const extension of extensions) if (!SOURCES[extension]) throw new Error(`Usage: pnpm store-assets [${Object.keys(SOURCES).join('|')}…]`);
const ICON_SIZES = [16, 32, 48, 128];
// Chrome Web Store image guidelines: the 128 px icon is 96 px of artwork with 16 px of transparent padding
// per side. The smaller toolbar icons use their whole size.
const iconPadding = (size: number) => (size === 128 ? 16 : 0);
// The design system, a dependency of the extensions that use it. Its fonts are next to its stylesheet: the tiles are files, so that they load
const DESIGN_SYSTEM = pathToFileURL(createRequire(resolve(ROOT, 'extensions/dzr-link/package.json')).resolve('@dume/ds/styles.css')).href;
// A tile's window at a scale that makes its image's size, wider by the room the design system keeps for a scrollbar, left out of the image
const TILES = [
  { name: 'promo-440x280', width: 660, height: 420, scale: 2 / 3 },
  { name: 'promo-1400x560', width: 875, height: 350, scale: 1.6 },
];
const SCROLLBAR = 15;

const escape = (text: string) => text.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);

/** Just the icon, on a transparent background */
const iconOnly = (icon: string, size: number, padding = 0) =>
  `<style>html, body { margin: 0; } img { display: block; width: ${size - 2 * padding}px; height: ${size - 2 * padding}px; padding: ${padding}px; }</style><img src="${icon}">`;

/** Store tile: the icon, then the name and the description. Its font, the design system's printed one: a screenshot should not depend on the fonts of the computer that takes it */
const tile = (locale: string, color: string, icon: string, name: string, description: string) => `<!doctype html>
<html lang="${locale}" data-theme="dark">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="${DESIGN_SYSTEM}">
<style>:root { --ds-b-color-primary: ${color}; --ds-b-font-family: 'Instrument Sans', system-ui, sans-serif; }</style>
</head>
<body class="ds-l-page ds-l-page--centered ds-l-page--tinted">
<main class="ds-l-page__main">
<div class="ds-c-hero ds-c-hero--media"><img class="ds-c-hero__media" src="${icon}" alt=""><hgroup><h1>${escape(name)}</h1><p>${escape(description)}</p></hgroup></div>
</main>
</body>
</html>`;

const browser = await chromium.launch({ channel: 'chromium', executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();

async function shoot(html: string, width: number, height: number, file: string, transparent = false) {
  await page.setViewportSize({ width, height });
  await page.setContent(html);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(img => img.decode()));
  });
  await page.screenshot({ path: file, omitBackground: transparent });
  console.log(`${file.slice(ROOT.length + 1)} (${width}×${height})`);
}

/** A tile's image: from a file, for the design system's stylesheet and fonts */
async function shootTile(html: string, directory: string, { width, height, scale }: (typeof TILES)[number], file: string) {
  const context = await browser.newContext({ viewport: { width: width + SCROLLBAR, height }, deviceScaleFactor: scale });
  const tab = await context.newPage();
  const source = join(directory, 'tile.html');
  await writeFile(source, html);
  await tab.goto(pathToFileURL(source).href);
  await tab.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(img => img.decode()));
  });
  await tab.screenshot({ path: file, clip: { x: 0, y: 0, width, height } });
  await context.close();
  console.log(`${file.slice(ROOT.length + 1)} (${Math.round(width * scale)}×${Math.round(height * scale)})`);
}

const temporary = await mkdtemp(join(tmpdir(), 'store-assets-'));
try {
  for (const [extension, source] of Object.entries(SOURCES).filter(([name]) => !extensions.length || extensions.includes(name))) {
    const dir = resolve(ROOT, 'extensions', extension);
    const { icon, store } = await source();
    const color = await COLORS[extension]!();
    await mkdir(resolve(dir, 'public/icons'), { recursive: true });
    await mkdir(resolve(dir, 'store'), { recursive: true });

    for (const iconSize of ICON_SIZES) {
      await shoot(iconOnly(icon, iconSize, iconPadding(iconSize)), iconSize, iconSize, resolve(dir, `public/icons/${iconSize}.png`), true);
    }
    // The store icon, in the store images' colors: the same as the manifest's for every extension but Music Bridge
    await shoot(iconOnly(store, 128, iconPadding(128)), 128, 128, resolve(dir, 'store/icon-128x128.png'), true);
    await shoot(iconOnly(store, 300), 300, 300, resolve(dir, 'store/logo-300x300.png'), true);
    // One set of promo tiles per locale, for the store listing in that language
    for (const locale of await readdir(resolve(dir, 'public/_locales'))) {
      const messages = JSON.parse(await readFile(resolve(dir, `public/_locales/${locale}/messages.json`), 'utf8')) as Record<string, { message: string }>;
      const [name, description] = [messages.name!.message, messages.description!.message];
      for (const size of TILES) await shootTile(tile(locale, color, store, name, description), temporary, size, resolve(dir, `store/${size.name}-${locale}.png`));
    }
  }
} finally {
  await browser.close();
  await rm(temporary, { recursive: true });
}
