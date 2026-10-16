import { describe, expect, it } from 'vitest';
import { PLATFORM_IDS, platforms, type PlatformId } from '@/utils/platforms';
import { getRedirectUrl, REDIRECT_SERVICE_URL, shouldCloseTab } from '@/utils/redirect';

const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';
const CHROMEOS = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const ANDROID = 'Mozilla/5.0 (Android 14; Mobile; rv:142.0) Gecko/142.0 Firefox/142.0';
const LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0';

const SPOTIFY_TRACK = 'https://open.spotify.com/intl-fr/track/4uLU6hMCjMI75M1A2tKUQC';
const DEEZER_TRACK = 'https://www.deezer.com/fr/track/3135556';
const APPLE_ALBUM = 'https://music.apple.com/fr/album/1440833098';

/** The service parameters of a redirect URL, or undefined when it is not a service URL */
function serviceParams(redirect: string | undefined) {
  if (!redirect?.startsWith(REDIRECT_SERVICE_URL)) return undefined;
  return Object.fromEntries(new URL(redirect).searchParams);
}

describe('getRedirectUrl', () => {
  it('sends a link from another platform to the service, encoded once', () => {
    const redirect = getRedirectUrl(SPOTIFY_TRACK, { platform: 'deezer', openInApp: false }, WINDOWS);
    expect(serviceParams(redirect)).toEqual({ url: SPOTIFY_TRACK, platform: 'deezer' });
    expect(redirect).toContain(`url=${encodeURIComponent(SPOTIFY_TRACK)}`);
  });

  it('stays on the page when it is already on the chosen platform', () => {
    expect(getRedirectUrl(DEEZER_TRACK, { platform: 'deezer', openInApp: false }, WINDOWS)).toBeUndefined();
  });

  describe('open in app', () => {
    it('opens a Deezer page in the Deezer app without the service', () => {
      expect(getRedirectUrl(DEEZER_TRACK, { platform: 'deezer', openInApp: true }, WINDOWS)).toBe('deezer://track/3135556');
    });

    it('opens a Spotify page in the Spotify app without the service', () => {
      expect(getRedirectUrl(SPOTIFY_TRACK, { platform: 'spotify', openInApp: true }, WINDOWS)).toBe('spotify:track:4uLU6hMCjMI75M1A2tKUQC');
    });

    it('stays on a Deezer page that has no app link', () => {
      expect(getRedirectUrl('https://www.deezer.com/fr/playlist/1', { platform: 'deezer', openInApp: true }, WINDOWS)).toBeUndefined();
    });

    it('asks the service for the desktop app link from another platform', () => {
      expect(serviceParams(getRedirectUrl(SPOTIFY_TRACK, { platform: 'deezer', openInApp: true }, WINDOWS))).toEqual({
        url: SPOTIFY_TRACK,
        platform: 'deezer',
        typeURI: 'nativeAppUriDesktop',
      });
    });

    it('asks the service for the Apple Music app link, even from Apple Music', () => {
      expect(serviceParams(getRedirectUrl(APPLE_ALBUM, { platform: 'appleMusic', openInApp: true }, WINDOWS))).toEqual({
        url: APPLE_ALBUM,
        platform: 'appleMusic',
        typeURI: 'nativeAppUriDesktop',
      });
    });

    it('ignores the setting on ChromeOS, which has no desktop apps', () => {
      expect(getRedirectUrl(DEEZER_TRACK, { platform: 'deezer', openInApp: true }, CHROMEOS)).toBeUndefined();
      expect(serviceParams(getRedirectUrl(SPOTIFY_TRACK, { platform: 'deezer', openInApp: true }, CHROMEOS))).toEqual({
        url: SPOTIFY_TRACK,
        platform: 'deezer',
      });
    });

    it('ignores the setting on Android, where Firefox offers to open the link in the app', () => {
      expect(getRedirectUrl(DEEZER_TRACK, { platform: 'deezer', openInApp: true }, ANDROID)).toBeUndefined();
      expect(serviceParams(getRedirectUrl(SPOTIFY_TRACK, { platform: 'deezer', openInApp: true }, ANDROID))).toEqual({
        url: SPOTIFY_TRACK,
        platform: 'deezer',
      });
    });

    it('ignores the setting on Linux for Deezer and Apple Music, which have no Linux app', () => {
      expect(getRedirectUrl(DEEZER_TRACK, { platform: 'deezer', openInApp: true }, LINUX)).toBeUndefined();
      expect(serviceParams(getRedirectUrl(SPOTIFY_TRACK, { platform: 'appleMusic', openInApp: true }, LINUX))).toEqual({
        url: SPOTIFY_TRACK,
        platform: 'appleMusic',
      });
    });

    it('opens the Spotify app on Linux', () => {
      expect(getRedirectUrl(SPOTIFY_TRACK, { platform: 'spotify', openInApp: true }, LINUX)).toBe('spotify:track:4uLU6hMCjMI75M1A2tKUQC');
    });

    it('ignores the setting for platforms without app links', () => {
      expect(serviceParams(getRedirectUrl(SPOTIFY_TRACK, { platform: 'tidal', openInApp: true }, WINDOWS))).toEqual({
        url: SPOTIFY_TRACK,
        platform: 'tidal',
      });
    });
  });

  it.each(['https://tidal.com/track/1', 'https://listen.tidal.com/track/1'])('stays on Tidal pages (%s) when Tidal is chosen', href => {
    expect(getRedirectUrl(href, { platform: 'tidal', openInApp: false }, WINDOWS)).toBeUndefined();
  });

  it('does not take another host with the same prefix for the platform', () => {
    expect(serviceParams(getRedirectUrl('https://tidal.com.example/track/1', { platform: 'tidal', openInApp: false }, WINDOWS))).toEqual({
      url: 'https://tidal.com.example/track/1',
      platform: 'tidal',
    });
  });

  it.each(PLATFORM_IDS.map(id => [id, platforms[id]] as [PlatformId, (typeof platforms)[PlatformId]]))('stays on %s pages when %s is the chosen platform', (platform, { url }) => {
    expect(getRedirectUrl(`${url}/some/music`, { platform, openInApp: false }, WINDOWS)).toBeUndefined();
  });
});

describe('shouldCloseTab', () => {
  const SERVICE_TO_APP = `${REDIRECT_SERVICE_URL}?url=x&platform=deezer&typeURI=nativeAppUriDesktop`;
  const SERVICE_TO_WEB = `${REDIRECT_SERVICE_URL}?url=x&platform=deezer`;

  it('closes a tab opened for the link once the app opens', () => {
    expect(shouldCloseTab('deezer://track/3135556', { closeTab: true }, 1)).toBe(true);
    expect(shouldCloseTab(SERVICE_TO_APP, { closeTab: true }, 1)).toBe(true);
  });

  it('keeps the tab when the user did not ask for it', () => {
    expect(shouldCloseTab('deezer://track/3135556', { closeTab: false }, 1)).toBe(false);
  });

  it('keeps the tab when the link opens on the website', () => {
    expect(shouldCloseTab(SERVICE_TO_WEB, { closeTab: true }, 1)).toBe(false);
  });

  it('keeps a tab with pages to go back to', () => {
    expect(shouldCloseTab('deezer://track/3135556', { closeTab: true }, 2)).toBe(false);
  });
});
