/**
 * WXT configuration shared by the extensions. Plain objects, so that this package needs no
 * dependency: wxt.config.ts type checks them with defineConfig.
 */

/**
 * Firefox reviewers rebuild the extension from the sources zip: ship the whole workspace (root
 * package.json, lockfile, shared packages) but only this extension.
 */
export const sourcesZip = (extension: string) => ({
  sourcesRoot: '../..',
  excludeSources: [`extensions/!(${extension})/**`, '**/.output/**', '**/.wxt/**', '**/medias/**'],
});

interface Gecko {
  /** Add-on ID on addons.mozilla.org */
  id: string;
  /** What the extension sends to its developer or a service: https://mzl.la/firefox-builtin-data-consent */
  dataCollection: ['none'] | string[];
  /** Also listed for Firefox for Android, from this version */
  android?: string;
}

/** Firefox manifest keys, only in the Firefox build */
export function firefoxSettings(browser: string, { id, dataCollection, android }: Gecko) {
  if (browser !== 'firefox') return {};
  return {
    browser_specific_settings: {
      gecko: { id, data_collection_permissions: { required: dataCollection } },
      ...(android && { gecko_android: { strict_min_version: android } }),
    },
  };
}
