import { getDeezerDesktopUri, getSpotifyDesktopUri, isChromeOs } from './links';
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
export function getRedirectUrl(href: string, { platform, openInApp }: Settings, userAgent: string): string | undefined {
  // There are no desktop apps on ChromeOS
  const inApp = openInApp && platforms[platform].hasNativeAppLink === true && !isChromeOs(userAgent);
  const onPlatform = isOnPlatform(href, platforms[platform]);

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
