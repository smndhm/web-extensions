/**
 * Renders each extension's images from one source icon, the same way for all extensions:
 * - public/icons/{16,32,48,128}.png, the manifest icons;
 * - store/icon-128x128.png, store/logo-300x300.png, and store/promo-440x280-<locale>.png and store/promo-1400x560-<locale>.png
 *   (promotional tiles) for each locale, named after their type and size, for the store listings: the icon, the name and
 *   the description of the extension (public/_locales/<locale>/messages.json) on a dark background.
 * Music Bridge's manifest icons are its logo in the colors of the current version, drawn at random for each release
 * (extensions/music-bridge/scripts/logo.ts); its store images keep the logo's own colors.
 *
 * Usage: pnpm store-assets [extension…], all extensions by default
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { mkdir, readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
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
const extensions = process.argv.slice(2);
for (const extension of extensions) if (!SOURCES[extension]) throw new Error(`Usage: pnpm store-assets [${Object.keys(SOURCES).join('|')}…]`);
const ICON_SIZES = [16, 32, 48, 128];
// Chrome Web Store image guidelines: the 128 px icon is 96 px of artwork with 16 px of transparent padding
// per side. The smaller toolbar icons use their whole size.
const iconPadding = (size: number) => (size === 128 ? 16 : 0);
// Bricolage Grotesque (SIL Open Font License), the title font of simon.duhem.fr
const FONT = 'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2';

const dataUrl = async (file: string, type: string) => `data:${type};base64,${(await readFile(resolve(ROOT, file))).toString('base64')}`;
const escape = (text: string) => text.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);

const fontFace = `@font-face { font-family: 'Bricolage Grotesque'; font-weight: 200 800; src: url(${await dataUrl(FONT, 'font/woff2')}); }`;

/** Just the icon, on a transparent background */
const iconOnly = (icon: string, size: number, padding = 0) =>
  `<style>html, body { margin: 0; } img { display: block; width: ${size - 2 * padding}px; height: ${size - 2 * padding}px; padding: ${padding}px; }</style><img src="${icon}">`;

/** Store tile: the icon, then the name and the description */
function tile(icon: string, name: string, description: string, { iconSize, nameSize, textSize, gap }: { iconSize: number; nameSize: number; textSize: number; gap: number }) {
  return `
    <style>
      ${fontFace}
      html, body { margin: 0; height: 100%; }
      body {
        display: flex; align-items: center; justify-content: center; gap: ${gap}px; padding: 0 ${gap}px; box-sizing: border-box;
        background: radial-gradient(circle at 20% 30%, #2a2140, #121216 70%); color: #fff; font-family: 'Bricolage Grotesque', sans-serif;
      }
      img { width: ${iconSize}px; height: ${iconSize}px; flex: none; }
      h1 { margin: 0 0 ${nameSize * 0.25}px; font-size: ${nameSize}px; line-height: 1.05; font-weight: 800; }
      p { margin: 0; font-size: ${textSize}px; line-height: 1.3; font-weight: 400; color: #d6d4dc; }
    </style>
    <img src="${icon}"><div><h1>${escape(name)}</h1><p>${escape(description)}</p></div>`;
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
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

try {
  for (const [extension, source] of Object.entries(SOURCES).filter(([name]) => !extensions.length || extensions.includes(name))) {
    const dir = resolve(ROOT, 'extensions', extension);
    const { icon, store } = await source();
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
      const small = { iconSize: 104, nameSize: 30, textSize: 15, gap: 24 };
      const marquee = { iconSize: 300, nameSize: 84, textSize: 36, gap: 80 };
      await shoot(tile(store, name, description, small), 440, 280, resolve(dir, `store/promo-440x280-${locale}.png`));
      await shoot(tile(store, name, description, marquee), 1400, 560, resolve(dir, `store/promo-1400x560-${locale}.png`));
    }
  }
} finally {
  await browser.close();
}
