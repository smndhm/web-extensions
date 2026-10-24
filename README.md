# web-extensions

Monorepo of my browser extensions (WebExtensions), built with [WXT](https://wxt.dev) and pnpm workspaces.

| Extension                               | Name         | Description                                                            |
| --------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| [dzr-link](extensions/dzr-link)         | Deezer Link  | Open Deezer links in the desktop app instead of the browser.           |
| [dzr-tab](extensions/dzr-tab)           | Deezer Tab   | Discover a Deezer track every time you open a new tab.                 |
| [music-bridge](extensions/music-bridge) | Music Bridge | Open any music link on your favorite streaming platform, in one click. |

| Extension    | Chrome Web Store                                                                                                | addons.mozilla.org                                                                                                               | Microsoft Edge Add-ons                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| dzr-link     | [`depodknemkobjklhmpemeagnehojilng`](https://chromewebstore.google.com/detail/depodknemkobjklhmpemeagnehojilng) | [`{a1abd3a6-a241-401e-bac4-f7338abac0ad}`](https://addons.mozilla.org/firefox/addon/%7Ba1abd3a6-a241-401e-bac4-f7338abac0ad%7D/) | [`ninmdmngfpladjdhbbdlbiclcadhcchl`](https://microsoftedge.microsoft.com/addons/detail/ninmdmngfpladjdhbbdlbiclcadhcchl)            |
| dzr-tab      | [`meiclleccmfmheoplgelombebilpndea`](https://chromewebstore.google.com/detail/meiclleccmfmheoplgelombebilpndea) | [`{52114cbe-92a2-4828-8b44-109c35fbc0e7}`](https://addons.mozilla.org/firefox/addon/deezer-tab/)                                 | [`habblbkjnflamlbeejkenflhlfamjdpa`](https://microsoftedge.microsoft.com/addons/detail/deezer-tab/habblbkjnflamlbeejkenflhlfamjdpa) |
| music-bridge | [`mbebbcaajfmockkcflajghbambbimpck`](https://chromewebstore.google.com/detail/mbebbcaajfmockkcflajghbambbimpck) | [`{987b3f6c-05ca-4dc6-a140-38ce920051c7}`](https://addons.mozilla.org/firefox/addon/music-bridge/)                               | [`kfbedaeciahfjnknbjkcnjknkbdlcnld`](https://microsoftedge.microsoft.com/addons/detail/kfbedaeciahfjnknbjkcnjknkbdlcnld)            |

Each extension lives in its own folder under `extensions/`, with its full Git history imported from its original repository.

Code shared by several extensions lives in [`shared/`](shared), a plain folder outside the pnpm workspace: the Deezer link helpers and the common WXT configuration. The extensions import it as `~shared/<module>` (an alias set in each `wxt.config.ts`), so it is bundled into each of them at build time; it is never published, and Changesets and Renovate don't see it. Its tests run with the others (`pnpm test`).

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
- **Accessibility**: one job runs the a11y script of every extension that has one, one after the other (`pnpm build && pnpm a11y` locally):
  - **dzr-link**: loads the moving page ("Deezer Link becomes Music Bridge") in Chromium, in English and French, light and dark. It fails on any axe-core violation, on a wrong keyboard order (store link, then the uninstall button), or if the store link is not Music Bridge's. Locally: `pnpm --filter dzr-link build && pnpm --filter dzr-link a11y`.
  - **dzr-tab**: loads the new tab page in Chromium with mocked Deezer responses and four covers (dark, light, grey, half white / half black). It fails on any axe-core violation (WCAG 2.2 A/AA and best practices), on text below a 4.5:1 contrast ratio against either end of the gradient, or on a wrong keyboard order. Locally: `pnpm --filter dzr-tab build && pnpm --filter dzr-tab a11y`.
  - **music-bridge**: loads the options page in Chromium, in English and French, light and dark, as it opens, with "Open in desktop app" ticked, saved as it changes. It fails on any axe-core violation (WCAG 2.2 A/AA and best practices), on a wrong keyboard order (platform, open in app, close the tab, the Odesli link), or if the confirmation of a setting changed is not in a status live region. Locally: `pnpm --filter music-bridge build && pnpm --filter music-bridge a11y`.
- **Firefox smoke tests**: installs the Firefox builds as temporary add-ons in a real Firefox (Selenium and geckodriver). It checks that dzr-tab shows a real Deezer track with its gradient and logo and passes axe-core, that dzr-link redirects a Deezer track page to `deezer://` or closes the tab, and that music-bridge sends a Tidal track page to its redirect service. Music Bridge asks a stand-in of the service, run by the tests (its `stub` build, which `pnpm test:firefox` zips): the tests do not call the real service, a production one. Screenshots are uploaded as the `firefox-screenshots` artifact. Locally, with Firefox installed: `pnpm zip:firefox && pnpm test:firefox`.
- **Live test**: on the "Version Packages" pull request, the Firefox smoke tests run against the real redirect service (`pnpm test:firefox:live`), when its CI is approved ("Approve and run": a pull request pushed by a workflow waits for it). To run before merging it, which releases.

## Icons and store images

Every extension has the same images, rendered from one source icon by `pnpm store-assets` (in Chromium, with Playwright, in Bricolage Grotesque, the title font of simon.duhem.fr):

- `public/icons/{16,32,48,128}.png`: the manifest icons. The 128 px one, also the store icon, has 96 px of artwork and 16 px of transparent padding, as the Chrome Web Store asks;
- `store/logo-300x300.png`, and `store/promo-440x280-<locale>.png` and `store/promo-1400x560-<locale>.png` for each locale of `public/_locales`: the store listing images, named after their type and size, with the extension's name and description in that language.

The Deezer extensions use the Deezer heart, [`shared/assets/deezer-heart.svg`](shared/assets/deezer-heart.svg). Music Bridge uses its logo, [`extensions/music-bridge/assets/icon.svg`](extensions/music-bridge/assets/icon.svg). Its manifest icons take new colors drawn at random for each release ([`extensions/music-bridge/scripts/logo.ts`](extensions/music-bridge/scripts/logo.ts)): a RampenSau color ramp (a hue turning over a random part of the color wheel), never dark, no two colors too close, and two triangles that share a side always in clearly different colors. Its store images (logo, promo tiles, screenshots) keep the logo's own colors. When the "Version Packages" pull request changes Music Bridge's version, `pnpm changeset:version` draws its colors, keeps them in `extensions/music-bridge/assets/colors.json` and renders its icons again, so the new icon shows there before the release. To draw again, run `node extensions/music-bridge/scripts/logo.ts --redraw` then `pnpm store-assets music-bridge` on that pull request's branch. The store listings keep the logo's own colors, store icon included (`store/icon-128x128.png`): the new colors are only a nod to the people who use the extension.

### Store formats

Each extension's `store/` folder holds its images and a `store/README.md` with everything the listings ask for, in every language of the extension: texts, category, search terms, notes for reviewers, permission justifications, privacy answers and images. The stores ask for these images, all PNG; the Chrome Web Store wants screenshots and tiles without alpha (24-bit), as `pnpm store-assets` and the screenshots workflow render them:

|                    |     Chrome Web Store      | addons.mozilla.org | Microsoft Edge Add-ons | File                                   |
| ------------------ | :-----------------------: | :----------------: | :--------------------: | -------------------------------------- |
| Icon / logo        | 128×128 (96 + 16 padding) |      128×128       |        300×300         | `logo-300x300.png`, `icon-128x128.png` |
| Screenshots        |    1280×800 (up to 5)     |      1280×800      |   1280×800 (up to 6)   | `screenshot-1280x800-*.png`            |
| Small promo tile   |          440×280          |         –          |        440×280         | `promo-440x280-<locale>.png`           |
| Marquee promo tile |         1400×560          |         –          |        1400×560        | `promo-1400x560-<locale>.png`          |

## Store screenshots

The [Store screenshots](.github/workflows/screenshots.yml) workflow (**Actions** tab) loads an extension in Chromium and uploads 1280×800 screenshots, the size the Chrome Web Store, addons.mozilla.org and Microsoft Edge Add-ons accept, as the `<extension>-screenshots` artifact:

- **dzr-tab**: the new tab page with real Deezer tracks, one set per listing language: by default Top Worldwide for English (`screenshot-1280x800-en-*.png`) and Top France for French (`screenshot-1280x800-fr-*.png`), set in **playlists**; or the track IDs given in **tracks**, for every language;
- **music-bridge**: composed visuals in English and French (a link opened on your platform, the supported platforms), showing the first track of the same playlists, or the first track ID in **tracks**.

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
  - the [Publish extension](.github/workflows/publish.yml) workflow submits each version with its notes for reviewers (`store/notes-for-reviewers.md`) and release notes (its `CHANGELOG.md` entry, without the dependency updates), then updates the name, summary, description (in every language), categories, homepage and privacy policy (`store/privacy-<locale>.md`, when there is one);
  - the [AMO listing](.github/workflows/amo-listing.yml) workflow (**Actions** tab) updates them on demand, and with **images** also replaces the icon and the screenshots (the English ones when they differ by language, since AMO shows the same ones in every language), with their captions in every language from `store/captions.json`, which also sets their order.
- **Chrome Web Store** and **Microsoft Edge Add-ons** have no listing API: copy the texts of `store/README.md` and upload the images by hand, in their dashboards.

Versions and changelogs are managed with [Changesets](https://github.com/changesets/changesets).

1. **In each pull request** that changes an extension, run `pnpm changeset`: pick the extension(s), the bump (patch, minor, major) and describe the change. Commit the generated `.changeset/*.md` file.
2. **When it is merged into `main`**, the [Release](.github/workflows/release.yml) workflow opens or updates a **Version Packages** pull request. It bumps the versions in `package.json` and writes each extension's `CHANGELOG.md`.
3. **When the Version Packages pull request is merged**, the Release workflow tags each released extension (`dzr-tab@2.2.0`), creates its GitHub release with the changelog, attaches the Chrome, Firefox and sources zips, and runs the store submission:
   - a **dry run** by default;
   - a real submission to the Chrome Web Store, addons.mozilla.org and Microsoft Edge Add-ons once the `SUBMIT_ON_RELEASE` repository variable (_Settings → Secrets and variables → Actions → Variables_) is `true`. Add **required reviewers** to the extension environments to approve each submission.

Dependency updates come from [Renovate](renovate.json), with the shared configuration of [smndhm/dev-config](https://github.com/smndhm/dev-config): minor and patch updates and lock file maintenance are merged automatically. The [Renovate branch](.github/workflows/renovate-branch.yml) workflow, smndhm/dev-config's reusable one, copies `@dume/dev-config`'s files (the Claude settings) and adds a changeset to each Renovate branch that updates an extension's dependencies, then runs the CI checks on that commit and reports them as the "Renovate branch checks" status, since a commit pushed by a workflow does not trigger the CI.

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

## License

[BSD 2-Clause](LICENSE): reuse the code freely, keeping the copyright notice, which names the extensions, in the code and in the documentation of what you distribute.
