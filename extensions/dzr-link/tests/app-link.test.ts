import { describe, expect, it } from 'vitest';
import { getAppUrl, isChromeOS } from '@/utils/app-link';

describe('getAppUrl', () => {
  it('drops the language of the page', () => {
    expect(getAppUrl('https://www.deezer.com/fr/track/3135556')).toBe('deezer://track/3135556');
    expect(getAppUrl('https://www.deezer.com/pt-br/album/302127')).toBe('deezer://album/302127');
  });

  it('keeps a page without language', () => {
    expect(getAppUrl('https://www.deezer.com/track/3135556')).toBe('deezer://track/3135556');
    expect(getAppUrl('https://www.deezer.com/playlist/53362031')).toBe('deezer://playlist/53362031');
  });

  it('opens the app home for the home page', () => {
    expect(getAppUrl('https://www.deezer.com/fr/')).toBe('deezer://');
    expect(getAppUrl('https://www.deezer.com/en')).toBe('deezer://');
    expect(getAppUrl('https://www.deezer.com/')).toBe('deezer://');
  });

  it('does not take a page name for a language', () => {
    expect(getAppUrl('https://www.deezer.com/show/1234')).toBe('deezer://show/1234');
    expect(getAppUrl('https://www.deezer.com/fr/show/1234')).toBe('deezer://show/1234');
  });

  it('ignores the query string and the fragment', () => {
    expect(getAppUrl('https://www.deezer.com/fr/track/3135556?utm_source=x#top')).toBe('deezer://track/3135556');
  });
});

describe('isChromeOS', () => {
  it('detects Chrome OS', () => {
    expect(isChromeOS('Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 Chrome/120.0.0.0')).toBe(true);
    expect(isChromeOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0')).toBe(false);
  });
});
