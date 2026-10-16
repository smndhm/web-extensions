import { browser } from 'wxt/browser';
import { REDIRECT_SERVICE_URL } from './redirect';

/** Sent by the content script to have the background ask the redirect service where to go */
export const RESOLVE_MESSAGE_TYPE = 'resolve';

/** Where the service sends a link: the music's link, or the error status (404: not on the platform) */
export type Resolution = { url: string } | { status: number };

/** Whether `redirect` goes through the redirect service, rather than straight to an app link */
export const isServiceUrl = (redirect: string) => redirect.startsWith(REDIRECT_SERVICE_URL);

/**
 * Asks the redirect service for the link it would redirect to (`format=json`), so the page can stay
 * open with a message when there is none. A network failure answers status 0.
 */
export async function resolve(serviceUrl: string): Promise<Resolution> {
  const url = new URL(serviceUrl);
  url.searchParams.set('format', 'json');
  try {
    const response = await fetch(url);
    if (!response.ok) return { status: response.status };
    const { url: found } = (await response.json()) as { url?: unknown };
    return typeof found === 'string' ? { url: found } : { status: 502 };
  } catch {
    return { status: 0 };
  }
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
