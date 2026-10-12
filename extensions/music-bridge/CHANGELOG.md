# music-bridge

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
