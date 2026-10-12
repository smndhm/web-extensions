# Music Bridge: store listings

Everything the store listings ask for, in one place. The images are in [`medias/`](medias), rendered by `pnpm store-assets` and the Store screenshots workflow (see the [root README](../../README.md#icons-and-store-images)).

## Stores

| Store                  | Listing                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Chrome Web Store       | [`mbebbcaajfmockkcflajghbambbimpck`](https://chromewebstore.google.com/detail/mbebbcaajfmockkcflajghbambbimpck)          |
| addons.mozilla.org     | [`music-bridge`](https://addons.mozilla.org/firefox/addon/music-bridge/), also on Android                                |
| Microsoft Edge Add-ons | [`kfbedaeciahfjnknbjkcnjknkbdlcnld`](https://microsoftedge.microsoft.com/addons/detail/kfbedaeciahfjnknbjkcnjknkbdlcnld) |

## Category

Entertainment

## Search terms

music link, Spotify, Deezer, Apple Music, YouTube Music, Tidal, song link

## Name and short description

The manifest takes them from [`public/_locales`](public/_locales).

- **EN**: Music Bridge. With Music Bridge open any music link on your favorite platform with one click!
- **FR**: Music Bridge. Avec Music Bridge ouvrez n'importe quel lien de musique sur votre plateforme préférée en un clic !

## Description

### English

When you want to listen to music from a streaming platform that is not the one you are using, you must open the link to retrieve the title information and then go find it on your music streaming platform. Many manipulations to listen to your song!
With Music Bridge, you just have to click on this link to listen directly to the music on your platform!

Supported platforms:

- Amazon Music
- Apple Music
- Deezer
- Napster
- Pandora
- SoundCloud (only redirect to)
- Spotify
- Tidal
- YouTube (only redirect to)
- YouTube Music

**Chrome Web Store**: the listing may not name more than 5 other brands, so replace the list with:

> Works with the major music streaming platforms (Apple Music, Spotify, Deezer, YouTube Music, Amazon Music, etc.).

### Français

Lorsque vous souhaitez écouter une musique provenant d'une plateforme de streaming qui n'est pas celle que vous utilisez, vous devez ouvrir le lien pour récupérer les informations sur le titre puis aller le trouver sur votre plateforme de streaming musical. Beaucoup de manipulations pour écouter votre chanson !
Avec Music Bridge, il vous suffit de cliquer sur ce lien pour écouter directement la musique sur votre plateforme !

Plateformes prises en charge :

- Amazon Music
- Apple Music
- Deezer
- Napster
- Pandora
- SoundCloud (uniquement redirection vers)
- Spotify
- Tidal
- YouTube (uniquement redirection vers)
- YouTube Music

**Chrome Web Store** : la fiche ne peut pas citer plus de 5 autres marques, remplacer la liste par :

> Fonctionne avec les principales plateformes de streaming musical (Apple Music, Spotify, Deezer, YouTube Music, Amazon Music, etc.).

## Images

| Image                         | File                                                     |
| ----------------------------- | -------------------------------------------------------- |
| Logo (300×300)                | [`medias/logo-300x300.png`](medias/logo-300x300.png)     |
| Small promo tile (440×280)    | [`medias/promo-440x280.png`](medias/promo-440x280.png)   |
| Marquee promo tile (1400×560) | [`medias/promo-1400x560.png`](medias/promo-1400x560.png) |
| Screenshots (1280×800)        | `medias/screenshot-1280x800-*.png` (options page)        |

## Notes for reviewers

> No account or credentials needed. Pick a streaming platform in the extension options (Deezer, for example). Then open a music link from another platform, for example https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC: the extension redirects to the same track on the chosen platform, through the music-bridge-redirect service (Odesli API). "Open in desktop app" needs that platform's desktop app installed.

## Privacy

The link of the music page is sent to the redirect service (https://music-bridge-redirect.smndhm.workers.dev/), which looks it up with the Odesli API. Nothing else is collected; the settings stay in the browser. Firefox: `data_collection_permissions: browsingActivity`.
