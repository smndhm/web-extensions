# dzr-link

## 1.5.1

### Patch Changes

- c9da75f: The options page of Music Bridge and the moving page of Deezer Link take their style from @dume/ds, the design system of simon.duhem.fr: its tokens, base, field and button, in plain CSS. Sizes on the base 4, no more `font-size: 62.5%`, Sass nor normalize.css. Deezer Link's buttons are filled.
- fbc7d0e: Updated dependency `@dume/dev-config` to `1.4.0`.

## 1.5.0

### Minor Changes

- 6826043: Last version: Deezer Link is replaced by Music Bridge. On update, a page explains how to move (install Music Bridge, choose Deezer and "Open links in the desktop app", remove Deezer Link). Deezer Link no longer opens the Deezer app on a page Music Bridge already takes over.

## 1.4.1

### Patch Changes

- 10e72ab: Shorter description, with fewer repetitions of Deezer.
- d49cd24: Renamed to Deezer Link, in every language.
- a64a548: 128 px icon with transparent padding, as the Chrome Web Store asks.

## 1.4.0

### Minor Changes

- 6ea4211: Translate the extension name and description into French.

### Patch Changes

- bf35dce: Open Deezer links without a language in the URL (`deezer.com/track/…`) in the app too: they used to lose the start of their path.
- ff1643a: Icons in 16, 32, 48 and 128 px, the same set for every extension.
- 9b48950: Updated dependency `@types/node` to `24.19.2`.
  Updated dependency `jsdom` to `30.1.2`.
  Updated dependency `normalize.css` to `8.0.1`.
  Updated dependency `sass` to `1.105.1`.
  Updated dependency `typescript` to `7.0.2`.
  Updated dependency `wxt` to `0.21.4`.
  Updated dependency `axe-core` to `4.14.0`.
  Updated dependency `selenium-webdriver` to `4.51.0`.

## 1.3.0

### Minor Changes

- Rebuilt with WXT: Manifest V3 on Chrome, Manifest V2 on Firefox, with the addons.mozilla.org add-on ID and a data collection declaration (none).
- New Deezer heart icons.

### Patch Changes

- Close the Deezer tab again on Firefox after redirecting to the desktop app: the Firefox check was case-sensitive since 1.2.0.
