# Deezer Tab: store listings

Everything the store listings ask for, in one place. The images are in [`medias/`](medias), rendered by `pnpm store-assets` and the Store screenshots workflow (see the [root README](../../README.md#icons-and-store-images)).

## Stores

| Store                  | Listing                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Chrome Web Store       | [`meiclleccmfmheoplgelombebilpndea`](https://chromewebstore.google.com/detail/meiclleccmfmheoplgelombebilpndea) |
| addons.mozilla.org     | [`deezer-tab`](https://addons.mozilla.org/firefox/addon/deezer-tab/)                                            |
| Microsoft Edge Add-ons | –                                                                                                               |

## Category

Entertainment

## Search terms

Deezer, new tab, music discovery, new tab music, album cover, music charts, nouvel onglet

## Name and short description

The manifest takes them from [`public/_locales`](public/_locales).

- **EN**: Deezer Tab. Discover a Deezer track every time you open a new tab.
- **FR**: Deezer Tab. Découvrez un titre Deezer à chaque nouvel onglet.

## Description

### English

Deezer Tab replaces your new tab page with a track from Deezer's top playlists. Every new tab shows a different song, its cover, and a background made from the cover's colors.

- One click on the cover, the title or the artist opens it on Deezer.
- The text always stays readable: its color and the background are chosen for a contrast that meets the WCAG accessibility guidelines.
- Tracks are cached for an hour, so the page opens quickly and still works when Deezer cannot be reached.
- No account needed, no tracking: the extension sends no data to its developer.

Available in English and French.

### Français

Deezer Tab remplace la page du nouvel onglet par un titre des playlists phares de Deezer. Chaque nouvel onglet affiche une chanson différente, sa pochette et un fond aux couleurs de la pochette.

- Un clic sur la pochette, le titre ou l'artiste l'ouvre sur Deezer.
- Le texte reste toujours lisible : sa couleur et le fond sont choisis pour un contraste conforme aux règles d'accessibilité WCAG.
- Les titres sont gardés en cache une heure : la page s'ouvre vite et fonctionne même quand Deezer ne répond pas.
- Sans compte ni pistage : l'extension n'envoie aucune donnée à son développeur.

Disponible en anglais et en français.

## Images

| Image                         | File                                                     |
| ----------------------------- | -------------------------------------------------------- |
| Logo (300×300)                | [`medias/logo-300x300.png`](medias/logo-300x300.png)     |
| Small promo tile (440×280)    | [`medias/promo-440x280.png`](medias/promo-440x280.png)   |
| Marquee promo tile (1400×560) | [`medias/promo-1400x560.png`](medias/promo-1400x560.png) |
| Screenshots (1280×800)        | `medias/screenshot-1280x800-*.png`                       |

## Notes for reviewers

> No account or credentials needed. Open a new tab: the page shows a track from Deezer's public API (api.deezer.com, no key required) with its cover, title and artist, on a background made from the cover's colors. Clicking the cover, title or artist opens it on deezer.com.

## Permissions (Chrome Web Store privacy practices)

- **storage**: Caches the tracks loaded from the public Deezer API for one hour, so the new tab page opens instantly and still shows tracks when Deezer cannot be reached. Nothing else is stored, and nothing leaves the browser.
- **Host permission** (`https://api.deezer.com/*`): The new tab page loads tracks (title, artist, cover) from Deezer's public API, api.deezer.com. No other site is accessed.
- **Remote code**: No. All JavaScript ships in the package; the Deezer API only returns JSON data.

## Privacy

No data collection: the extension calls the public Deezer API and stores the tracks in the browser only. Firefox: `data_collection_permissions: none`.
