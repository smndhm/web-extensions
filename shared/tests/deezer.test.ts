import { describe, expect, it } from 'vitest';
import { getDeezerAppUrl, getDeezerPath, isChromeOS } from '../deezer';

describe('getDeezerPath', () => {
  it.each([
    ['https://www.deezer.com/fr/track/3135556', 'track/3135556'],
    ['https://www.deezer.com/pt-br/album/302127', 'album/302127'],
    ['https://www.deezer.com/track/3135556', 'track/3135556'],
    ['https://www.deezer.com/fr/show/1234', 'show/1234'],
    ['https://www.deezer.com/show/1234', 'show/1234'],
    ['https://www.deezer.com/fr/', ''],
    ['https://www.deezer.com/en', ''],
    ['https://www.deezer.com/', ''],
    ['https://www.deezer.com/fr/track/3135556?utm_source=x#top', 'track/3135556'],
  ])('%s → %s', (href, path) => {
    expect(getDeezerPath(href)).toBe(path);
  });

  it('ignores other sites and invalid links', () => {
    expect(getDeezerPath('https://open.spotify.com/track/1')).toBeUndefined();
    expect(getDeezerPath('https://www.deezer.com.example/track/1')).toBeUndefined();
    expect(getDeezerPath('not a link')).toBeUndefined();
  });
});

describe('getDeezerAppUrl', () => {
  it('builds the app link without the language', () => {
    expect(getDeezerAppUrl('https://www.deezer.com/pt-br/track/3135556')).toBe('deezer://track/3135556');
    expect(getDeezerAppUrl('https://www.deezer.com/')).toBe('deezer://');
    expect(getDeezerAppUrl('https://open.spotify.com/track/1')).toBeUndefined();
  });
});

describe('isChromeOS', () => {
  it('detects ChromeOS', () => {
    expect(isChromeOS('Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 Chrome/120.0.0.0')).toBe(true);
    expect(isChromeOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0')).toBe(false);
  });
});
