import { getDeezerPath } from '@web-extensions/shared/deezer';

export { isChromeOS } from '@web-extensions/shared/deezer';

export const getDeezerDesktopUri = (url: string): string | undefined => {
  const match = /^(track|album)\/(\d+)/.exec(getDeezerPath(url) ?? '');
  return match != null ? `deezer://${match[1]}/${match[2]}` : undefined;
};

export const getSpotifyDesktopUri = (url: string): string | undefined => {
  const match = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{0,2}\/)?(album|track)\/(\w+)/.exec(url);
  return match != null ? `spotify:${match[1]}:${match[2]}` : undefined;
};
