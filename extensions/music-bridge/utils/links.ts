import { getDeezerPath } from '~shared/deezer';

import { isChromeOS } from '~shared/deezer';

export { isChromeOS };

/**
 * Whether the system has desktop apps to open links in: not ChromeOS, nor Android, where the browser itself offers
 * to open a platform's links in its app
 */
export const hasDesktopApps = (userAgent: string): boolean => !isChromeOS(userAgent) && !/\bAndroid\b/.test(userAgent);

export const getDeezerDesktopUri = (url: string): string | undefined => {
  const match = /^(track|album)\/(\d+)/.exec(getDeezerPath(url) ?? '');
  return match != null ? `deezer://${match[1]}/${match[2]}` : undefined;
};

export const getSpotifyDesktopUri = (url: string): string | undefined => {
  const match = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{0,2}\/)?(album|track)\/(\w+)/.exec(url);
  return match != null ? `spotify:${match[1]}:${match[2]}` : undefined;
};
