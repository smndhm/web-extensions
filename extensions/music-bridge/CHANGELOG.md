# music-bridge

## 1.9.0

### Minor Changes

- d9bc3a7: When the music is not on the chosen platform, or the redirect service fails, the page stays open with a message ("Music Bridge could not find this music on Deezer") instead of an empty page, and the tab no longer closes.

## 1.8.1

### Patch Changes

- dd8c813: On Linux and iOS, the "Open links in the desktop app" options are hidden, as on ChromeOS and Android: Apple Music and Deezer have no Linux app, so their links used to go nowhere (and the tab closed).
  
  The "Open links in the desktop app" option now says the platform's app must be installed on the computer.
  
  A cleaner options page: a sentence saying what the extension does, the options in boxes with their help aligned, a clearer Save button, and visible keyboard focus. The credits read "Uses the Odesli API".
  
  Deezer first in the platforms list of the options, and in the store texts.

## 1.8.0

### Minor Changes

- 5527bac: The logo changes colors with each release.

### Patch Changes

- 9c1d9ea: On Android, the "Open in desktop app" options are hidden: Firefox itself offers to open the links in the platform's app.
- 9089125: Updated dependency `vitest` to `5.0.4`.

## 1.7.1

### Patch Changes

- a64a548: 128 px icon with transparent padding, as the Chrome Web Store asks.

## 1.7.0

### Minor Changes

- 35b9821: Available on Firefox for Android (142 and later).
- bf3df69: New option to close the tab once the app opens, for tabs opened for the link only.
- 48b1d3a: Drop Napster, and rewrite the description in English and French.

### Patch Changes

- ff1643a: Icons in 16, 32, 48 and 128 px, the same set for every extension.
- f6593d2: Open Deezer links with a regional language in the URL (`deezer.com/pt-br/track/…`) directly in the Deezer app.
- 9b48950: Updated dependency `@types/node` to `24.19.2`.
  Updated dependency `jsdom` to `30.1.2`.
  Updated dependency `normalize.css` to `8.0.1`.
  Updated dependency `sass` to `1.105.1`.
  Updated dependency `typescript` to `7.0.2`.
  Updated dependency `wxt` to `0.21.4`.
  Updated dependency `axe-core` to `4.14.0`.
  Updated dependency `selenium-webdriver` to `4.51.0`.
- 0db74ae: Updated dependency `@types/node` to `^24.0.0`.

## 1.6.0

### Minor Changes

- 65e5e5e: Rebuilt with WXT in the web-extensions monorepo: Manifest V3 on Chrome, Manifest V2 on Firefox.
  
  - Send the music link to the redirect service encoded once instead of twice.
  - Options page: no more HTML in translations, a heading for assistive technologies, the save confirmation announced in a polite live region, and the Odesli link telling it opens a new tab.
  - Ignore the "Open in desktop app" setting for platforms without app links.
  - Handle Tidal pages on tidal.com, where listen.tidal.com now redirects.
  - Handle Napster pages on play.napster.com, where Odesli now links.
  - Call the redirect service on Cloudflare Workers (music-bridge-redirect.smndhm.workers.dev) instead of music-bridge.bricodage.fr.

## 1.5.4

### Patch Changes

- d5db269: add package for build

## 1.5.3

### Patch Changes

- b4f939e: fix manifest build script

## 1.5.2

### Patch Changes

- 8304612: GitHub workflow to run test on push main
- 8304612: Do not close tab on app redirect and manage new Intl Spotify urls
- 8304612: mock version for manifest test

## 1.5.1

### Patch Changes

- Update Spotify match URL
