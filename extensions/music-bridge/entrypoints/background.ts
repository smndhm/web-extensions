export default defineBackground({
  persistent: false,
  main() {
    // Let the user pick a platform right after installing
    browser.runtime.onInstalled.addListener(({ reason }) => {
      if (reason === 'install') void browser.runtime.openOptionsPage();
    });
  },
});
