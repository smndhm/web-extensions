/**
 * Accessibility checks of the new tab page.
 *
 * Loads the Chrome build (.output/chrome-mv3) in Chromium with mocked Deezer responses, one
 * cover per run (dark, light, mid grey, half white / half black), then checks:
 * - axe-core (WCAG 2.2 A/AA and best practices) reports no violation;
 * - the track title and artist reach a 4.5:1 contrast ratio against both ends of the gradient;
 * - the keyboard order is title → artist → Deezer logo.
 *
 * Usage: pnpm build && pnpm a11y
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { chromium, type BrowserContext } from 'playwright';

type Rgb = [number, number, number];

const EXTENSION_DIR = resolve(import.meta.dirname, '../.output/chrome-mv3');
const AXE_SOURCE = await readFile(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

const COVERS: Record<string, string> = {
  dark: '<rect width="2" height="2" fill="#1e3cc8"/>',
  light: '<rect width="2" height="2" fill="#f0dc78"/>',
  grey: '<rect width="2" height="2" fill="#969696"/>',
  split: '<rect width="1" height="2" fill="#fafafa"/><rect x="1" width="1" height="2" fill="#141414"/>',
};

const EXPECTED_TAB_ORDER = ['Test Song', 'Test Artist', 'Deezer'];

// WCAG 2 contrast ratio, computed here rather than imported so the page's own math is checked
function luminance(color: Rgb) {
  const [r, g, b] = color.map(c => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb) {
  const [light, dark] = [luminance(a), luminance(b)].toSorted((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

async function mockDeezer(context: BrowserContext, cover: string) {
  await context.route('https://api.deezer.com/**', route =>
    route.fulfill({
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        data: [
          {
            type: 'track',
            title: 'Test Song',
            link: 'https://www.deezer.com/track/1',
            artist: { name: 'Test Artist', link: 'https://www.deezer.com/artist/1' },
            album: { id: 1, cover_big: 'https://cdn.test/cover.svg' },
          },
        ],
      }),
    }),
  );
  await context.route('https://cdn.test/**', route =>
    route.fulfill({
      contentType: 'image/svg+xml',
      headers: { 'access-control-allow-origin': '*' },
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 2 2" preserveAspectRatio="none">${cover}</svg>`,
    }),
  );
}

async function check(name: string, cover: string): Promise<string[]> {
  const errors: string[] = [];
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    executablePath: process.env.CHROMIUM_PATH,
    args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`],
  });
  try {
    await mockDeezer(context, cover);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`page error: ${error.message}`));
    await page.goto('chrome://newtab/');
    if (!page.url().startsWith('chrome-extension://')) {
      return [`the extension did not override the new tab page (got ${page.url()}). Did you run pnpm build?`];
    }
    await page.waitForFunction(() => document.querySelector('.track-title')?.textContent);
    // The gradient is only set once the cover palette is computed; a cover without one keeps the default white page
    await page.waitForFunction(() => document.body.style.backgroundImage !== '', undefined, { timeout: 5_000 }).catch(() => {});

    // axe-core: evaluate() runs in the page through the DevTools protocol, so the extension CSP does not block it
    await page.evaluate(AXE_SOURCE);
    const { violations } = await page.evaluate(() =>
      // @ts-expect-error axe is injected above
      axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }),
    );
    for (const violation of violations as { id: string; help: string; nodes: { target: string[] }[] }[]) {
      errors.push(`axe ${violation.id}: ${violation.help} (${violation.nodes.map(n => n.target.join(' ')).join(', ')})`);
    }

    // Contrast of the text against both ends of the gradient (axe cannot check text over gradients)
    const { gradient, text } = await page.evaluate(() => ({
      gradient: document.body.style.backgroundImage,
      text: getComputedStyle(document.querySelector('.track-title a')!).color,
    }));
    const parse = (color: string) =>
      color
        .match(/\d+(\.\d+)?/g)!
        .slice(0, 3)
        .map(Number) as Rgb;
    const textColor = parse(text);
    const ends = gradient ? [...gradient.matchAll(/rgba?\([^)]+\)/g)].map(m => parse(m[0])) : [[255, 255, 255] as Rgb];
    for (const end of ends) {
      const ratio = contrast(textColor, end);
      if (ratio < 4.5) errors.push(`contrast ${ratio.toFixed(2)}:1 between text ${text} and background rgb(${end.join(', ')})`);
    }

    // Keyboard order
    const order: string[] = [];
    for (let i = 0; i < EXPECTED_TAB_ORDER.length; i++) {
      await page.keyboard.press('Tab');
      order.push(
        await page.evaluate(() => {
          const element = document.activeElement!;
          return (element.getAttribute('aria-label') ?? element.textContent ?? '').trim();
        }),
      );
    }
    if (order.join(' → ') !== EXPECTED_TAB_ORDER.join(' → ')) {
      errors.push(`keyboard order is ${order.join(' → ')}, expected ${EXPECTED_TAB_ORDER.join(' → ')}`);
    }
  } finally {
    await context.close();
  }
  console.log(`${errors.length ? '✗' : '✓'} ${name} cover`);
  return errors.map(error => `${name} cover: ${error}`);
}

const errors: string[] = [];
for (const [name, cover] of Object.entries(COVERS)) {
  errors.push(...(await check(name, cover)));
}

if (errors.length) {
  console.error(`\n${errors.join('\n')}`);
  process.exit(1);
}
