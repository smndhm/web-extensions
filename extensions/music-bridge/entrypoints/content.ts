import { getRedirectUrl, shouldCloseTab } from '@/utils/redirect';
import { getSettings } from '@/utils/settings';
import { CLOSE_TAB_MESSAGE } from '@/utils/close-tab';
import { isServiceUrl, RESOLVE_MESSAGE_TYPE, type Resolution } from '@/utils/resolve';
import { showNotice } from '@/utils/notice';
import { platforms } from '@/utils/platforms';

export default defineContentScript({
  matches: [
    'https://open.spotify.com/*/track/*',
    'https://open.spotify.com/*/album/*',
    'https://www.deezer.com/*/track/*',
    'https://www.deezer.com/*/album/*',
    'https://music.apple.com/*/album/*',
    'https://beta.music.apple.com/*/album/*',
    'https://music.youtube.com/watch?v=*',
    'https://music.youtube.com/playlist?list=*',
    'https://tidal.com/track/*',
    'https://tidal.com/album/*',
    'https://tidal.com/browse/track/*',
    'https://tidal.com/browse/album/*',
    'https://listen.tidal.com/track/*',
    'https://listen.tidal.com/album/*',
    'https://www.pandora.com/TR:*',
    'https://www.pandora.com/AL:*',
    'https://music.amazon.com/albums/*',
  ],
  runAt: 'document_start',
  async main() {
    const settings = await getSettings();
    const redirect = getRedirectUrl(window.location.href, settings, navigator.userAgent);
    if (!redirect) return;

    // Ask the service first, to stay on the page with a message when it has no link
    let target = redirect;
    if (isServiceUrl(redirect)) {
      const resolution = (await browser.runtime.sendMessage({ type: RESOLVE_MESSAGE_TYPE, url: redirect })) as Resolution | undefined;
      if (!resolution || !('url' in resolution)) {
        const notFound = resolution?.status === 404;
        showNotice(
          document,
          notFound ? browser.i18n.getMessage('noticeNotFound', platforms[settings.platform].name) : browser.i18n.getMessage('noticeUnavailable'),
          browser.i18n.getMessage('noticeClose'),
        );
        return;
      }
      target = resolution.url;
    }

    const closeTab = shouldCloseTab(target, settings, history.length);
    window.location.href = target;
    if (closeTab) void browser.runtime.sendMessage(CLOSE_TAB_MESSAGE);
  },
});
