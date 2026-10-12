import { getRedirectUrl } from '@/utils/redirect';
import { getSettings } from '@/utils/settings';

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
    'https://play.napster.com/track/*',
    'https://play.napster.com/album/*',
    'https://web.napster.com/track/*',
    'https://web.napster.com/album/*',
  ],
  runAt: 'document_start',
  async main() {
    const redirect = getRedirectUrl(window.location.href, await getSettings(), navigator.userAgent);
    if (redirect) window.location.href = redirect;
  },
});
