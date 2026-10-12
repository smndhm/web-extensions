# Music Bridge: store listings

Everything the store listings ask for, in one place, in every language of the extension (English and French). The images are in [`medias/`](medias), rendered by `pnpm store-assets` and the Store screenshots workflow (see the [root README](../../../README.md#icons-and-store-images)).

## Stores

| Store                  | Listing                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Chrome Web Store       | [`mbebbcaajfmockkcflajghbambbimpck`](https://chromewebstore.google.com/detail/mbebbcaajfmockkcflajghbambbimpck)          |
| addons.mozilla.org     | [`music-bridge`](https://addons.mozilla.org/firefox/addon/music-bridge/), also on Android                                |
| Microsoft Edge Add-ons | [`kfbedaeciahfjnknbjkcnjknkbdlcnld`](https://microsoftedge.microsoft.com/addons/detail/kfbedaeciahfjnknbjkcnjknkbdlcnld) |

## Category

Entertainment (Divertissement)

## Search terms

- **EN**: music link, Spotify, Deezer, Apple Music, YouTube Music, Tidal, song link
- **FR**: lien musique, Spotify, Deezer, Apple Music, YouTube Music, Tidal, lien chanson

## Name and short description

The manifest takes them from [`public/_locales`](../public/_locales).

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

| Image                         | English                                                              | Français                                                                |
| ----------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Logo (300×300)                | [`medias/logo-300x300.png`](medias/logo-300x300.png)                 | [`medias/logo-300x300.png`](medias/logo-300x300.png)                    |
| Small promo tile (440×280)    | [`medias/promo-440x280-en.png`](medias/promo-440x280-en.png)         | [`medias/promo-440x280-fr.png`](medias/promo-440x280-fr.png)            |
| Marquee promo tile (1400×560) | [`medias/promo-1400x560-en.png`](medias/promo-1400x560-en.png)       | [`medias/promo-1400x560-fr.png`](medias/promo-1400x560-fr.png)          |
| Screenshots (1280×800)        | `medias/screenshot-1280x800-en-*.png` (options page, light and dark) | `medias/screenshot-1280x800-fr-*.png` (page d'options, clair et sombre) |

## Notes for reviewers

### English

> No account or credentials needed. Pick a streaming platform in the extension options (Deezer, for example). Then open a music link from another platform, for example https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC: the extension redirects to the same track on the chosen platform, through the music-bridge-redirect service (Odesli API). "Open in desktop app" needs that platform's desktop app installed.

### Français

> Aucun compte ni identifiant nécessaire. Choisissez une plateforme de streaming dans les options de l'extension (Deezer, par exemple). Ouvrez ensuite un lien de musique d'une autre plateforme, par exemple https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC : l'extension redirige vers le même titre sur la plateforme choisie, via le service music-bridge-redirect (API Odesli). « Ouvrir dans l'application » nécessite l'application de bureau de cette plateforme.

## Permissions (Chrome Web Store privacy practices)

### English

- **storage**: Saves the user's settings: the chosen streaming platform, and whether to open links in its desktop app and close the tab afterwards. The settings stay in the browser.
- **Host permission** (content script on the track and album pages of Spotify, Deezer, Apple Music, YouTube Music, Tidal, Pandora, Amazon Music and Napster): The content script runs on the track and album pages of the supported streaming platforms only. It reads the page address and redirects to the same music on the platform the user chose, through the extension's redirect service. It does not read page content.
- **Remote code**: No. The redirect service answers with an HTTP redirect, never code run by the extension.

### Français

- **storage** : enregistre les réglages de l'utilisateur : la plateforme de streaming choisie, et s'il faut ouvrir les liens dans son application de bureau puis fermer l'onglet. Les réglages restent dans le navigateur.
- **Autorisation d'hôte** (script de contenu sur les pages de titres et d'albums de Spotify, Deezer, Apple Music, YouTube Music, Tidal, Pandora, Amazon Music et Napster) : le script de contenu ne s'exécute que sur les pages de titres et d'albums des plateformes prises en charge. Il lit l'adresse de la page et redirige vers la même musique sur la plateforme choisie par l'utilisateur, via le service de redirection de l'extension. Il ne lit pas le contenu de la page.
- **Code distant** : non. Le service de redirection répond par une redirection HTTP, jamais par du code exécuté par l'extension.

## Privacy

### English

The link of the music page is sent to the redirect service (https://music-bridge-redirect.smndhm.workers.dev/), which looks it up with the Odesli API. Nothing else is collected; the settings stay in the browser. Firefox: `data_collection_permissions: browsingActivity`.

### Français

Le lien de la page de musique est envoyé au service de redirection (https://music-bridge-redirect.smndhm.workers.dev/), qui le recherche avec l'API Odesli. Rien d'autre n'est collecté ; les réglages restent dans le navigateur. Firefox : `data_collection_permissions: browsingActivity`.
