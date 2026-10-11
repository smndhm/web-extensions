# web-extensions

Monorepo of my browser extensions (WebExtensions), built with [WXT](https://wxt.dev) and pnpm workspaces.

| Extension | Description |
| --- | --- |
| [dzr-link](extensions/dzr-link) | Get redirected to the Deezer desktop app when you open a Deezer link in the browser. |
| [dzr-tab](extensions/dzr-tab) | Discover a Deezer track every time you open a new tab. |

Each extension lives in its own folder under `extensions/`, with its full Git history imported from its original repository.

## Development

```sh
pnpm install

# Run an extension in a browser with live reload
pnpm --filter dzr-tab dev            # Chrome
pnpm --filter dzr-tab dev:firefox    # Firefox

# Build / package every extension
pnpm build            # Chrome (Manifest V3)  -> extensions/*/.output/chrome-mv3
pnpm build:firefox    # Firefox (Manifest V2) -> extensions/*/.output/firefox-mv2
pnpm zip              # store-ready zips      -> extensions/*/.output/*.zip
pnpm zip:firefox

# Type check
pnpm compile
```

The version of each extension comes from its `package.json`.
