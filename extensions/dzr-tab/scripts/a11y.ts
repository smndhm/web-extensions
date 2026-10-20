/**
 * Accessibility checks of the new tab page.
 *
 * Loads the Chrome build (.output/chrome-mv3) in Chromium with mocked Deezer responses, one
 * cover per run (dark, light, mid grey, half white / half black), then checks:
 * - axe-core (@dume/dev-config/a11y: WCAG 2.2 A/AA, best practices, RGAA 4, EN 301 549) reports no violation;
 * - the track title and artist reach a 4.5:1 contrast ratio against both ends of the gradient;
 * - the keyboard order is title → artist → Deezer logo.
 *
 * Usage: pnpm build && pnpm a11y
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { resolve } from 'node:path';
import { audit, contrastRatio, parseRgb, tabOrder } from '@dume/dev-config/a11y';
import { chromium, type BrowserContext } from 'playwright';

const EXTENSION_DIR = resolve(import.meta.dirname, '../.output/chrome-mv3');

const COVERS: Record<string, string> = {
  dark: '<rect width="2" height="2" fill="#1e3cc8"/>',
  light: '<rect width="2" height="2" fill="#f0dc78"/>',
  grey: '<rect width="2" height="2" fill="#969696"/>',
  split: '<rect width="1" height="2" fill="#fafafa"/><rect x="1" width="1" height="2" fill="#141414"/>',
};

// Title → artist → Deezer logo
const EXPECTED_TAB_ORDER = ['.track-title a', '.track-artist a', '#logo a'];

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

    errors.push(...(await audit(page)));

    // Contrast of the text against both ends of the gradient (axe cannot check text over gradients)
    const { gradient, text } = await page.evaluate(() => ({
      gradient: document.body.style.backgroundImage,
      text: getComputedStyle(document.querySelector('.track-title a')!).color,
    }));
    const ends = gradient ? [...gradient.matchAll(/rgba?\([^)]+\)/g)].map(m => parseRgb(m[0])) : [parseRgb('rgb(255, 255, 255)')];
    for (const end of ends) {
      const ratio = contrastRatio(text, end);
      if (ratio < 4.5) errors.push(`contrast ${ratio.toFixed(2)}:1 between text ${text} and background rgb(${end.join(', ')})`);
    }

    // Keyboard order
    const { ok, order } = await tabOrder(page, EXPECTED_TAB_ORDER);
    if (!ok) errors.push(`keyboard order is ${order.join(' → ')}, expected ${EXPECTED_TAB_ORDER.join(' → ')}`);
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
