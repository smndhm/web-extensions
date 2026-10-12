import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { initOptionsPage } from '@/utils/options-page';
import { PLATFORM_IDS } from '@/utils/platforms';

/**
 * @vitest-environment jsdom
 */

const HTML = readFileSync(resolve(import.meta.dirname, '../entrypoints/options/index.html'), 'utf8');
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';
const CHROMEOS = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const MESSAGES: Record<string, string> = {
  '@@ui_locale': 'fr_FR',
  optionsTitle: 'Music Bridge - Options',
  optionsStreamingPlatformLabel: 'Select your streaming platform:',
  optionsOpenAppLabel: 'Open in desktop app.',
  optionsCloseTabLabel: 'Close the tab once the app opens.',
  optionsCloseTabHelp: 'Tick “Always allow” in the browser prompt the first time.',
  optionsSaveButton: 'Save',
  optionsSaveConfirmation: 'Preferences saved.',
  optionsCredits: 'Made with the %LINK% API.',
  optionsNewTab: '(opens in a new tab)',
};

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const select = () => $<HTMLSelectElement>('#streaming-platforms');
const checkbox = () => $<HTMLInputElement>('#open-app');
const openAppOption = () => $<HTMLElement>('#open-app-option');
const closeTab = () => $<HTMLInputElement>('#close-tab');
const closeTabOption = () => $<HTMLElement>('#close-tab-option');
const check = (input: HTMLInputElement, checked: boolean) => {
  input.checked = checked;
  input.dispatchEvent(new Event('change'));
};
const submit = () => $<HTMLFormElement>('form').dispatchEvent(new Event('submit', { cancelable: true }));

async function open(userAgent = WINDOWS) {
  document.documentElement.innerHTML = new DOMParser().parseFromString(HTML, 'text/html').documentElement.innerHTML;
  await initOptionsPage(document, userAgent);
}

beforeEach(() => {
  fakeBrowser.reset();
  vi.spyOn(browser.i18n, 'getMessage').mockImplementation((key: string) => MESSAGES[key] ?? key);
});

describe('options page', () => {
  it('is translated', async () => {
    await open();
    expect(document.documentElement.lang).toBe('fr-FR');
    expect(document.title).toBe('Music Bridge - Options');
    expect($('h1').textContent).toBe('Music Bridge - Options');
    expect($('label[for="streaming-platforms"]').textContent).toBe('Select your streaming platform:');
    expect($('label[for="open-app"]').textContent).toBe('Open in desktop app.');
    expect($('button').textContent).toBe('Save');
  });

  it('credits Odesli with a link that tells it opens a new tab', async () => {
    await open();
    expect($('footer').textContent).toBe('Made with the Odesli (opens in a new tab) API.');
    const link = $<HTMLAnchorElement>('footer a');
    expect(link.href).toBe('https://odesli.co/');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
  });

  it('lists every platform and selects Spotify by default', async () => {
    await open();
    expect([...select().options].map((option) => option.value)).toEqual([...PLATFORM_IDS]);
    expect(select().value).toBe('spotify');
    expect(checkbox().checked).toBe(false);
  });

  it('shows the saved settings', async () => {
    await browser.storage.local.set({ platform: 'deezer', openInApp: true });
    await open();
    expect(select().value).toBe('deezer');
    expect(checkbox().checked).toBe(true);
    expect(openAppOption().hidden).toBe(false);
  });

  it('falls back to Spotify when the saved platform is unknown', async () => {
    await browser.storage.local.set({ platform: 'myspace' });
    await open();
    expect(select().value).toBe('spotify');
  });

  it('only offers the app for platforms with app links', async () => {
    await browser.storage.local.set({ platform: 'deezer', openInApp: true });
    await open();
    select().value = 'tidal';
    select().dispatchEvent(new Event('change'));
    expect(openAppOption().hidden).toBe(true);
    expect(checkbox().checked).toBe(false);

    select().value = 'appleMusic';
    select().dispatchEvent(new Event('change'));
    expect(openAppOption().hidden).toBe(false);
    expect(checkbox().checked).toBe(false);
  });

  it('never offers the app on ChromeOS', async () => {
    await browser.storage.local.set({ platform: 'deezer', openInApp: true });
    await open(CHROMEOS);
    expect(openAppOption().hidden).toBe(true);
    expect(checkbox().checked).toBe(false);
  });

  it('saves the settings and announces it for two seconds', async () => {
    vi.useFakeTimers();
    await open();
    select().value = 'deezer';
    select().dispatchEvent(new Event('change'));
    checkbox().checked = true;
    submit();
    await vi.waitFor(async () =>
      expect(await browser.storage.local.get(['platform', 'openInApp'])).toEqual({ platform: 'deezer', openInApp: true }),
    );
    await vi.waitFor(() => expect($('[role="status"]').textContent).toBe('Preferences saved.'));
    await vi.advanceTimersByTimeAsync(2000);
    expect($('[role="status"]').textContent).toBe('');
    vi.useRealTimers();
  });

  describe('close tab option', () => {
    it('is only offered when links open in the app, with its help', async () => {
      await browser.storage.local.set({ platform: 'deezer' });
      await open();
      expect(closeTabOption().hidden).toBe(true);
      check(checkbox(), true);
      expect(closeTabOption().hidden).toBe(false);
      expect($('#close-tab-help').textContent).toBe('Tick “Always allow” in the browser prompt the first time.');
      expect(closeTab().getAttribute('aria-describedby')).toBe('close-tab-help');
    });

    it('shows the saved setting', async () => {
      await browser.storage.local.set({ platform: 'deezer', openInApp: true, closeTab: true });
      await open();
      expect(closeTabOption().hidden).toBe(false);
      expect(closeTab().checked).toBe(true);
    });

    it('is cleared with the app option', async () => {
      await browser.storage.local.set({ platform: 'deezer', openInApp: true, closeTab: true });
      await open();
      check(checkbox(), false);
      expect(closeTabOption().hidden).toBe(true);
      expect(closeTab().checked).toBe(false);
    });

    it('is saved', async () => {
      await browser.storage.local.set({ platform: 'deezer', openInApp: true });
      await open();
      check(closeTab(), true);
      submit();
      await vi.waitFor(async () => expect((await browser.storage.local.get('closeTab')).closeTab).toBe(true));
    });
  });
});
