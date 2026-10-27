import { getRedirectUrl, shouldCloseTab } from '@/utils/redirect';
import { getSettings } from '@/utils/settings';
import { CLOSE_TAB_MESSAGE } from '@/utils/close-tab';
import { isServiceUrl, RESOLVE_MESSAGE_TYPE, type Resolution } from '@/utils/resolve';
import { showBanner } from '@dume/ds/web-components/banner.js';
import { daysUntil, releaseWhen } from '@/utils/release';
import { platforms } from '@/utils/platforms';
// The logo in the colors of this version, the toolbar icon, inlined: a page cannot load the extension's files
import iconUrl from '@/public/icons/48.png?inline';

export default defineContentScript({
  matches: [
    'https://open.spotify.com/*/track/*',
    'https://open.spotify.com/*/album/*',
    'https://www.deezer.com/*/track/*',
    'https://www.deezer.com/*/album/*',
    // Opened in the Deezer app only, with Deezer chosen and "Open links in the desktop app"
    'https://www.deezer.com/*/playlist/*',
    'https://www.deezer.com/*/artist/*',
    'https://www.deezer.com/*/show/*',
    'https://www.deezer.com/*/episode/*',
    'https://www.deezer.com/*/profile/*',
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
    // The link opened, read as the page starts: while the settings are read, a web app (TIDAL) may already change the
    // address, to a page the extension does not handle (an artist's), which the service cannot find
    const href = window.location.href;
    const settings = await getSettings();
    const redirect = getRedirectUrl(href, settings, navigator.userAgent);
    if (!redirect) return;
    // Music Bridge takes the page over: tells Deezer Link, when it is also installed, not to open the Deezer app too
    document.documentElement.dataset.musicBridge = 'redirect';

    // Ask the service first, to stay on the page with a message when it has no link
    let target = redirect;
    let navigation = redirect;
    if (isServiceUrl(redirect)) {
      const resolution = (await browser.runtime.sendMessage({ type: RESOLVE_MESSAGE_TYPE, url: redirect })) as Resolution | undefined;
      if (!resolution || !('url' in resolution)) {
        const notFound = resolution?.status === 404;
        const platform = platforms[settings.platform];
        const lang = browser.i18n.getMessage('lang');
        // The service tells the music it could not find: the platform's search may still find it, under another name
        const music = resolution && 'music' in resolution ? resolution.music : undefined;
        // Or that it is not out yet: say when (a release date already past, on the user's clock, is a plain not found)
        const releaseDate = resolution && 'releaseDate' in resolution ? resolution.releaseDate : undefined;
        const upcoming = notFound && releaseDate && daysUntil(releaseDate) >= 0 ? releaseWhen(releaseDate, lang) : undefined;
        let text = browser.i18n.getMessage('noticeUnavailable');
        if (upcoming) {
          const when = upcoming.soon ? browser.i18n.getMessage('noticeWhenSoon', [upcoming.soon, upcoming.date]) : browser.i18n.getMessage('noticeWhenDate', upcoming.date);
          const message = { song: 'noticeUpcomingSong', album: 'noticeUpcomingAlbum' } as const;
          text = browser.i18n.getMessage(music ? message[music.type] : 'noticeUpcoming', [platform.name, when]);
        } else if (notFound) {
          text = browser.i18n.getMessage(music ? 'noticeNotFoundSearch' : 'noticeNotFound', platform.name);
        }
        showBanner(document, {
          text,
          lang,
          closeLabel: browser.i18n.getMessage('noticeClose'),
          iconUrl,
          // Nothing to search for before its release
          link:
            notFound && music && !upcoming
              ? { text: browser.i18n.getMessage('noticeSearch', [platform.name, music.title]), href: platform.search(`${music.artistName} ${music.title}`) }
              : undefined,
        });
        return;
      }
      target = resolution.url;
      // The service address that answered: workers.dev when bricodage.fr cannot be reached
      navigation = resolution.service;
    }

    const closeTab = shouldCloseTab(target, settings, history.length);
    // Go through the service, which redirects to the same link (from its cache), rather than to the link itself: Android
    // only opens a platform's app for a navigation it sees as a link, which a page script setting its address is not
    window.location.href = navigation;
    if (closeTab) void browser.runtime.sendMessage(CLOSE_TAB_MESSAGE);
  },
});
