import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { CLOSE_TAB_DELAY, CLOSE_TAB_MESSAGE, listenForCloseTab } from '@/utils/close-tab';

const tab = { id: 42 } as Browser.tabs.Tab;

beforeEach(() => {
  fakeBrowser.reset();
  vi.useFakeTimers();
  vi.spyOn(browser.tabs, 'remove').mockResolvedValue();
  listenForCloseTab();
});

afterEach(() => vi.useRealTimers());

it('closes the sender tab once the app had time to open', async () => {
  await fakeBrowser.runtime.onMessage.trigger(CLOSE_TAB_MESSAGE, { tab }, () => {});
  await vi.advanceTimersByTimeAsync(CLOSE_TAB_DELAY - 1);
  expect(browser.tabs.remove).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(browser.tabs.remove).toHaveBeenCalledWith(42);
});

it('ignores other messages and messages without a tab', async () => {
  await fakeBrowser.runtime.onMessage.trigger({ type: 'other' }, { tab }, () => {});
  await fakeBrowser.runtime.onMessage.trigger(CLOSE_TAB_MESSAGE, {}, () => {});
  await vi.advanceTimersByTimeAsync(CLOSE_TAB_DELAY);
  expect(browser.tabs.remove).not.toHaveBeenCalled();
});
