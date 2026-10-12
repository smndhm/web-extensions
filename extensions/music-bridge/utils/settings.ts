import { browser } from 'wxt/browser';
import { DEFAULT_PLATFORM, isPlatformId, type PlatformId } from './platforms';

export interface Settings {
  /** Platform to open music links on */
  platform: PlatformId;
  /** Open links in the platform's desktop app rather than on its website */
  openInApp: boolean;
  /** Close the tab once the app is opened */
  closeTab: boolean;
}

export async function getSettings(): Promise<Settings> {
  const { platform, openInApp, closeTab } = await browser.storage.local.get(['platform', 'openInApp', 'closeTab']);
  return {
    platform: isPlatformId(platform) ? platform : DEFAULT_PLATFORM,
    openInApp: openInApp === true,
    closeTab: openInApp === true && closeTab === true,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ ...settings });
}
