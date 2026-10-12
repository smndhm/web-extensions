import { firefoxSettings, sourcesZip } from '@web-extensions/shared/wxt';
import { defineConfig } from 'wxt';

export default defineConfig({
  zip: sourcesZip('dzr-tab'),
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
    ...firefoxSettings(browser, {
      id: '{52114cbe-92a2-4828-8b44-109c35fbc0e7}',
      // The extension sends no data to its developer
      dataCollection: ['none'],
    }),
  }),
});
