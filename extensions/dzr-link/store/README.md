# Deezer Link: store listings

Everything the store listings ask for, in one place, in every language of the extension (English and French). The images are next to this file, rendered by `pnpm store-assets` (see the [root README](../../../README.md#icons-and-store-images)).

## Stores

| Store                  | Listing                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Chrome Web Store       | [`depodknemkobjklhmpemeagnehojilng`](https://chromewebstore.google.com/detail/depodknemkobjklhmpemeagnehojilng)                  |
| addons.mozilla.org     | [`{a1abd3a6-a241-401e-bac4-f7338abac0ad}`](https://addons.mozilla.org/firefox/addon/%7Ba1abd3a6-a241-401e-bac4-f7338abac0ad%7D/) |
| Microsoft Edge Add-ons | [`ninmdmngfpladjdhbbdlbiclcadhcchl`](https://microsoftedge.microsoft.com/addons/detail/ninmdmngfpladjdhbbdlbiclcadhcchl)         |

## Category

- Chrome Web Store, Microsoft Edge Add-ons: Entertainment (Divertissement)
- addons.mozilla.org: Photos, Music & Videos, set by `pnpm amo-listing`

## Search terms

- **EN**: Deezer, Deezer app, open in app, desktop app, music link, Deezer desktop, Deezer links
- **FR**: Deezer, application Deezer, ouvrir dans l'application, application de bureau, lien musique, Deezer bureau, liens Deezer

## Name and short description

The manifest takes them from [`public/_locales`](../public/_locales).

- **EN**: Deezer Link. Open Deezer links in the desktop app instead of the browser.
- **FR**: Deezer Link. Ouvrez les liens Deezer dans l'application de bureau plutôt que dans le navigateur.

## Description

The long description, sent as is to addons.mozilla.org by `pnpm amo-listing` (some Markdown: lists, bold, links), and to paste in the other stores:

- English: [`description-en.md`](description-en.md)
- Français : [`description-fr.md`](description-fr.md)

## Images

| Image                         | English                                                                       | Français                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Store icon (128×128)          | [`../public/icons/128.png`](../public/icons/128.png)                          | [`../public/icons/128.png`](../public/icons/128.png)                                       |
| Logo (300×300)                | [`logo-300x300.png`](logo-300x300.png)                                        | [`logo-300x300.png`](logo-300x300.png)                                                     |
| Small promo tile (440×280)    | [`promo-440x280-en.png`](promo-440x280-en.png)                                | [`promo-440x280-fr.png`](promo-440x280-fr.png)                                             |
| Marquee promo tile (1400×560) | [`promo-1400x560-en.png`](promo-1400x560-en.png)                              | [`promo-1400x560-fr.png`](promo-1400x560-fr.png)                                           |
| Screenshots (1280×800)        | none: the extension has no page, use the marquee tile if a store requires one | aucune : l'extension n'a pas de page, utiliser la grande vignette si un store en exige une |

## Notes for reviewers

In English, for the reviewers of every store: [`notes-for-reviewers.md`](notes-for-reviewers.md). The Publish workflow sends it to addons.mozilla.org with each version.

## Single purpose (Chrome Web Store and Edge Add-ons)

- English: Open deezer.com links in the Deezer desktop app instead of the browser.
- Français : Ouvrir les liens deezer.com dans l'application Deezer pour ordinateur plutôt que dans le navigateur.

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
