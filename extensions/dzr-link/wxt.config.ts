import { firefoxSettings, icons, sharedAlias, sourcesZip } from '../../shared/wxt';
import { defineConfig } from 'wxt';

export default defineConfig({
  alias: sharedAlias,
  zip: sourcesZip('dzr-link'),
  manifest: ({ browser }) => ({
    name: '__MSG_name__',
    description: '__MSG_description__',
    default_locale: 'en',
    icons,
    ...firefoxSettings(browser, {
      id: '{a1abd3a6-a241-401e-bac4-f7338abac0ad}',
      // The extension sends no data to its developer
      dataCollection: ['none'],
    }),
  }),
});
