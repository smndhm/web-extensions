export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    // Once, when the store updates Deezer Link to this version: Music Bridge replaces it
    if (reason === 'update') void browser.tabs.create({ url: browser.runtime.getURL('/moving.html') });
  });
});
