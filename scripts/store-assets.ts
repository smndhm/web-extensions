/**
 * Renders each extension's images from one source icon, the same way for all extensions:
 * - public/icons/{16,32,48,128}.png, the manifest icons;
 * - medias/300x300.png (logo), medias/440x280.png and medias/1400x560.png (promotional tiles),
 *   named after their size, for the store listings: the icon, the name and the description of the extension
 *   (public/_locales/en/messages.json) on a dark background.
 * A PNG source only gives the icons it is at least as large as.
 *
 * Usage: pnpm store-assets
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
// Playwright is a dependency of the extensions with browser scripts
const { chromium } = createRequire(resolve(ROOT, 'extensions/dzr-tab/package.json'))('playwright') as typeof import('playwright');

const DEEZER_HEART = 'packages/shared/assets/deezer-heart.svg';
const SOURCES: Record<string, { source: string; size: number }> = {
  'dzr-link': { source: DEEZER_HEART, size: Infinity },
  'dzr-tab': { source: DEEZER_HEART, size: Infinity },
  // No vector source for Music Bridge: its 128 px icon is the largest one
  'music-bridge': { source: 'extensions/music-bridge/public/icons/128.png', size: 128 },
};
const ICON_SIZES = [16, 32, 48, 128];
// Bricolage Grotesque (SIL Open Font License), the title font of simon.duhem.fr
const FONT = 'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2';

const dataUrl = async (file: string, type: string) => `data:${type};base64,${(await readFile(resolve(ROOT, file))).toString('base64')}`;
const escape = (text: string) => text.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);

const fontFace = `@font-face { font-family: 'Bricolage Grotesque'; font-weight: 200 800; src: url(${await dataUrl(FONT, 'font/woff2')}); }`;

/** Just the icon, on a transparent background */
const iconOnly = (icon: string, size: number) => `<style>html, body { margin: 0; } img { display: block; width: ${size}px; height: ${size}px; }</style><img src="${icon}">`;

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
  for (const [extension, { source, size }] of Object.entries(SOURCES)) {
    const dir = resolve(ROOT, 'extensions', extension);
    const icon = await dataUrl(source, extname(source) === '.svg' ? 'image/svg+xml' : 'image/png');
    const messages = JSON.parse(await readFile(resolve(dir, 'public/_locales/en/messages.json'), 'utf8')) as Record<string, { message: string }>;
    const [name, description] = [messages.name!.message, messages.description!.message];
    await mkdir(resolve(dir, 'public/icons'), { recursive: true });
    await mkdir(resolve(dir, 'medias'), { recursive: true });

    for (const iconSize of ICON_SIZES.filter(candidate => candidate <= size)) {
      const file = resolve(dir, `public/icons/${iconSize}.png`);
      if (resolve(ROOT, source) !== file) await shoot(iconOnly(icon, iconSize), iconSize, iconSize, file, true);
    }
    await shoot(iconOnly(icon, 300), 300, 300, resolve(dir, 'medias/300x300.png'), true);
    await shoot(tile(icon, name, description, { iconSize: 104, nameSize: 30, textSize: 15, gap: 24 }), 440, 280, resolve(dir, 'medias/440x280.png'));
    await shoot(tile(icon, name, description, { iconSize: 300, nameSize: 84, textSize: 36, gap: 80 }), 1400, 560, resolve(dir, 'medias/1400x560.png'));
  }
} finally {
  await browser.close();
}
