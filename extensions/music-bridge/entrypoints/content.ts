import { getRedirectUrl, shouldCloseTab } from '@/utils/redirect';
import { getSettings } from '@/utils/settings';
import { CLOSE_TAB_MESSAGE } from '@/utils/close-tab';

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
    const closeTab = shouldCloseTab(redirect, settings, history.length);
    window.location.href = redirect;
    if (closeTab) void browser.runtime.sendMessage(CLOSE_TAB_MESSAGE);
  },
});
