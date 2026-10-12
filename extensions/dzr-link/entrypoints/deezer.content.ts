import { getDeezerAppUrl, isChromeOS } from '@web-extensions/shared/deezer';

export default defineContentScript({
  matches: ['https://www.deezer.com/*'],
  allFrames: true,
  main() {
    if (isChromeOS(navigator.userAgent)) {
      console.warn('[Open Deezer in desktop app] This script is not compatible with Chrome OS.');
      return;
    }
    window.location.href = getDeezerAppUrl(window.location.href)!;
    // Close the tab left behind (Firefox only)
    if (/\bfirefox\b/i.test(navigator.userAgent)) {
      window.close();
    }
  },
});
