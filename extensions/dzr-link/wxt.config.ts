import { firefoxSettings, sourcesZip } from '@web-extensions/shared/wxt';
import { defineConfig } from 'wxt';

export default defineConfig({
  zip: sourcesZip('dzr-link'),
  manifest: ({ browser }) => ({
    name: '__MSG_name__',
    description: '__MSG_description__',
    default_locale: 'en',
    icons: {
      16: 'icons/16.png',
      48: 'icons/48.png',
      128: 'icons/128.png',
    },
    ...firefoxSettings(browser, {
      id: '{a1abd3a6-a241-401e-bac4-f7338abac0ad}',
      // The extension sends no data to its developer
      dataCollection: ['none'],
    }),
  }),
});
