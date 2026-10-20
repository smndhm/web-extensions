import { getDeezerPath, isChromeOS } from '~shared/deezer';

export { isChromeOS };

/**
 * Whether to offer opening links in the platforms' desktop apps: on Windows and macOS. Not on ChromeOS, which has no
 * desktop apps, nor on Android and iOS, where the system itself opens a platform's links in its app, nor on Linux,
 * where Apple Music and Deezer have no app either
 */
export const hasDesktopApps = (userAgent: string): boolean => !isChromeOS(userAgent) && !/\b(?:Android|Linux|iPhone|iPad|iPod)\b/.test(userAgent);

/** The deezer.com pages the Deezer app opens: its music, and its playlists, artists, podcasts, episodes and profiles */
export const DEEZER_APP_PAGES = ['track', 'album', 'playlist', 'artist', 'show', 'episode', 'profile'] as const;

export const getDeezerDesktopUri = (url: string): string | undefined => {
  const match = new RegExp(`^(${DEEZER_APP_PAGES.join('|')})\\/(\\d+)`).exec(getDeezerPath(url) ?? '');
  return match != null ? `deezer://${match[1]}/${match[2]}` : undefined;
};

export const getSpotifyDesktopUri = (url: string): string | undefined => {
  const match = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{0,2}\/)?(album|track)\/(\w+)/.exec(url);
  return match != null ? `spotify:${match[1]}:${match[2]}` : undefined;
};

/** A deezer.com page that is not a track or an album (a playlist, an artist…), which Odesli does not know */
export const isDeezerNonMusicPage = (url: string): boolean => {
  const path = getDeezerPath(url);
  return path !== undefined && !/^(?:track|album)\//.test(path);
};
