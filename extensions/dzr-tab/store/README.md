# Deezer Tab: store listings

Everything the store listings ask for, in one place, in every language of the extension (English and French). The images are next to this file, rendered by `pnpm store-assets` and the Store screenshots workflow (see the [root README](../../../README.md#icons-and-store-images)).

## Stores

| Store                  | Listing                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Chrome Web Store       | [`meiclleccmfmheoplgelombebilpndea`](https://chromewebstore.google.com/detail/meiclleccmfmheoplgelombebilpndea)                     |
| addons.mozilla.org     | [`deezer-tab`](https://addons.mozilla.org/firefox/addon/deezer-tab/)                                                                |
| Microsoft Edge Add-ons | [`habblbkjnflamlbeejkenflhlfamjdpa`](https://microsoftedge.microsoft.com/addons/detail/deezer-tab/habblbkjnflamlbeejkenflhlfamjdpa) |

## Category

- Chrome Web Store, Microsoft Edge Add-ons: Entertainment (Divertissement)
- addons.mozilla.org: Photos, Music & Videos; Tabs, set by `pnpm amo-listing`

## Search terms

- **EN**: Deezer, new tab, music discovery, new tab music, album cover, music charts, top hits
- **FR**: Deezer, nouvel onglet, découverte musicale, musique nouvel onglet, pochette d'album, classement musical, top titres

## Name and short description

The manifest takes them from [`public/_locales`](../public/_locales).

- **EN**: Deezer Tab. Discover a Deezer track every time you open a new tab.
- **FR**: Deezer Tab. Découvrez un titre Deezer à chaque nouvel onglet.

## Description

The long description, sent as is to addons.mozilla.org by `pnpm amo-listing` (some Markdown: lists, bold, links), and to paste in the other stores:

- English: [`description-en.md`](description-en.md)
- Français : [`description-fr.md`](description-fr.md)

## Images

| Image                         | English                                          | Français                                         |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Store icon (128×128)          | [`icon-128x128.png`](icon-128x128.png)           | [`icon-128x128.png`](icon-128x128.png)           |
| Logo (300×300)                | [`logo-300x300.png`](logo-300x300.png)           | [`logo-300x300.png`](logo-300x300.png)           |
| Small promo tile (440×280)    | [`promo-440x280-en.png`](promo-440x280-en.png)   | [`promo-440x280-fr.png`](promo-440x280-fr.png)   |
| Marquee promo tile (1400×560) | [`promo-1400x560-en.png`](promo-1400x560-en.png) | [`promo-1400x560-fr.png`](promo-1400x560-fr.png) |
| Screenshots (1280×800)        | `screenshot-1280x800-en-*.png` (Top Worldwide)   | `screenshot-1280x800-fr-*.png` (Top France)      |

The Chrome Web Store takes up to 5 screenshots (leave out the 6th): the English ones go to the international assets, the French ones to the French localized assets. Microsoft Edge Add-ons takes up to 6 per language. addons.mozilla.org shows the English ones, with the captions of `captions.json`.

## Notes for reviewers

In English, for the reviewers of every store: [`notes-for-reviewers.md`](notes-for-reviewers.md). The Publish workflow sends it to addons.mozilla.org with each version.

## Single purpose (Chrome Web Store and Edge Add-ons)

- English: Replace the new tab page with a track from Deezer's top playlists, with its cover and a link to listen to it on Deezer.
- Français : Remplacer la page du nouvel onglet par un titre des playlists phares de Deezer, avec sa pochette et un lien pour l'écouter sur Deezer.

## Permissions (Chrome Web Store privacy practices)

### English

- **storage**: Caches the tracks loaded from the public Deezer API for one hour, so the new tab page opens instantly and still shows tracks when Deezer cannot be reached. Nothing else is stored, and nothing leaves the browser.
- **Host permission** (`https://api.deezer.com/*`): The new tab page loads tracks (title, artist, cover) from Deezer's public API, api.deezer.com. No other site is accessed.
- **Remote code**: No. All JavaScript ships in the package; the Deezer API only returns JSON data.

### Français

- **storage** : garde en cache pendant une heure les titres chargés depuis l'API publique de Deezer, pour que la page du nouvel onglet s'ouvre tout de suite et affiche encore des titres quand Deezer ne répond pas. Rien d'autre n'est stocké, et rien ne quitte le navigateur.
- **Autorisation d'hôte** (`https://api.deezer.com/*`) : la page du nouvel onglet charge des titres (titre, artiste, pochette) depuis l'API publique de Deezer, api.deezer.com. Aucun autre site n'est consulté.
- **Code distant** : non. Tout le JavaScript est dans le paquet ; l'API Deezer ne renvoie que des données JSON.

## Privacy

### English

No data collection: the extension calls the public Deezer API and stores the tracks in the browser only. Firefox: `data_collection_permissions: none`.

### Français

Aucune collecte de données : l'extension appelle l'API publique de Deezer et ne stocke les titres que dans le navigateur. Firefox : `data_collection_permissions: none`.
