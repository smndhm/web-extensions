import { getDeezerAppUrl, isChromeOS } from '~shared/deezer';

export default defineContentScript({
  matches: ['https://www.deezer.com/*'],
  allFrames: true,
  main() {
    // Music Bridge, which replaces Deezer Link, already takes the page over (to the app, or to another platform). It runs
    // first (document_start, Deezer Link at document_idle) and marks the page once it has read its options
    if (document.documentElement.dataset.musicBridge !== undefined) return;
    if (isChromeOS(navigator.userAgent)) {
      console.warn('[Deezer Link] This script is not compatible with Chrome OS.');
      return;
    }
    window.location.href = getDeezerAppUrl(window.location.href)!;
    // Close the tab left behind (Firefox only)
    if (/\bfirefox\b/i.test(navigator.userAgent)) {
      window.close();
    }
  },
});
