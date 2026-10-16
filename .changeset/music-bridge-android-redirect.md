---
'music-bridge': patch
---

On Android, links open in the chosen platform's app again: the page goes through the redirect service, as before 1.9.0, instead of setting its address to the link, which Android does not hand to the app.
