import { defineConfig } from 'wxt';

export default defineConfig({
  zip: {
    // Firefox reviewers rebuild the extension from the sources zip: ship the whole workspace
    // (root package.json, lockfile) but only this extension
    sourcesRoot: '../..',
    excludeSources: ['extensions/!(dzr-tab)/**', '**/.output/**', '**/.wxt/**', '**/medias/**'],
  },
  manifest: {
    name: 'Deezer Tab',
    short_name: 'Deezer Tab',
    description: 'Discover a Deezer Track every time you open a new tab.',
    icons: {
      16: 'img/icon16.png',
      48: 'img/icon48.png',
      128: 'img/icon128.png',
    },
    permissions: ['storage'],
    host_permissions: ['https://api.deezer.com/*'],
  },
});
