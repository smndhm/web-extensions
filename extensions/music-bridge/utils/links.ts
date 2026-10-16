import { getDeezerPath } from '~shared/deezer';

import { isChromeOS } from '~shared/deezer';
import type { Platform } from './platforms';

export { isChromeOS };

/**
 * Whether the system has desktop apps to open links in: not ChromeOS, nor Android, where the browser itself offers
 * to open a platform's links in its app
 */
export const hasDesktopApps = (userAgent: string): boolean => !isChromeOS(userAgent) && !/\bAndroid\b/.test(userAgent);

/** Linux on a computer (Android and ChromeOS also name Linux in their user agent) */
export const isLinux = (userAgent: string): boolean => /\bLinux\b/.test(userAgent) && hasDesktopApps(userAgent);

/** Whether links can open in `platform`'s desktop app on this system: it has app links, and an app for this system */
export const hasDesktopApp = (platform: Platform, userAgent: string): boolean =>
  platform.hasNativeAppLink === true && hasDesktopApps(userAgent) && (!isLinux(userAgent) || platform.linuxApp === true);

export const getDeezerDesktopUri = (url: string): string | undefined => {
  const match = /^(track|album)\/(\d+)/.exec(getDeezerPath(url) ?? '');
  return match != null ? `deezer://${match[1]}/${match[2]}` : undefined;
};

export const getSpotifyDesktopUri = (url: string): string | undefined => {
  const match = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{0,2}\/)?(album|track)\/(\w+)/.exec(url);
  return match != null ? `spotify:${match[1]}:${match[2]}` : undefined;
};
