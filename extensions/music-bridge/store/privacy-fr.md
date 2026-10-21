Music Bridge ne collecte aucune donnée personnelle et ne demande aucun compte.

Quand vous ouvrez la page d'un titre ou d'un album sur une plateforme de streaming, l'extension envoie l'adresse de cette page au service de redirection de Music Bridge (https://music-bridge.bricodage.fr/, ou https://music-bridge-redirect.smndhm.workers.dev/ s'il est injoignable). Le service retrouve la même musique avec l'API Odesli (https://odesli.co/) et vous redirige vers elle sur la plateforme choisie. Rien d'autre n'est envoyé : aucune autre page visitée, aucun identifiant, aucun historique.

Le service de redirection fonctionne sur Cloudflare Workers. Ses journaux gardent quelques jours l'adresse de la page, la plateforme choisie, la redirection et le pays de la requête (tel que Cloudflare l'indique), pour corriger les erreurs ; ils ne servent à rien d'autre et ne sont pas partagés.

Vos réglages (la plateforme choisie, l'ouverture dans l'application de bureau, la fermeture de l'onglet) restent dans votre navigateur.

Questions : https://github.com/smndhm/web-extensions/issues
