import { defineConfig } from 'wxt';

export default defineConfig({
  zip: {
    // Firefox reviewers rebuild the extension from the sources zip: ship the whole workspace
    // (root package.json, lockfile) but only this extension
    sourcesRoot: '../..',
    excludeSources: ['extensions/!(dzr-link)/**', '**/.output/**', '**/.wxt/**', '**/medias/**'],
  },
  manifest: ({ browser }) => ({
    name: '__MSG_name__',
    description: '__MSG_description__',
    default_locale: 'en',
    icons: {
      16: 'icons/16.png',
      48: 'icons/48.png',
      128: 'icons/128.png',
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          // Add-on ID on addons.mozilla.org
          id: '{a1abd3a6-a241-401e-bac4-f7338abac0ad}',
          // The extension sends no data to its developer
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
