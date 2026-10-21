# dzr-tab

## 2.2.3

### Patch Changes

- 715d098: Updated dependency `playwright` to `1.64.1`.
- 02d2589: Updated dependency `vitest` to `5.0.5`.
- 1ba255f: Updated dependency `jsdom` to `30.1.3`.

## 2.2.2

### Patch Changes

- 9089125: Updated dependency `vitest` to `5.0.4`.

## 2.2.1

### Patch Changes

- a64a548: 128 px icon with transparent padding, as the Chrome Web Store asks.

## 2.2.0

### Minor Changes

- 6ea4211: Translate the extension description into French, and declare the browser language on the new tab page.

### Patch Changes

- 86c40ff: The Deezer heart takes the color of the text, white or black, for contrast on every gradient.
- 53e7150: More vivid backgrounds: the gradient goes from the cover's vibrant color to its dark vibrant one, and the colors are darkened or lightened without losing their saturation. Covers without these colors get a background from their other colors instead of a white page, and the text keeps a 4.5:1 contrast on the whole gradient, not only at its ends.
- 3326cd5: Keep showing the last tracks when Deezer cannot be reached instead of a blank page, and stop storing a device identifier that was never used.
- ff1643a: Icons in 16, 32, 48 and 128 px, the same set for every extension.
- 9b48950: Updated dependency `@types/node` to `24.19.2`.
  Updated dependency `jsdom` to `30.1.2`.
  Updated dependency `normalize.css` to `8.0.1`.
  Updated dependency `sass` to `1.105.1`.
  Updated dependency `typescript` to `7.0.2`.
  Updated dependency `wxt` to `0.21.4`.
  Updated dependency `axe-core` to `4.14.0`.
  Updated dependency `selenium-webdriver` to `4.51.0`.
- 0db74ae: Updated dependency `@types/node` to `^24.0.0`.

## 2.1.0

### Minor Changes

- Rebuilt with WXT: Manifest V3 on Chrome, Manifest V2 on Firefox, with the addons.mozilla.org add-on ID and a data collection declaration (none).
- New Deezer logo, icons and favicon.
- Accessibility: page language, landmarks, a level-one heading for the track title, an accessible name for the Deezer link, visible focus, and text that always reaches a 4.5:1 contrast ratio against the background gradient.
