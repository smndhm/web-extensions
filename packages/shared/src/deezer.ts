/** deezer.com pages may start with a language (/fr/, /pt-br/…); the Deezer app links do not */
const LANGUAGE = /^\/[a-z]{2}(?:-[a-z]{2})?(?=\/|$)/i;

/**
 * Path of a deezer.com page without its language and leading slash
 * (https://www.deezer.com/fr/track/3135556 → track/3135556), or undefined for another site.
 */
export function getDeezerPath(href: string): string | undefined {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }
  if (url.hostname !== 'www.deezer.com') return undefined;
  return url.pathname.replace(LANGUAGE, '').replace(/^\//, '');
}

/** Deezer desktop app link of a deezer.com page: https://www.deezer.com/fr/track/3135556 → deezer://track/3135556 */
export function getDeezerAppUrl(href: string): string | undefined {
  const path = getDeezerPath(href);
  return path === undefined ? undefined : `deezer://${path}`;
}

/** There are no desktop apps, so no app links, on ChromeOS */
export const isChromeOS = (userAgent: string): boolean => /\bCrOS\b/.test(userAgent);
