import { getDeezerDesktopUri, getSpotifyDesktopUri, isChromeOs } from './links';
import { platforms } from './platforms';
import type { Settings } from './settings';

/** The music-bridge-redirect service: looks the music up with Odesli and redirects to it */
export const REDIRECT_SERVICE_URL = 'https://music-bridge.bricodage.fr/';

/**
 * Where to send the user from the music page `href`, or `undefined` to stay on it
 * (already on the chosen platform's website, or no app link to build).
 */
export function getRedirectUrl(href: string, { platform, openInApp }: Settings, userAgent: string): string | undefined {
  const { url: platformUrl, hasNativeAppLink } = platforms[platform];
  // There are no desktop apps on ChromeOS
  const inApp = openInApp && hasNativeAppLink === true && !isChromeOs(userAgent);
  const onPlatform = href.startsWith(platformUrl);

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
