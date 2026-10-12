# Deezer Tab

**Discover a Deezer track every time you open a new tab.**

![Deezer Tab Preview](medias/1280x800-1.png)

Available for:

- [Chrome](https://chromewebstore.google.com/detail/meiclleccmfmheoplgelombebilpndea)
- [Firefox](https://addons.mozilla.org/firefox/addon/deezer-tab/)

## How it works

The new tab page shows a random track from one of Deezer's top playlists, on a gradient made from the colors of its cover. The text keeps a 4.5:1 contrast ratio against both ends of the gradient (WCAG AA).

The tracks are cached for an hour in the extension storage. When Deezer cannot be reached, the page shows the cached tracks.

## Development

From the repository root (see its [README](../../README.md)):

```sh
pnpm install
pnpm --filter dzr-tab dev           # Chrome
pnpm --filter dzr-tab dev:firefox   # Firefox
pnpm --filter dzr-tab test          # unit tests
pnpm --filter dzr-tab build && pnpm --filter dzr-tab a11y   # accessibility checks
```
