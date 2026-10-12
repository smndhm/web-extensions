# web-extensions

Monorepo of my browser extensions (WebExtensions), built with [WXT](https://wxt.dev) and pnpm workspaces.

| Extension                               | Description                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| [dzr-link](extensions/dzr-link)         | Get redirected to the Deezer desktop app when you open a Deezer link in the browser. |
| [dzr-tab](extensions/dzr-tab)           | Discover a Deezer track every time you open a new tab.                               |
| [music-bridge](extensions/music-bridge) | Open any music link on your favorite streaming platform with one click.              |

| Extension    | Chrome Web Store                                                                                                | addons.mozilla.org                                                                                                               | Microsoft Edge Add-ons                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| dzr-link     | [`depodknemkobjklhmpemeagnehojilng`](https://chromewebstore.google.com/detail/depodknemkobjklhmpemeagnehojilng) | [`{a1abd3a6-a241-401e-bac4-f7338abac0ad}`](https://addons.mozilla.org/firefox/addon/%7Ba1abd3a6-a241-401e-bac4-f7338abac0ad%7D/) | –                                                                                                                        |
| dzr-tab      | [`meiclleccmfmheoplgelombebilpndea`](https://chromewebstore.google.com/detail/meiclleccmfmheoplgelombebilpndea) | [`{52114cbe-92a2-4828-8b44-109c35fbc0e7}`](https://addons.mozilla.org/firefox/addon/deezer-tab/)                                 | –                                                                                                                        |
| music-bridge | [`mbebbcaajfmockkcflajghbambbimpck`](https://chromewebstore.google.com/detail/mbebbcaajfmockkcflajghbambbimpck) | [`{987b3f6c-05ca-4dc6-a140-38ce920051c7}`](https://addons.mozilla.org/firefox/addon/music-bridge/)                               | [`kfbedaeciahfjnknbjkcnjknkbdlcnld`](https://microsoftedge.microsoft.com/addons/detail/kfbedaeciahfjnknbjkcnjknkbdlcnld) |

Each extension lives in its own folder under `extensions/`, with its full Git history imported from its original repository.

Code shared by several extensions lives in [`packages/shared`](packages/shared) (`@web-extensions/shared`): the Deezer link helpers and the common WXT configuration. It is bundled into each extension at build time and never published; its tests run with the others (`pnpm test`). It has no dependencies of its own, so that Renovate and Changesets never version it.

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

# Lint, type check and unit tests
pnpm lint             # Prettier and oxlint (pnpm lint:fix to fix)
pnpm compile
pnpm test
pnpm lint:firefox     # Mozilla's web-ext lint on the Firefox builds
```

The version of each extension comes from its `package.json`. Do not change it by hand: [Changesets](#releasing) does.

## Continuous integration

The [CI](.github/workflows/ci.yml) workflow runs on every pull request and on pushes to `main`:

- **Type check and build**: `pnpm lint`, `pnpm compile`, the unit tests (`pnpm test`), the Chrome and Firefox builds of every extension, then `pnpm lint:firefox` on the Firefox builds.
- **Accessibility (dzr-tab)**: loads the new tab page in Chromium with mocked Deezer responses and four covers (dark, light, grey, half white / half black). It fails on any axe-core violation (WCAG 2.2 A/AA and best practices), on text below a 4.5:1 contrast ratio against either end of the gradient, or on a wrong keyboard order. Locally: `pnpm --filter dzr-tab build && pnpm --filter dzr-tab a11y`.
- **Firefox smoke tests**: installs the Firefox builds as temporary add-ons in a real Firefox (Selenium and geckodriver). It checks that dzr-tab shows a real Deezer track with its gradient and logo and passes axe-core, that dzr-link redirects a Deezer track page to `deezer://` or closes the tab, and that music-bridge sends a Tidal track page to its redirect service. Screenshots are uploaded as the `firefox-screenshots` artifact. Locally, with Firefox installed: `pnpm zip:firefox && pnpm test:firefox`.

## Icons and store images

Every extension has the same images, rendered from one source icon by `pnpm store-assets` (in Chromium, with Playwright, in Bricolage Grotesque, the title font of simon.duhem.fr):

- `public/icons/{16,32,48,128}.png`: the manifest icons;
- `store/logo-300x300.png`, and `store/promo-440x280-<locale>.png` and `store/promo-1400x560-<locale>.png` for each locale of `public/_locales`: the store listing images, named after their type and size, with the extension's name and description in that language.

The Deezer extensions use the Deezer heart, [`packages/shared/assets/deezer-heart.svg`](packages/shared/assets/deezer-heart.svg). Music Bridge has no vector icon yet: its images come from its 128 px icon, so its 300 px logo and large tile are blurry.

### Store formats

Each extension's `store/` folder holds its images and a `store/README.md` with everything the listings ask for, in every language of the extension: texts, category, search terms, notes for reviewers, permission justifications, privacy answers and images. The stores ask for these images:

|                    |  Chrome Web Store  | addons.mozilla.org | Microsoft Edge Add-ons | File                                |
| ------------------ | :----------------: | :----------------: | :--------------------: | ----------------------------------- |
| Icon / logo        |      128×128       |      128×128       |        300×300         | `logo-300x300.png`, `icons/128.png` |
| Screenshots        | 1280×800 (up to 5) |      1280×800      |   1280×800 (up to 6)   | `screenshot-1280x800-*.png`         |
| Small promo tile   |      440×280       |         –          |        440×280         | `promo-440x280-<locale>.png`        |
| Marquee promo tile |      1400×560      |         –          |        1400×560        | `promo-1400x560-<locale>.png`       |

## Store screenshots

The [Store screenshots](.github/workflows/screenshots.yml) workflow (**Actions** tab) loads an extension in Chromium and uploads 1280×800 screenshots, the size the Chrome Web Store, addons.mozilla.org and Microsoft Edge Add-ons accept, as the `<extension>-screenshots` artifact:

- **dzr-tab**: the new tab page with real Deezer tracks, the top of the Deezer chart or the track IDs given in **tracks**;
- **music-bridge**: the options page in English and French, light and dark.

With **commit**, run on a branch other than `main`, the screenshots also replace the extension's `store/screenshot-1280x800-*.png` in a commit on that branch. The [AMO listing](#store-listings) workflow sends them to addons.mozilla.org; upload them to the Chrome Web Store and Microsoft Edge Add-ons by hand.

Locally (`dzr-tab` or `music-bridge`):

```sh
pnpm --filter dzr-tab exec playwright install chromium
pnpm --filter dzr-tab build
pnpm --filter dzr-tab screenshots   # -> extensions/dzr-tab/.output/screenshots
```

## Store listings

Each extension's listing comes from the repository: its name and summary from `public/_locales`, its description from `store/description-<locale>.md`, its images from `store/` (see [Icons and store images](#icons-and-store-images)).

- **addons.mozilla.org** is updated by `pnpm amo-listing <extension> [--images] [--dry-run]`, with the AMO API and the Firefox credentials of [Publishing](#publishing):
  - the [Publish extension](.github/workflows/publish.yml) workflow updates the name, summary, description (in every language) and categories after each Firefox submission;
  - the [AMO listing](.github/workflows/amo-listing.yml) workflow (**Actions** tab) updates them on demand, and with **images** also replaces the icon and the screenshots (the English ones when they differ by language, since AMO shows the same ones in every language).
- **Chrome Web Store** and **Microsoft Edge Add-ons** have no listing API: copy the texts of `store/README.md` and upload the images by hand, in their dashboards.

Versions and changelogs are managed with [Changesets](https://github.com/changesets/changesets).

1. **In each pull request** that changes an extension, run `pnpm changeset`: pick the extension(s), the bump (patch, minor, major) and describe the change. Commit the generated `.changeset/*.md` file.
2. **When it is merged into `main`**, the [Release](.github/workflows/release.yml) workflow opens or updates a **Version Packages** pull request. It bumps the versions in `package.json` and writes each extension's `CHANGELOG.md`.
3. **When the Version Packages pull request is merged**, the Release workflow tags each released extension (`dzr-tab@2.2.0`), creates its GitHub release with the changelog, attaches the Chrome, Firefox and sources zips, and runs the store submission:
   - a **dry run** by default;
   - a real submission to the Chrome Web Store, addons.mozilla.org and Microsoft Edge Add-ons once the `SUBMIT_ON_RELEASE` repository variable (_Settings → Secrets and variables → Actions → Variables_) is `true`. Add **required reviewers** to the extension environments to approve each submission.

Dependency updates come from [Renovate](renovate.json): minor and patch updates and lock file maintenance are merged automatically. The [Renovate → Changesets](.github/workflows/changesets-renovate.yml) workflow adds a changeset to each Renovate branch that updates an extension's dependencies, then runs the CI checks on that commit and reports them as commit statuses, since a commit pushed by a workflow does not trigger the CI.

## Publishing

The [Publish extension](.github/workflows/publish.yml) workflow submits an extension to the stores. The Release workflow calls it; it can also be started by hand from the **Actions** tab, for example to submit again after a store rejected a version. Pick the extension and the stores. **Dry run** is on by default: it builds the zips and checks the store credentials without uploading anything.

The workflow runs `wxt submit` with this configuration:

- **Environments** (_Settings → Environments_): one per extension, named like it (`dzr-link`, `dzr-tab`, `music-bridge`). Each one holds the store IDs as variables:
  - `CHROME_EXTENSION_ID`
  - `FIREFOX_EXTENSION_ID`: the numeric add-on ID on addons.mozilla.org
  - `EDGE_PRODUCT_ID`: the product ID in Partner Center. Without it, the extension is not submitted to Edge.
- **Repository secrets** (_Settings → Secrets and variables → Actions_), shared by every extension:
  - `CHROME_PUBLISHER_ID`, `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`, `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`: [Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api) service account
  - `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET`: [addons.mozilla.org API key](https://addons.mozilla.org/developers/addon/api/key/)
  - `EDGE_CLIENT_ID`, `EDGE_API_KEY`: [Microsoft Edge Add-ons API](https://learn.microsoft.com/microsoft-edge/extensions/publish/api/using-addons-api) credentials, from Partner Center

Edge gets the Chrome zip: the Manifest V3 build runs as is. The Edge API only updates existing products: submit the first version of an extension by hand in Partner Center (the Chrome zip of its GitHub release), which gives its `EDGE_PRODUCT_ID`.

The Firefox submission includes a sources zip (workspace root files and the extension only). AMO reviewers can rebuild the extension from it with `pnpm install --frozen-lockfile && pnpm --filter <extension> build:firefox`.
