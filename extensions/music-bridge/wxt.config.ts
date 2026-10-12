import { firefoxSettings, icons, sourcesZip } from '@web-extensions/shared/wxt';
import { defineConfig } from 'wxt';

export default defineConfig({
  zip: sourcesZip('music-bridge'),
  manifest: ({ browser }) => ({
    name: '__MSG_name__',
    description: '__MSG_description__',
    default_locale: 'en',
    icons,
    permissions: ['storage'],
    ...firefoxSettings(browser, {
      id: '{987b3f6c-05ca-4dc6-a140-38ce920051c7}',
      // The link of the music page is sent to the redirect service
      dataCollection: ['browsingActivity'],
      // The first Firefox for Android that reads data_collection_permissions
      android: '142.0',
    }),
  }),
});
