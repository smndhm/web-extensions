import { browser } from 'wxt/browser';
import { DEFAULT_PLATFORM, isPlatformId, type PlatformId } from './platforms';

export interface Settings {
  /** Platform to open music links on */
  platform: PlatformId;
  /** Open links in the platform's desktop app rather than on its website */
  openInApp: boolean;
}

export async function getSettings(): Promise<Settings> {
  const { platform, openInApp } = await browser.storage.local.get(['platform', 'openInApp']);
  return {
    platform: isPlatformId(platform) ? platform : DEFAULT_PLATFORM,
    openInApp: openInApp === true,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ ...settings });
}
