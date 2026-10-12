---
'music-bridge': minor
---

Rebuilt with WXT in the web-extensions monorepo: Manifest V3 on Chrome, Manifest V2 on Firefox.

- Send the music link to the redirect service encoded once instead of twice.
- Options page: no more HTML in translations, a heading for assistive technologies, the save confirmation announced in a polite live region, and the Odesli link telling it opens a new tab.
- Ignore the "Open in desktop app" setting for platforms without app links.
- Handle Tidal pages on tidal.com, where listen.tidal.com now redirects.
- Handle Napster pages on play.napster.com, where Odesli now links.
