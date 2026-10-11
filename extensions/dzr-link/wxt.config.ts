import { defineConfig } from 'wxt';

export default defineConfig({
  zip: {
    // Firefox reviewers rebuild the extension from the sources zip: ship the whole workspace
    // (root package.json, lockfile) but only this extension
    sourcesRoot: '../..',
    excludeSources: ['extensions/!(dzr-link)/**', '**/.output/**', '**/.wxt/**', '**/medias/**'],
  },
  manifest: {
    name: 'Open Deezer in desktop app',
    description:
      'Get redirected to the Deezer desktop app when you open a Deezer link in the browser.',
    icons: {
      16: 'icons/16.png',
      48: 'icons/48.png',
      128: 'icons/128.png',
    },
  },
});
