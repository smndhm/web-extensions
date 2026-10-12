# Music Bridge

**Open any music link on your favorite streaming platform, in one click.**

Found a song on a streaming platform you don't use? Music Bridge opens it on yours: pick your platform once in the options, and every track or album link from another platform takes you straight to the same music on yours.

Available for:

- [Chrome](https://chromewebstore.google.com/detail/music-bridge/mbebbcaajfmockkcflajghbambbimpck)
- [Firefox](https://addons.mozilla.org/firefox/addon/music-bridge/), also on Android
- [Edge](https://microsoftedge.microsoft.com/addons/detail/music-bridge/kfbedaeciahfjnknbjkcnjknkbdlcnld)

Made with the [Odesli](https://odesli.co/) API, through the [music-bridge-redirect](https://github.com/smndhm/music-bridge-redirect) service.

## Supported platforms

- Amazon Music
- Apple Music
- Deezer
- Pandora
- SoundCloud (as a destination only)
- Spotify
- Tidal
- YouTube (as a destination only)
- YouTube Music

## How it works

The content script runs on the track and album pages of the supported platforms. With the platform chosen in the options:

- on another platform's page, it sends the link to the redirect service, which answers with the same music on the chosen platform (in its desktop app with **Open in desktop app**);
- on the chosen platform's page, it does nothing, or opens the desktop app with **Open in desktop app**. Deezer and Spotify app links are built without the service.

With **Close the tab once the app opens**, a tab opened for the link is closed 5 seconds after opening the app. Tick "Always allow" in the browser prompt the first time, or the tab closes before you answer it.

There are no desktop apps on ChromeOS: the app options are hidden there.

## Development

From the repository root (see its [README](../../README.md)):

```sh
pnpm install
pnpm --filter music-bridge dev           # Chrome
pnpm --filter music-bridge dev:firefox   # Firefox
pnpm --filter music-bridge test          # unit tests
pnpm --filter music-bridge build && pnpm --filter music-bridge screenshots   # store screenshots
```

Store listing texts, search terms, notes for reviewers and images: [store/README.md](store/README.md).
