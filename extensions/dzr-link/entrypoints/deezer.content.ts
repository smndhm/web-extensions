export default defineContentScript({
  matches: ['https://www.deezer.com/*'],
  allFrames: true,
  main() {
    if (/\bCrOS\b/.test(navigator.userAgent)) {
      console.warn(
        '[Open Deezer in desktop app] This script is not compatible with Chrome OS.',
      );
    } else {
      window.location.href = `deezer://${window.location.pathname.substring(4)}`;
      // Close window (Firefox only)
      if (/\bfirefox\b/i.test(navigator.userAgent)) {
        window.close();
      }
    }
  },
});
