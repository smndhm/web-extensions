import { defineConfig } from 'wxt';

export default defineConfig({
  zip: {
    // Firefox reviewers rebuild the extension from the sources zip: ship the whole workspace
    // (root package.json, lockfile) but only this extension
    sourcesRoot: '../..',
    excludeSources: ['extensions/!(music-bridge)/**', '**/.output/**', '**/.wxt/**', '**/medias/**'],
  },
  manifest: {
    name: '__MSG_name__',
    description: '__MSG_description__',
    default_locale: 'en',
    icons: {
      48: 'icons/48.png',
      128: 'icons/128.png',
    },
    permissions: ['storage'],
  },
});
