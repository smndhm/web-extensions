# Music Bridge: manual tests

Links to open after each release, or after a change to the content script or the redirect service, to check that Music Bridge still redirects. Paste each link in the address bar: a link clicked in another app may open straight in that platform's app instead (on Android, always when the app is installed).

## Links from every platform

Pick a platform in the options (Deezer, for example), then open each link of the other platforms: each should land on the same music on the chosen platform. Each platform has its own song, named after it, so the landing page tells where the link came from.

The links come from `pnpm test-links` (the Deezer charts give a track and an album to each platform, the Music Bridge redirect service their links), run by the [Test links](../../.github/workflows/test-links.yml) workflow, which commits them here. Run it again when a link no longer works.

<!-- test-links:start -->

| Platform      | Track                                                                                                                                                              | Album                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spotify       | [Ella Langley, Choosin' Texas](https://open.spotify.com/track/65DbTqJKhbwqYbZ1Okr0rc)                                                                              | [Ella Langley, Choosin' Texas](https://open.spotify.com/album/4ggV0IaczfDFjVSwBM8yvi)                                                                                               |
| Deezer        | [Morgan Wallen, Been By Now](https://www.deezer.com/track/4167204822)                                                                                              | [Morgan Wallen, Been By Now](https://www.deezer.com/album/1034275572)                                                                                                               |
| Apple Music   | [Olivia Rodrigo, stupid song](https://geo.music.apple.com/us/album/_/1889992111?i=1889992115&mt=1&app=music&ls=1&at=1000lHKX&ct=api_http&itscg=30200&itsct=odsl_m) | [Olivia Rodrigo, you seem pretty sad for a girl so in love](https://geo.music.apple.com/us/album/_/1889992111?mt=1&app=music&ls=1&at=1000lHKX&ct=api_http&itscg=30200&itsct=odsl_m) |
| YouTube Music | [ADÉLA, Nicole Kidman](https://music.youtube.com/watch?v=MsCWSA4GbX8)                                                                                              | [ADÉLA, PRIMA](https://music.youtube.com/playlist?list=PLatMyuJWvt9g)                                                                                                               |
| Tidal         | [Taylor Swift, Patient Zero](https://listen.tidal.com/track/564082204)                                                                                             | [Taylor Swift, The Life of a Showgirl: The Encore](https://listen.tidal.com/album/564082191)                                                                                        |
| Amazon Music  | [Ariana Grande, hate that i made you love me](https://music.amazon.com/albums/B0GYG8J4BF?trackAsin=B0GYG2C5LN)                                                     | [Ariana Grande, hate that i made you love me](https://music.amazon.com/albums/B0H2ZZCF6M)                                                                                           |
| Pandora       | [Taylor Swift, I Knew It, I Knew You (From "Toy Story 5")](https://www.pandora.com/TR:207006354)                                                                   | [Taylor Swift, I Knew It, I Knew You (From "Toy Story 5")](https://www.pandora.com/AL:67015906)                                                                                     |

<!-- test-links:end -->

## Other cases

- [ ] A link from the chosen platform itself: nothing happens, or its desktop app opens with "Open in desktop app".
- [ ] "Open in desktop app" (Apple Music, Deezer, Spotify, on Windows, macOS or Linux): the app opens, and with "Close the tab", the tab closes 5 seconds later.
- [ ] A playlist link, [open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M](https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M): nothing happens, Music Bridge only handles tracks and albums.
- [ ] SoundCloud or YouTube as the chosen platform: links from the other platforms land there.
- [ ] Firefox for Android: the same links, pasted in the address bar, land on the chosen platform's web page; the app options are not shown.
