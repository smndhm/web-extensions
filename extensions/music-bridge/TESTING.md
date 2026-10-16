# Music Bridge: manual tests

Links to open after each release, or after a change to the content script or the redirect service, to check that Music Bridge still redirects. Paste each link in the address bar: a link clicked in another app may open straight in that platform's app instead (on Android, always when the app is installed).

## Links from every platform

Pick a platform in the options (Deezer, for example), then open each link of the other platforms: each should land on the same music on the chosen platform. Each platform has its own track and album, so the landing page tells where the link came from.

The links come from `pnpm test-links` (the Deezer charts give a track and an album to each platform, the Music Bridge redirect service their links), run by the [Test links](../../.github/workflows/test-links.yml) workflow, which commits them here. Run it again when a link no longer works; with "Check", it asks the redirect service where each link goes on every other platform instead.

<!-- test-links:start -->

| Platform      | Track                                                                                                                                                             | Album                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Spotify       | [STELLA LEFTY, Boston](https://open.spotify.com/track/36idurZmYRjJ56KQ8JD9bN)                                                                                     | [Tinashe, Popstar](https://open.spotify.com/album/06CjF89lLSSiVWXujVVtQs)                                                                     |
| Deezer        | [Ella Langley, Choosin' Texas](https://www.deezer.com/track/3602074142)                                                                                           | [Slowdive, Souvlaki](https://www.deezer.com/album/224401)                                                                                     |
| Apple Music   | [Morgan Wallen, Been By Now](https://geo.music.apple.com/fr/album/_/6792676858?i=6792676860&mt=1&app=music&ls=1&at=1000lHKX&ct=api_http&itscg=30200&itsct=odsl_m) | [Korn, Life Is Peachy](https://geo.music.apple.com/fr/album/_/967389561?mt=1&app=music&ls=1&at=1000lHKX&ct=api_http&itscg=30200&itsct=odsl_m) |
| YouTube Music | [Ella Langley, Be Her](https://music.youtube.com/watch?v=Dg47eNL_Usw)                                                                                             | [Bruno Mars, An Evening With Silk Sonic](https://music.youtube.com/playlist?list=PL7tBPYQzCjeLCUZbgWnpFRpJIjDIlmW4l)                          |
| Tidal         | [KAROL G, BbY WOW](https://listen.tidal.com/track/549980035)                                                                                                      | [TOOL, Ænima](https://listen.tidal.com/album/114331551)                                                                                       |
| Amazon Music  | [Tame Impala, Dracula (with JENNIE)](https://music.amazon.com/albums/B0GL4W52Y1?trackAsin=B0GL4RP5S9)                                                             | [NCT WISH, I SPY - The 4th Mini Album](https://music.amazon.com/albums/B0HL91Q8MZ)                                                            |
| Pandora       | [Olivia Rodrigo, stupid song](https://www.pandora.com/TR:207049157)                                                                                               | [Xdinary Heroes, IMPULSE](https://www.pandora.com/AL:69811020)                                                                                |

<!-- test-links:end -->

## Other cases

- [ ] A link from the chosen platform itself: nothing happens, or its desktop app opens with "Open in desktop app".
- [ ] "Open in desktop app" (Apple Music, Deezer, Spotify, on Windows or macOS; never offered on ChromeOS, Android, iOS or Linux): the app opens, and with "Close the tab", the tab closes 5 seconds later.
- [ ] A playlist link, [open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M](https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M): nothing happens, Music Bridge only handles tracks and albums.
- [ ] SoundCloud or YouTube as the chosen platform: links from the other platforms land there.
- [ ] Firefox for Android: the same links, pasted in the address bar, land on the chosen platform's web page; the app options are not shown.
