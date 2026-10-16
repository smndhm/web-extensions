/**
 * Accessibility checks of the options page.
 *
 * Loads the Chrome build (.output/chrome-mv3) in Chromium, in English and French, light and dark, and
 * checks the options page in three states: as it opens, with Deezer chosen and "Open links in the desktop app"
 * ticked (the "Close the tab" option and its help show up), and once saved:
 * - axe-core (WCAG 2.2 A/AA and best practices) reports no violation;
 * - the keyboard order is platform → open in app → close the tab → Save → the Odesli link;
 * - the save confirmation is in a status live region, so screen readers announce it.
 *
 * Usage: pnpm build && pnpm a11y
 * CHROMIUM_PATH can point to a Chromium binary other than the one Playwright installs.
 */

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { chromium, type Page } from 'playwright';

const EXTENSION_DIR = resolve(import.meta.dirname, '../.output/chrome-mv3');
const AXE_SOURCE = await readFile(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

const EXPECTED_TAB_ORDER = ['#streaming-platforms', '#open-app', '#close-tab', 'button[type=submit]', 'footer a'];

async function axe(page: Page, state: string): Promise<string[]> {
  // evaluate() runs in the page through the DevTools protocol, so the extension CSP does not block it
  await page.evaluate(AXE_SOURCE);
  const { violations } = await page.evaluate(() =>
    // @ts-expect-error axe is injected above
    axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }),
  );
  return (violations as { id: string; help: string; nodes: { target: string[] }[] }[]).map(
    violation => `${state}: axe ${violation.id}: ${violation.help} (${violation.nodes.map(n => n.target.join(' ')).join(', ')})`,
  );
}

/** The selector of EXPECTED_TAB_ORDER each Tab press lands on, or what it lands on instead */
async function tabOrder(page: Page): Promise<string[]> {
  // Start from the top of the page: after blur(), Chrome would resume from the last focused element
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
    document.body.removeAttribute('tabindex');
  });
  const order: string[] = [];
  for (let i = 0; i < EXPECTED_TAB_ORDER.length; i++) {
    await page.keyboard.press('Tab');
    order.push(
      await page.evaluate(selectors => {
        const element = document.activeElement!;
        return selectors.find(selector => element.matches(selector)) ?? element.outerHTML.slice(0, 60);
      }, EXPECTED_TAB_ORDER),
    );
  }
  return order;
}

async function check(locale: string, colorScheme: 'light' | 'dark'): Promise<string[]> {
  const name = `${locale} ${colorScheme}`;
  const errors: string[] = [];
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    executablePath: process.env.CHROMIUM_PATH,
    locale,
    colorScheme,
    // As on Windows: the desktop app options are hidden on Linux, where CI runs
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`, `--lang=${locale}`],
  });
  try {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    const extensionId = new URL(worker.url()).host;
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`page error: ${error.message}`));
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForFunction(() => document.querySelector('#streaming-platforms option') !== null);

    // As it opens: the default platform, "Open links in the desktop app" unticked
    errors.push(...(await axe(page, 'as it opens')));

    // With the app option ticked: "Close the tab" and its help show up
    await page.selectOption('#streaming-platforms', 'deezer');
    await page.check('#open-app');
    if (!(await page.isVisible('#close-tab'))) errors.push('"Close the tab" is not shown once "Open links in the desktop app" is ticked');
    errors.push(...(await axe(page, 'with the app option')));
    const order = await tabOrder(page);
    if (order.join(' → ') !== EXPECTED_TAB_ORDER.join(' → ')) {
      errors.push(`keyboard order is ${order.join(' → ')}, expected ${EXPECTED_TAB_ORDER.join(' → ')}`);
    }

    // Saved: the confirmation is announced
    await page.click('button[type=submit]');
    await page.waitForFunction(() => document.querySelector('#save-status')?.textContent);
    const status = await page.evaluate(() => {
      const element = document.querySelector('#save-status')!;
      return { role: element.getAttribute('role'), text: element.textContent };
    });
    if (status.role !== 'status') errors.push(`the save confirmation "${status.text}" is not in a status live region`);
    errors.push(...(await axe(page, 'saved')));
  } finally {
    await context.close();
  }
  console.log(`${errors.length ? '✗' : '✓'} ${name}`);
  return errors.map(error => `${name}: ${error}`);
}

const errors: string[] = [];
for (const locale of ['en', 'fr']) {
  for (const colorScheme of ['light', 'dark'] as const) {
    errors.push(...(await check(locale, colorScheme)));
  }
}

if (errors.length) {
  console.error(`\n${errors.join('\n')}`);
  process.exit(1);
}
