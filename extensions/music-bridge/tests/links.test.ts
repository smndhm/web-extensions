import { describe, expect, it } from 'vitest';
import { getDeezerDesktopUri, getSpotifyDesktopUri, hasDesktopApp, hasDesktopApps, isChromeOS, isLinux } from '@/utils/links';
import { platforms } from '@/utils/platforms';

describe('isChromeOS', () => {
  it.each([
    ['Mozilla/5.0 (X11; CrOS x86_64 10032.75.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.199 Safari/537.36', true],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36', false],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:58.0) Gecko/20100101 Firefox/58.0', false],
  ])('%s → %s', (userAgent, expected) => {
    expect(isChromeOS(userAgent)).toBe(expected);
  });
});

describe('hasDesktopApps', () => {
  it.each([
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0', true],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', true],
    ['Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', false],
    ['Mozilla/5.0 (Android 14; Mobile; rv:142.0) Gecko/142.0 Firefox/142.0', false],
  ])('%s → %s', (userAgent, expected) => {
    expect(hasDesktopApps(userAgent)).toBe(expected);
  });
});

describe('isLinux', () => {
  it.each([
    ['Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0', true],
    ['Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0', true],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0', false],
    ['Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', false],
    ['Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', false],
  ])('%s → %s', (userAgent, expected) => {
    expect(isLinux(userAgent)).toBe(expected);
  });
});

describe('hasDesktopApp', () => {
  const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';
  const LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0';
  it.each([
    ['spotify', WINDOWS, true],
    ['deezer', WINDOWS, true],
    ['appleMusic', WINDOWS, true],
    ['tidal', WINDOWS, false],
    ['spotify', LINUX, true],
    ['deezer', LINUX, false],
    ['appleMusic', LINUX, false],
  ] as const)('%s on %s → %s', (platform, userAgent, expected) => {
    expect(hasDesktopApp(platforms[platform], userAgent)).toBe(expected);
  });
});

describe('getDeezerDesktopUri', () => {
  it.each([
    ['https://www.deezer.com/track/123', 'deezer://track/123'],
    ['https://www.deezer.com/fr/track/123', 'deezer://track/123'],
    ['https://www.deezer.com/pt-br/track/123', 'deezer://track/123'],
    ['https://www.deezer.com/album/123', 'deezer://album/123'],
    ['https://www.deezer.com/fr/album/123', 'deezer://album/123'],
    ['https://www.deezer.com/fr/album/123?blu=blu', 'deezer://album/123'],
    ['https://www.deezer.com/', undefined],
    ['https://www.deezer.com/playlist/123', undefined],
    ['https://www.deezer.com/blu/album/123', undefined],
    ['https://www.blu.com/www.deezer.com/track/123', undefined],
  ])('%s → %s', (url, expected) => {
    expect(getDeezerDesktopUri(url)).toBe(expected);
  });
});

describe('getSpotifyDesktopUri', () => {
  it.each([
    ['https://open.spotify.com/track/123', 'spotify:track:123'],
    ['https://open.spotify.com/intl-fr/track/123', 'spotify:track:123'],
    ['https://open.spotify.com/album/123', 'spotify:album:123'],
    ['https://open.spotify.com/intl-de/album/123', 'spotify:album:123'],
    ['https://open.spotify.com/album/123?blu=blu', 'spotify:album:123'],
    ['https://open.spotify.com/', undefined],
    ['https://open.spotify.com/playlist/123', undefined],
    ['https://www.blu.com', undefined],
  ])('%s → %s', (url, expected) => {
    expect(getSpotifyDesktopUri(url)).toBe(expected);
  });
});
