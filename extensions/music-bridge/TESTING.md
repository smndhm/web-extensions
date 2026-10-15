# Music Bridge: manual tests

Links to open after each release, or after a change to the content script or the redirect service, to check that Music Bridge still redirects. Paste each link in the address bar: a link clicked in another app may open straight in that platform's app instead (on Android, always when the app is installed).

## Links from every platform

Pick a platform in the options (Deezer, for example), then open each link of the other platforms: each should land on the same music on the chosen platform. Each platform has its own song, named after it, so the landing page tells where the link came from.

The links come from `pnpm test-links` (the Deezer API finds each song, the Music Bridge redirect service its links on the other platforms), run by the [Test links](../../.github/workflows/test-links.yml) workflow, which commits them here. Run it again when a link no longer works.

<!-- test-links:start -->

<!-- test-links:end -->

## Other cases

- [ ] A link from the chosen platform itself: nothing happens, or its desktop app opens with "Open in desktop app".
- [ ] "Open in desktop app" (Apple Music, Deezer, Spotify, on Windows, macOS or Linux): the app opens, and with "Close the tab", the tab closes 5 seconds later.
- [ ] A playlist link, [open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M](https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M): nothing happens, Music Bridge only handles tracks and albums.
- [ ] SoundCloud or YouTube as the chosen platform: links from the other platforms land there.
- [ ] Firefox for Android: the same links, pasted in the address bar, land on the chosen platform's web page; the app options are not shown.
