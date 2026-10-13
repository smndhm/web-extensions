/**
 * WXT configuration shared by the extensions. Plain objects, so that shared/ needs no dependency:
 * wxt.config.ts type checks them with defineConfig.
 */

/** `~shared/<module>` imports shared/<module>.ts (WXT resolves alias paths from the extension's root) */
export const sharedAlias = { '~shared': '../../shared' };

/**
 * Firefox reviewers rebuild the extension from the sources zip: ship the whole workspace (root
 * package.json, lockfile, shared/) but only this extension.
 */
export const sourcesZip = (extension: string) => ({
  sourcesRoot: '../..',
  excludeSources: [`extensions/!(${extension})/**`, '**/.output/**', '**/.wxt/**', 'extensions/*/store/**'],
});

/** Manifest icons, rendered by scripts/icons.ts in every extension's public/icons */
export const icons = { 16: 'icons/16.png', 32: 'icons/32.png', 48: 'icons/48.png', 128: 'icons/128.png' };

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
