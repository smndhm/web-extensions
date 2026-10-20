import { getDeezerDesktopUri, getSpotifyDesktopUri, hasDesktopApps, isDeezerNonMusicPage } from './links';
import { isOnPlatform, platforms } from './platforms';
import type { Settings } from './settings';

/**
 * The music-bridge-redirect service (a Cloudflare Worker): looks the music up with Odesli and
 * redirects to it. Up to 1.5.x, the extension called https://music-bridge.bricodage.fr/.
 */
export const REDIRECT_SERVICE_URL = 'https://music-bridge-redirect.smndhm.workers.dev/';

/**
 * Where to send the user from the music page `href`, or `undefined` to stay on it
 * (already on the chosen platform's website, or no app link to build).
 */
export function getRedirectUrl(href: string, { platform, openInApp }: Pick<Settings, 'platform' | 'openInApp'>, userAgent: string): string | undefined {
  // No desktop apps on ChromeOS, Android, iOS and Linux
  const inApp = openInApp && platforms[platform].hasNativeAppLink === true && hasDesktopApps(userAgent);
  const onPlatform = isOnPlatform(href, platforms[platform]);

  // Odesli only knows music: Deezer's other pages (playlists, artists, podcasts…) can only open in the Deezer app
  if (isDeezerNonMusicPage(href)) return platform === 'deezer' && inApp ? getDeezerDesktopUri(href) : undefined;

  if (onPlatform) {
    if (!inApp) return undefined;
    // The Deezer and Spotify app links can be built without calling the service
    if (platform === 'deezer') return getDeezerDesktopUri(href);
    if (platform === 'spotify') return getSpotifyDesktopUri(href);
  }

  const redirect = new URL(REDIRECT_SERVICE_URL);
  redirect.searchParams.set('url', href);
  redirect.searchParams.set('platform', platform);
  if (inApp) redirect.searchParams.set('typeURI', 'nativeAppUriDesktop');
  return redirect.href;
}

/** Whether `redirect` opens the platform's app: an app link, or the service asked for one */
const opensApp = (redirect: string) => !/^https?:/.test(redirect) || new URL(redirect).searchParams.get('typeURI') === 'nativeAppUriDesktop';

/**
 * Whether to close the tab after redirecting to `redirect`: when the user asked for it, the app opens,
 * and the tab was opened for this link (closing it loses no page to go back to).
 */
export function shouldCloseTab(redirect: string, { closeTab }: Pick<Settings, 'closeTab'>, historyLength: number): boolean {
  return closeTab && opensApp(redirect) && historyLength === 1;
}
