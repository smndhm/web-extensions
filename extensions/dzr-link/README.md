# Deezer Link

**Open Deezer links in the desktop app instead of the browser.**

> [!NOTE]
> Deezer Link is replaced by [Music Bridge](../music-bridge), which does the same with Deezer and **Open links in the desktop app**. This is its last version.

Available for:

- [Chrome](https://chromewebstore.google.com/detail/depodknemkobjklhmpemeagnehojilng)
- [Firefox](https://addons.mozilla.org/firefox/addon/%7Ba1abd3a6-a241-401e-bac4-f7338abac0ad%7D/)
- [Edge](https://microsoftedge.microsoft.com/addons/detail/ninmdmngfpladjdhbbdlbiclcadhcchl)

## How it works

The content script runs on every deezer.com page and opens the same page in the Deezer desktop app (`deezer://track/3135556` for `https://www.deezer.com/fr/track/3135556`). On Firefox, it then closes the tab left behind.

There is no Deezer desktop app on ChromeOS: the extension does nothing there.

On a page Music Bridge takes over (it sets `data-music-bridge` on the page's root element, at `document_start`), the content script, which runs at `document_idle`, does nothing: the app does not open twice when both are installed.

### Moving to Music Bridge

When the store updates Deezer Link to this version (not on a new install), the background script opens once the moving page, [`entrypoints/moving`](entrypoints/moving): how to move to Music Bridge, a link to its listing in the browser's store, and a button to remove Deezer Link (`management.uninstallSelf`, which needs no permission and asks the user first). `pnpm --filter dzr-link a11y` checks it (after `pnpm --filter dzr-link build`).

## Development

From the repository root (see its [README](../../README.md)):

```sh
pnpm install
pnpm --filter dzr-link dev           # Chrome
pnpm --filter dzr-link dev:firefox   # Firefox
```

The app links are built by [`shared/deezer.ts`](../../shared/deezer.ts), tested there.

Store listing texts, search terms, notes for reviewers and images: [store/README.md](store/README.md).
