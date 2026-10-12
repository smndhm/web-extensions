/**
 * Deezer desktop app link of a deezer.com page: https://www.deezer.com/fr/track/3135556 → deezer://track/3135556.
 * The app links have no language: drop the one pages may start with (/fr/, /pt-br/…).
 */
export function getAppUrl(href: string): string {
  const path = new URL(href).pathname.replace(/^\/[a-z]{2}(-[a-z]{2})?(?=\/|$)/i, '');
  return `deezer://${path.replace(/^\//, '')}`;
}

/** The Deezer app links do not work on Chrome OS */
export const isChromeOS = (userAgent: string) => /\bCrOS\b/.test(userAgent);
