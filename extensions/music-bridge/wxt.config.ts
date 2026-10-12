import { defineConfig } from 'wxt';

export default defineConfig({
  zip: {
    // Firefox reviewers rebuild the extension from the sources zip: ship the whole workspace
    // (root package.json, lockfile) but only this extension
    sourcesRoot: '../..',
    excludeSources: ['extensions/!(music-bridge)/**', '**/.output/**', '**/.wxt/**', '**/medias/**'],
  },
  manifest: ({ browser }) => ({
    name: '__MSG_name__',
    description: '__MSG_description__',
    default_locale: 'en',
    icons: {
      48: 'icons/48.png',
      128: 'icons/128.png',
    },
    permissions: ['storage'],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          // Add-on ID on addons.mozilla.org
          id: '{987b3f6c-05ca-4dc6-a140-38ce920051c7}',
          // The link of the music page is sent to the redirect service
          data_collection_permissions: { required: ['browsingActivity'] },
        },
        // Also on Firefox for Android, from the first version that reads data_collection_permissions
        gecko_android: { strict_min_version: '142.0' },
      },
    }),
  }),
});
