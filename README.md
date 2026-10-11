# web-extensions

Monorepo of my browser extensions (WebExtensions), built with [WXT](https://wxt.dev) and pnpm workspaces.

| Extension | Description |
| --- | --- |
| [dzr-link](extensions/dzr-link) | Get redirected to the Deezer desktop app when you open a Deezer link in the browser. |
| [dzr-tab](extensions/dzr-tab) | Discover a Deezer track every time you open a new tab. |

| Extension | Chrome Web Store ID | Firefox add-on ID |
| --- | --- | --- |
| dzr-link | [`depodknemkobjklhmpemeagnehojilng`](https://chromewebstore.google.com/detail/depodknemkobjklhmpemeagnehojilng) | `{a1abd3a6-a241-401e-bac4-f7338abac0ad}` |
| dzr-tab | [`meiclleccmfmheoplgelombebilpndea`](https://chromewebstore.google.com/detail/meiclleccmfmheoplgelombebilpndea) | `{52114cbe-92a2-4828-8b44-109c35fbc0e7}` |

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

## Continuous integration

The [CI](.github/workflows/ci.yml) workflow runs on every pull request and on pushes to `main`:

- **Type check and build**: `pnpm compile`, then the Chrome and Firefox builds of every extension.
- **Accessibility (dzr-tab)**: loads the new tab page in Chromium with mocked Deezer responses and four covers (dark, light, grey, half white / half black). It fails on any axe-core violation (WCAG 2.2 A/AA and best practices), on text below a 4.5:1 contrast ratio against either end of the gradient, or on a wrong keyboard order. Locally: `pnpm --filter dzr-tab build && pnpm --filter dzr-tab a11y`.
- **Firefox smoke tests**: installs both Firefox builds as temporary add-ons in a real Firefox (Selenium and geckodriver). It checks that dzr-tab shows a real Deezer track with its gradient and logo and passes axe-core, and that dzr-link redirects a Deezer track page to `deezer://` or closes the tab. Screenshots are uploaded as the `firefox-screenshots` artifact. Locally, with Firefox installed: `pnpm zip:firefox && pnpm test:firefox`.

## Store screenshots

The [Store screenshots](.github/workflows/screenshots.yml) workflow (**Actions** tab) loads dzr-tab in Chromium with real Deezer tracks and uploads 1280×800 screenshots, the size the Chrome Web Store and addons.mozilla.org accept, as the `dzr-tab-screenshots` artifact. Upload them to the store listings by hand: the store APIs only handle packages.

Locally:

```sh
pnpm --filter dzr-tab exec playwright install chromium
pnpm --filter dzr-tab build
pnpm --filter dzr-tab screenshots   # -> extensions/dzr-tab/.output/screenshots
```

## Publishing

The [Publish extension](.github/workflows/publish.yml) workflow is started by hand from the **Actions** tab. Pick the extension and the stores. **Dry run** is on by default: it builds the zips and checks the store credentials without uploading anything.

The workflow runs `wxt submit` with this configuration:

- **Environments** (*Settings → Environments*): one per extension, named `dzr-link` and `dzr-tab`. Each one holds the store IDs as variables:
  - `CHROME_EXTENSION_ID`
  - `FIREFOX_EXTENSION_ID`
- **Repository secrets** (*Settings → Secrets and variables → Actions*), shared by every extension:
  - `CHROME_PUBLISHER_ID`, `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`, `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`: [Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api) service account
  - `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET`: [addons.mozilla.org API key](https://addons.mozilla.org/developers/addon/api/key/)

The Firefox submission includes a sources zip (workspace root files and the extension only). AMO reviewers can rebuild the extension from it with `pnpm install --frozen-lockfile && pnpm --filter <extension> build:firefox`.
