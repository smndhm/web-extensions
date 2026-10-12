# Deezer Tab: store listings

Everything the store listings ask for, in one place, in every language of the extension (English and French). The images are next to this file, rendered by `pnpm store-assets` and the Store screenshots workflow (see the [root README](../../../README.md#icons-and-store-images)).

## Stores

| Store                  | Listing                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Chrome Web Store       | [`meiclleccmfmheoplgelombebilpndea`](https://chromewebstore.google.com/detail/meiclleccmfmheoplgelombebilpndea) |
| addons.mozilla.org     | [`deezer-tab`](https://addons.mozilla.org/firefox/addon/deezer-tab/)                                            |
| Microsoft Edge Add-ons | –                                                                                                               |

## Category

Entertainment (Divertissement)

## Search terms

- **EN**: Deezer, new tab, music discovery, new tab music, album cover, music charts, nouvel onglet
- **FR**: Deezer, nouvel onglet, découverte musicale, musique nouvel onglet, pochette d'album, classement musical, new tab

## Name and short description

The manifest takes them from [`public/_locales`](../public/_locales).

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

| Image                         | English                                                                              | Français                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Logo (300×300)                | [`logo-300x300.png`](logo-300x300.png)                                               | [`logo-300x300.png`](logo-300x300.png)                                                           |
| Small promo tile (440×280)    | [`promo-440x280-en.png`](promo-440x280-en.png)                                       | [`promo-440x280-fr.png`](promo-440x280-fr.png)                                                   |
| Marquee promo tile (1400×560) | [`promo-1400x560-en.png`](promo-1400x560-en.png)                                     | [`promo-1400x560-fr.png`](promo-1400x560-fr.png)                                                 |
| Screenshots (1280×800)        | `screenshot-1280x800-*.png`, same for every language (the page only shows the track) | `screenshot-1280x800-*.png`, identiques pour toutes les langues (la page n'affiche que le titre) |

## Notes for reviewers

### English

> No account or credentials needed. Open a new tab: the page shows a track from Deezer's public API (api.deezer.com, no key required) with its cover, title and artist, on a background made from the cover's colors. Clicking the cover, title or artist opens it on deezer.com.

### Français

> Aucun compte ni identifiant nécessaire. Ouvrez un nouvel onglet : la page affiche un titre de l'API publique de Deezer (api.deezer.com, sans clé) avec sa pochette, son titre et son artiste, sur un fond aux couleurs de la pochette. Un clic sur la pochette, le titre ou l'artiste l'ouvre sur deezer.com.

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
