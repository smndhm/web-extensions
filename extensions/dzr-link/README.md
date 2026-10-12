# Deezer Link

**Get redirected to the Deezer desktop app when you open a Deezer link in the browser.**

Available for:

- [Chrome](https://chromewebstore.google.com/detail/depodknemkobjklhmpemeagnehojilng)
- [Firefox](https://addons.mozilla.org/firefox/addon/%7Ba1abd3a6-a241-401e-bac4-f7338abac0ad%7D/)

## How it works

The content script runs on every deezer.com page and opens the same page in the Deezer desktop app (`deezer://track/3135556` for `https://www.deezer.com/fr/track/3135556`). On Firefox, it then closes the tab left behind.

There is no Deezer desktop app on ChromeOS: the extension does nothing there.

## Development

From the repository root (see its [README](../../README.md)):

```sh
pnpm install
pnpm --filter dzr-link dev           # Chrome
pnpm --filter dzr-link dev:firefox   # Firefox
```

The app links are built by [`@web-extensions/shared/deezer`](../../packages/shared/src/deezer.ts), tested there.

Store listing texts, search terms, notes for reviewers and images: [store/README.md](store/README.md).
