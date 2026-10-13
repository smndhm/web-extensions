Music Bridge collects no personal data and has no account.

When you open a track or album page on a streaming platform, the extension sends the address of that page to Music Bridge's redirect service (https://music-bridge-redirect.smndhm.workers.dev/). The service looks up the same music with the Odesli API (https://odesli.co/) and redirects you to it on the platform you chose. Nothing else is sent: no other page you visit, no identifier, no history.

The redirect service runs on Cloudflare Workers. Its logs keep the address of the page, the chosen platform, the redirect and the country of the request (as Cloudflare reports it) for a few days, to fix errors; they are not used for anything else and are not shared.

Your settings (the chosen platform, opening links in the desktop app, closing the tab) stay in your browser.

Questions: https://github.com/smndhm/web-extensions/issues
