import { defineConfig } from 'wxt';

export default defineConfig({
  zip: {
    // Firefox reviewers rebuild the extension from the sources zip: ship the whole workspace
    // (root package.json, lockfile) but only this extension
    sourcesRoot: '../..',
    excludeSources: ['extensions/!(dzr-tab)/**', '**/.output/**', '**/.wxt/**', '**/medias/**'],
  },
  manifest: ({ browser }) => ({
    name: '__MSG_name__',
    short_name: '__MSG_name__',
    description: '__MSG_description__',
    default_locale: 'en',
    icons: {
      16: 'img/icon16.png',
      48: 'img/icon48.png',
      128: 'img/icon128.png',
    },
    permissions: ['storage'],
    host_permissions: ['https://api.deezer.com/*'],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          // Add-on ID on addons.mozilla.org
          id: '{52114cbe-92a2-4828-8b44-109c35fbc0e7}',
          // The extension sends no data to its developer
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
