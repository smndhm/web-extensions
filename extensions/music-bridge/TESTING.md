# Music Bridge: manual tests

Links to open after each release, or after a change to the content script or the redirect service, to check that Music Bridge still redirects. Paste each link in the address bar: a link clicked in another app may open straight in that platform's app instead (on Android, always when the app is installed).

To fill a missing link, or to replace one that no longer works: turn Music Bridge off, open [song.link for Daft Punk's _Discovery_](https://song.link/https://www.deezer.com/fr/album/302127) (or for any track), and copy the platform's link.

## Links from every platform

Pick a platform in the options (Deezer, for example), then open each link of the other platforms: each should land on the same music on the chosen platform.

| Platform      | Track                                                                                         | Album                                                              |
| ------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Spotify       | [Rick Astley, Never Gonna Give You Up](https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC) | to add from song.link                                              |
| Deezer        | [Daft Punk, Harder, Better, Faster, Stronger](https://www.deezer.com/fr/track/3135556)        | [Daft Punk, Discovery](https://www.deezer.com/fr/album/302127)     |
| Apple Music   | to add from song.link                                                                         | [Daft Punk, Discovery](https://music.apple.com/fr/album/697194953) |
| YouTube Music | to add from song.link                                                                         | to add from song.link                                              |
| Tidal         | to add from song.link                                                                         | to add from song.link                                              |
| Amazon Music  | to add from song.link                                                                         | to add from song.link                                              |
| Pandora       | to add from song.link (Pandora is only available in the United States)                        | to add from song.link                                              |

## Other cases

- [ ] A link from the chosen platform itself: nothing happens, or its desktop app opens with "Open in desktop app".
- [ ] "Open in desktop app" (Apple Music, Deezer, Spotify, on Windows, macOS or Linux): the app opens, and with "Close the tab", the tab closes 5 seconds later.
- [ ] A playlist link, [open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M](https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M): nothing happens, Music Bridge only handles tracks and albums.
- [ ] SoundCloud or YouTube as the chosen platform: links from the other platforms land there.
- [ ] Firefox for Android: the same links, pasted in the address bar, land on the chosen platform's web page; the app options are not shown.
