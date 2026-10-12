# Music Bridge: store listings

Everything the store listings ask for, in one place, in every language of the extension (English and French). The images are next to this file, rendered by `pnpm store-assets` and the Store screenshots workflow (see the [root README](../../../README.md#icons-and-store-images)).

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

- **EN**: Music Bridge. Open any music link on your favorite streaming platform, in one click.
- **FR**: Music Bridge. Ouvrez n'importe quel titre ou album sur votre plateforme de streaming préférée, en un clic.

## Description

### English

Found a song on a streaming platform you don't use? Music Bridge opens it on yours.

Pick your platform once in the extension options. From then on, every track or album link from another platform takes you straight to the same music on yours: no more copying the title and searching for it.

- Links from Amazon Music, Apple Music, Deezer, Pandora, Spotify, Tidal and YouTube Music open on any of them, or on SoundCloud and YouTube.
- Open the music in your platform's desktop app (Apple Music, Deezer, Spotify), and close the tab left behind if you like.
- Available in English and French.

Privacy: the address of the music page you open is sent to Music Bridge's redirect service, which finds the same music with the Odesli (song.link) API. Nothing else is collected, and your settings stay in your browser.

**Chrome Web Store**: the listing may not name more than 5 other brands, so replace the first item of the list with:

> Works with the major music streaming platforms (Apple Music, Spotify, Deezer, YouTube Music, Amazon Music, etc.).

### Français

Vous tombez sur une chanson d'une plateforme de streaming que vous n'utilisez pas ? Music Bridge l'ouvre sur la vôtre.

Choisissez votre plateforme une fois dans les options de l'extension. Ensuite, chaque lien de titre ou d'album d'une autre plateforme vous emmène directement vers la même musique sur la vôtre : plus besoin de copier le titre pour le chercher.

- Les liens d'Amazon Music, Apple Music, Deezer, Pandora, Spotify, Tidal et YouTube Music s'ouvrent sur n'importe laquelle d'entre elles, ou sur SoundCloud et YouTube.
- Ouvrez la musique dans l'application de bureau de votre plateforme (Apple Music, Deezer, Spotify), et fermez l'onglet resté ouvert si vous le souhaitez.
- Disponible en anglais et en français.

Confidentialité : l'adresse de la page du titre ou de l'album que vous ouvrez est envoyée au service de redirection de Music Bridge, qui trouve la même musique avec l'API Odesli (song.link). Rien d'autre n'est collecté, et vos réglages restent dans votre navigateur.

**Chrome Web Store** : la fiche ne peut pas citer plus de 5 autres marques, remplacer le premier point de la liste par :

> Fonctionne avec les principales plateformes de streaming musical (Apple Music, Spotify, Deezer, YouTube Music, Amazon Music, etc.).

## Images

| Image                         | English                                                       | Français                                                         |
| ----------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| Logo (300×300)                | [`logo-300x300.png`](logo-300x300.png)                        | [`logo-300x300.png`](logo-300x300.png)                           |
| Small promo tile (440×280)    | [`promo-440x280-en.png`](promo-440x280-en.png)                | [`promo-440x280-fr.png`](promo-440x280-fr.png)                   |
| Marquee promo tile (1400×560) | [`promo-1400x560-en.png`](promo-1400x560-en.png)              | [`promo-1400x560-fr.png`](promo-1400x560-fr.png)                 |
| Screenshots (1280×800)        | `screenshot-1280x800-en-*.png` (options page, light and dark) | `screenshot-1280x800-fr-*.png` (page d'options, clair et sombre) |

## Notes for reviewers

### English

> No account or credentials needed. Pick a streaming platform in the extension options (Deezer, for example). Then open a music link from another platform, for example https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC: the extension redirects to the same track on the chosen platform, through the music-bridge-redirect service (Odesli API). "Open in desktop app" needs that platform's desktop app installed.

### Français

> Aucun compte ni identifiant nécessaire. Choisissez une plateforme de streaming dans les options de l'extension (Deezer, par exemple). Ouvrez ensuite le lien d'un titre d'une autre plateforme, par exemple https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC : l'extension redirige vers le même titre sur la plateforme choisie, via le service music-bridge-redirect (API Odesli). « Ouvrir dans l'application » nécessite l'application de bureau de cette plateforme.

## Permissions (Chrome Web Store privacy practices)

### English

- **storage**: Saves the user's settings: the chosen streaming platform, and whether to open links in its desktop app and close the tab afterwards. The settings stay in the browser.
- **Host permission** (content script on the track and album pages of Spotify, Deezer, Apple Music, YouTube Music, Tidal, Pandora and Amazon Music): The content script runs on the track and album pages of the supported streaming platforms only. It reads the page address and redirects to the same music on the platform the user chose, through the extension's redirect service. It does not read page content.
- **Remote code**: No. The redirect service answers with an HTTP redirect, never code run by the extension.

### Français

- **storage** : enregistre les réglages de l'utilisateur : la plateforme de streaming choisie, et s'il faut ouvrir les liens dans son application de bureau puis fermer l'onglet. Les réglages restent dans le navigateur.
- **Autorisation d'hôte** (script de contenu sur les pages de titres et d'albums de Spotify, Deezer, Apple Music, YouTube Music, Tidal, Pandora et Amazon Music) : le script de contenu ne s'exécute que sur les pages de titres et d'albums des plateformes prises en charge. Il lit l'adresse de la page et redirige vers la même musique sur la plateforme choisie par l'utilisateur, via le service de redirection de l'extension. Il ne lit pas le contenu de la page.
- **Code distant** : non. Le service de redirection répond par une redirection HTTP, jamais par du code exécuté par l'extension.

## Privacy

### English

The link of the music page is sent to the redirect service (https://music-bridge-redirect.smndhm.workers.dev/), which looks it up with the Odesli API. Nothing else is collected; the settings stay in the browser. Firefox: `data_collection_permissions: browsingActivity`.

### Français

L'adresse de la page du titre ou de l'album est envoyée au service de redirection (https://music-bridge-redirect.smndhm.workers.dev/), qui retrouve la musique avec l'API Odesli. Rien d'autre n'est collecté ; les réglages restent dans le navigateur. Firefox : `data_collection_permissions: browsingActivity`.
