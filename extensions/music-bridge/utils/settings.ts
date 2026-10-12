import { storage } from 'wxt/utils/storage';
import { DEFAULT_PLATFORM, isPlatformId, type PlatformId } from './platforms';

export interface Settings {
  /** Platform to open music links on */
  platform: PlatformId;
  /** Open links in the platform's desktop app rather than on its website */
  openInApp: boolean;
  /** Close the tab once the app is opened */
  closeTab: boolean;
}

// The keys of versions up to 1.6, so that their settings are kept
const items = {
  platform: storage.defineItem<string>('local:platform'),
  openInApp: storage.defineItem<boolean>('local:openInApp', { fallback: false }),
  closeTab: storage.defineItem<boolean>('local:closeTab', { fallback: false }),
};

export async function getSettings(): Promise<Settings> {
  const [platform, openInApp, closeTab] = await Promise.all([items.platform.getValue(), items.openInApp.getValue(), items.closeTab.getValue()]);
  return {
    platform: isPlatformId(platform) ? platform : DEFAULT_PLATFORM,
    openInApp: openInApp === true,
    closeTab: openInApp === true && closeTab === true,
  };
}

export async function saveSettings({ platform, openInApp, closeTab }: Settings): Promise<void> {
  await Promise.all([items.platform.setValue(platform), items.openInApp.setValue(openInApp), items.closeTab.setValue(closeTab)]);
}
