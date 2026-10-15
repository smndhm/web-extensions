# Music Bridge: manual tests

Links to open after each release, or after a change to the content script or the redirect service, to check that Music Bridge still redirects. Paste each link in the address bar: a link clicked in another app may open straight in that platform's app instead (on Android, always when the app is installed).

## Links from every platform

Pick a platform in the options (Deezer, for example), then open each link of the other platforms: each should land on the same music on the chosen platform. Each platform has its own song, named after it, so the landing page tells where the link came from.

The links come from `pnpm test-links` (the Deezer API finds each song, the Music Bridge redirect service its links on the other platforms), run by the [Test links](../../.github/workflows/test-links.yml) workflow, which commits them here. Run it again when a link no longer works.

<!-- test-links:start -->

| Platform      | Track                                                                                                                                                    | Album                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Spotify       | [Jennifer Hudson, Spotlight (Johnny Vicious Muzik Instrumental)](https://open.spotify.com/track/2KOEh6Rjcim93C1xbNtCRB)                                  | [Jennifer Hudson, Spotlight (Johnny Vicious Muzik Instrumental)](https://open.spotify.com/album/2DRFTawGFSfAybAmwummcw)                    |
| Deezer        | [The Goo Goo Dolls, Dizzy](https://www.deezer.com/track/4290128)                                                                                         | [The Goo Goo Dolls, Dizzy up the Girl](https://www.deezer.com/album/399057)                                                                |
| Apple Music   | [Charli xcx, Apple](https://geo.music.apple.com/us/album/_/1739079974?i=1739080645&mt=1&app=music&ls=1&at=1000lHKX&ct=api_http&itscg=30200&itsct=odsl_m) | [Charli xcx, BRAT](https://geo.music.apple.com/us/album/_/1739079974?mt=1&app=music&ls=1&at=1000lHKX&ct=api_http&itscg=30200&itsct=odsl_m) |
| YouTube Music | [The Buggles, Video Killed The Radio Star ('80s Weight Loss Workout Mix)](https://music.youtube.com/watch?v=SRqXyq9Wq7c)                                 | The Buggles, Body By Jake: 80s Weight Loss Workout (BPM 100-136): not found                                                                |
| Tidal         | [Portugal. The Man, Tidal Wave](https://listen.tidal.com/track/74886176)                                                                                 | [Portugal. The Man, Woodstock](https://listen.tidal.com/album/74886167)                                                                    |
| Amazon Music  | [Gojira, Amazonia](https://music.amazon.com/albums/B08WHKBMVY?trackAsin=B08WHC99ST)                                                                      | [Gojira, Fortitude](https://music.amazon.com/albums/B08WHKBMVY)                                                                            |
| Pandora       | [Orchestral Manoeuvres In The Dark, Pandora's Box](https://www.pandora.com/TR:23372835)                                                                  | [Orchestral Manoeuvres In The Dark, The OMD Singles](https://www.pandora.com/AL:1185147)                                                   |

<!-- test-links:end -->

## Other cases

- [ ] A link from the chosen platform itself: nothing happens, or its desktop app opens with "Open in desktop app".
- [ ] "Open in desktop app" (Apple Music, Deezer, Spotify, on Windows, macOS or Linux): the app opens, and with "Close the tab", the tab closes 5 seconds later.
- [ ] A playlist link, [open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M](https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M): nothing happens, Music Bridge only handles tracks and albums.
- [ ] SoundCloud or YouTube as the chosen platform: links from the other platforms land there.
- [ ] Firefox for Android: the same links, pasted in the address bar, land on the chosen platform's web page; the app options are not shown.
