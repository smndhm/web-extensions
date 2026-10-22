import { browser } from 'wxt/browser';
import { FALLBACK_SERVICE_URL, REDIRECT_SERVICE_URL } from './redirect';

/** Sent by the content script to have the background ask the redirect service where to go */
export const RESOLVE_MESSAGE_TYPE = 'resolve';

/** A song or an album, by its title and artist: the service tells it with a 404, to search the platform for it */
export interface Music {
  type: 'song' | 'album';
  title: string;
  artistName: string;
}

/**
 * Where the service sends a link: the music's link and the service address that answered (the one to go through), or
 * the error status (404: not on the platform, with the music when the service knows it)
 */
export type Resolution = { url: string; service: string } | { status: number; music?: Music };

/** The music a 404 of the service tells, if any: only its title and artist, checked */
function musicOf(body: unknown): Music | undefined {
  const { type, title, artistName } = (body ?? {}) as Partial<Record<keyof Music, unknown>>;
  if ((type !== 'song' && type !== 'album') || typeof title !== 'string' || !title.trim() || typeof artistName !== 'string') return undefined;
  return { type, title, artistName };
}

/** Whether `redirect` goes through the redirect service, rather than straight to an app link */
export const isServiceUrl = (redirect: string) => redirect.startsWith(REDIRECT_SERVICE_URL) || redirect.startsWith(FALLBACK_SERVICE_URL);

/** Asks the service at `serviceUrl` for its link in JSON. A network failure answers status 0 */
async function ask(serviceUrl: string): Promise<Resolution> {
  const url = new URL(serviceUrl);
  url.searchParams.set('format', 'json');
  try {
    const response = await fetch(url);
    if (response.status === 404) {
      const music = musicOf(await response.json().catch(() => undefined));
      return music ? { status: 404, music } : { status: 404 };
    }
    if (!response.ok) return { status: response.status };
    const { url: found } = (await response.json()) as { url?: unknown };
    return typeof found === 'string' ? { url: found, service: serviceUrl } : { status: 502 };
  } catch {
    return { status: 0 };
  }
}

/**
 * Asks the redirect service for the link it would redirect to (`format=json`), so the page can stay
 * open with a message when there is none. When bricodage.fr cannot be reached (a network failure, not an
 * error answer), asks the same Worker on workers.dev. A network failure of both answers status 0.
 */
export async function resolve(serviceUrl: string): Promise<Resolution> {
  const resolution = await ask(serviceUrl);
  if (!('status' in resolution) || resolution.status !== 0 || !serviceUrl.startsWith(REDIRECT_SERVICE_URL)) return resolution;
  return ask(FALLBACK_SERVICE_URL + serviceUrl.slice(REDIRECT_SERVICE_URL.length));
}

/**
 * Answers the content script's resolve messages. The background asks the service: a content script
 * request could be blocked by the music page's Content Security Policy.
 */
export function listenForResolve() {
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse: (resolution: Resolution) => void) => {
    const { type, url } = (message ?? {}) as { type?: string; url?: unknown };
    if (type !== RESOLVE_MESSAGE_TYPE || typeof url !== 'string' || !isServiceUrl(url)) return;
    void resolve(url).then(sendResponse);
    // Keep the message channel open for the asynchronous answer
    return true;
  });
}
