import { getDeezerPath } from '~shared/deezer';

import { isChromeOS } from '~shared/deezer';

export { isChromeOS };

/**
 * Whether to offer opening links in the platforms' desktop apps: on Windows and macOS. Not on ChromeOS, which has no
 * desktop apps, nor on Android, where the browser itself offers to open a platform's links in its app, nor on Linux,
 * where Apple Music and Deezer have no app either
 */
export const hasDesktopApps = (userAgent: string): boolean => !isChromeOS(userAgent) && !/\b(?:Android|Linux)\b/.test(userAgent);

export const getDeezerDesktopUri = (url: string): string | undefined => {
  const match = /^(track|album)\/(\d+)/.exec(getDeezerPath(url) ?? '');
  return match != null ? `deezer://${match[1]}/${match[2]}` : undefined;
};

export const getSpotifyDesktopUri = (url: string): string | undefined => {
  const match = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{0,2}\/)?(album|track)\/(\w+)/.exec(url);
  return match != null ? `spotify:${match[1]}:${match[2]}` : undefined;
};
