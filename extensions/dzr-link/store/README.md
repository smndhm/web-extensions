# Open Deezer in desktop app: store listings

Everything the store listings ask for, in one place, in every language of the extension (English and French). The images are next to this file, rendered by `pnpm store-assets` (see the [root README](../../../README.md#icons-and-store-images)).

## Stores

| Store                  | Listing                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Chrome Web Store       | [`depodknemkobjklhmpemeagnehojilng`](https://chromewebstore.google.com/detail/depodknemkobjklhmpemeagnehojilng)                  |
| addons.mozilla.org     | [`{a1abd3a6-a241-401e-bac4-f7338abac0ad}`](https://addons.mozilla.org/firefox/addon/%7Ba1abd3a6-a241-401e-bac4-f7338abac0ad%7D/) |
| Microsoft Edge Add-ons | –                                                                                                                                |

## Category

Entertainment (Divertissement)

## Search terms

- **EN**: Deezer, Deezer app, open in app, desktop app, music link, Deezer desktop, ouvrir dans l'application
- **FR**: Deezer, application Deezer, ouvrir dans l'application, application de bureau, lien musique, Deezer bureau, open in app

## Name and short description

The manifest takes them from [`public/_locales`](../public/_locales).

- **EN**: Open Deezer in desktop app. Get redirected to the Deezer desktop app when you open a Deezer link in the browser.
- **FR**: Ouvrir Deezer dans l'application. Ouvrez les liens Deezer directement dans l'application Deezer plutôt que dans le navigateur.

## Description

### English

Clicked a Deezer link and landed in your browser? This extension opens it in the Deezer desktop app instead, right where you want to listen.

- Works with every deezer.com link: tracks, albums, playlists, artists, podcasts.
- Links with or without a language in the address (deezer.com/fr/…, deezer.com/pt-br/…) are supported.
- Nothing to set up: install it and open a Deezer link.
- On Firefox, the tab left behind closes on its own.
- No tracking: the extension sends no data to its developer.

Requires the Deezer desktop app. Not available on ChromeOS, which has no Deezer desktop app.

### Français

Vous cliquez sur un lien Deezer et vous vous retrouvez dans le navigateur ? Cette extension l'ouvre plutôt dans l'application Deezer, là où vous voulez écouter.

- Fonctionne avec tous les liens deezer.com : titres, albums, playlists, artistes, podcasts.
- Les liens avec ou sans langue dans l'adresse (deezer.com/fr/…, deezer.com/pt-br/…) sont pris en charge.
- Rien à configurer : installez-la, puis ouvrez un lien Deezer.
- Sur Firefox, l'onglet resté ouvert se ferme tout seul.
- Aucun pistage : l'extension n'envoie aucune donnée à son développeur.

Nécessite l'application Deezer pour ordinateur. Non disponible sur ChromeOS, où il n'y a pas d'application Deezer.

## Images

| Image                         | English                                                                       | Français                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Logo (300×300)                | [`logo-300x300.png`](logo-300x300.png)                                        | [`logo-300x300.png`](logo-300x300.png)                                                     |
| Small promo tile (440×280)    | [`promo-440x280-en.png`](promo-440x280-en.png)                                | [`promo-440x280-fr.png`](promo-440x280-fr.png)                                             |
| Marquee promo tile (1400×560) | [`promo-1400x560-en.png`](promo-1400x560-en.png)                              | [`promo-1400x560-fr.png`](promo-1400x560-fr.png)                                           |
| Screenshots (1280×800)        | none: the extension has no page, use the marquee tile if a store requires one | aucune : l'extension n'a pas de page, utiliser la grande vignette si un store en exige une |

## Notes for reviewers

### English

> No account or credentials needed. The Deezer desktop app must be installed (free, https://www.deezer.com/download) to see the redirect. Open a Deezer link in the browser, for example https://www.deezer.com/track/3135556: the extension opens it in the Deezer desktop app (deezer:// link). Without the desktop app, the browser shows its "open external application" prompt.

### Français

> Aucun compte ni identifiant nécessaire. L'application Deezer pour ordinateur doit être installée (gratuite, https://www.deezer.com/download) pour voir la redirection. Ouvrez un lien Deezer dans le navigateur, par exemple https://www.deezer.com/track/3135556 : l'extension l'ouvre dans l'application Deezer (lien deezer://). Sans l'application, le navigateur affiche sa demande « ouvrir une application externe ».

## Permissions (Chrome Web Store privacy practices)

### English

- **storage**: not requested.
- **Host permission** (content script on `https://www.deezer.com/*`): The content script runs on deezer.com pages only, to open the same page in the Deezer desktop app (deezer:// link). It reads only the page address, and sends nothing anywhere.
- **Remote code**: No.

### Français

- **storage** : non demandée.
- **Autorisation d'hôte** (script de contenu sur `https://www.deezer.com/*`) : le script de contenu ne s'exécute que sur les pages deezer.com, pour ouvrir la même page dans l'application Deezer pour ordinateur (lien deezer://). Il ne lit que l'adresse de la page et n'envoie rien nulle part.
- **Code distant** : non.

## Privacy

### English

No data collection: the extension only rewrites the address of deezer.com pages. Firefox: `data_collection_permissions: none`.

### Français

Aucune collecte de données : l'extension ne fait que réécrire l'adresse des pages deezer.com. Firefox : `data_collection_permissions: none`.
