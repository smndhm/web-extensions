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
const ANDROID = 'Mozilla/5.0 (Android 14; Mobile; rv:142.0) Gecko/142.0 Firefox/142.0';
const LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0';

const MESSAGES: Record<string, string> = {
  lang: 'fr',
  optionsTitle: 'Music Bridge - Options',
  optionsIntro: 'Links to a track or an album on another streaming platform open on yours.',
  optionsStreamingPlatformLabel: 'Select your streaming platform:',
  optionsOpenAppLabel: 'Open links in the desktop app',
  optionsOpenAppHelp: "The platform's app must be installed on this computer.",
  optionsCloseTabLabel: 'Close the tab once the app opens',
  optionsCloseTabHelp: 'Tick “Always allow” in the browser prompt the first time.',
  optionsSaveConfirmation: 'Saved.',
  optionsCredits: 'Uses the %LINK% API.',
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
    expect(document.documentElement.lang).toBe('fr');
    expect(document.title).toBe('Music Bridge - Options');
    expect($('h1').textContent).toBe('Music Bridge - Options');
    expect($('label[for="streaming-platforms"]').textContent).toBe('Select your streaming platform:');
    expect($('label[for="open-app"]').textContent).toBe('Open links in the desktop app');
    // Saved as they change: no button
    expect(document.querySelector('button')).toBeNull();
  });

  it('credits Odesli with a link that tells it opens a new tab', async () => {
    await open();
    expect($('footer').textContent).toBe('Uses the Odesli (opens in a new tab) API.');
    const link = $<HTMLAnchorElement>('footer a');
    expect(link.href).toBe('https://odesli.co/');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
  });

  it('lists every platform and selects Spotify by default', async () => {
    await open();
    expect([...select().options].map(option => option.value)).toEqual([...PLATFORM_IDS]);
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

  it('says the app must be installed', async () => {
    await browser.storage.local.set({ platform: 'deezer' });
    await open();
    expect($('#open-app-help').textContent).toBe("The platform's app must be installed on this computer.");
    expect(checkbox().getAttribute('aria-describedby')).toBe('open-app-help');
  });

  it('never offers the app on ChromeOS', async () => {
    await browser.storage.local.set({ platform: 'deezer', openInApp: true });
    await open(CHROMEOS);
    expect(openAppOption().hidden).toBe(true);
    expect(checkbox().checked).toBe(false);
  });

  it('never offers the app on Android', async () => {
    await browser.storage.local.set({ platform: 'deezer', openInApp: true });
    await open(ANDROID);
    expect(openAppOption().hidden).toBe(true);
    expect(checkbox().checked).toBe(false);
  });

  it('never offers the app on Linux', async () => {
    await browser.storage.local.set({ platform: 'deezer', openInApp: true });
    await open(LINUX);
    expect(openAppOption().hidden).toBe(true);
    expect(checkbox().checked).toBe(false);
  });

  it('saves each change at once, and tells screen readers only, for two seconds', async () => {
    vi.useFakeTimers();
    await open();
    const status = $('#save-status');
    expect(status.getAttribute('role')).toBe('status');
    expect(status.classList).toContain('visually-hidden');
    select().value = 'deezer';
    select().dispatchEvent(new Event('change'));
    await vi.waitFor(async () => expect((await browser.storage.local.get('platform')).platform).toBe('deezer'));
    await vi.waitFor(() => expect(status.textContent).toBe('Saved.'));

    await vi.advanceTimersByTimeAsync(2000);
    expect(status.textContent).toBe('');

    check(checkbox(), true);
    await vi.waitFor(async () => expect((await browser.storage.local.get('openInApp')).openInApp).toBe(true));
    await vi.waitFor(() => expect(status.textContent).toBe('Saved.'));
    // The only status on the page: nothing shown next to the settings
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
    vi.useRealTimers();
  });

  it('saves the app option cleared with another platform', async () => {
    await browser.storage.local.set({ platform: 'deezer', openInApp: true, closeTab: true });
    await open();
    select().value = 'tidal';
    select().dispatchEvent(new Event('change'));
    await vi.waitFor(async () => expect(await browser.storage.local.get(['platform', 'openInApp', 'closeTab'])).toEqual({ platform: 'tidal', openInApp: false, closeTab: false }));
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
      await vi.waitFor(async () => expect((await browser.storage.local.get('closeTab')).closeTab).toBe(true));
    });
  });
});
