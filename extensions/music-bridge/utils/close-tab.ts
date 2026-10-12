import { browser } from 'wxt/browser';

/** Sent by the content script to have its tab closed once the app opens */
export const CLOSE_TAB_MESSAGE = { type: 'closeTab' } as const;

/**
 * Delay before closing the tab: the redirect service must answer and the browser hand the link
 * to the app first.
 */
export const CLOSE_TAB_DELAY = 5000;

export function listenForCloseTab() {
  browser.runtime.onMessage.addListener((message: unknown, sender) => {
    const tabId = sender.tab?.id;
    if ((message as { type?: string } | undefined)?.type !== CLOSE_TAB_MESSAGE.type || tabId === undefined) return;
    setTimeout(() => browser.tabs.remove(tabId).catch(() => {}), CLOSE_TAB_DELAY);
  });
}
