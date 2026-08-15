# Instructions Codex - CHGA Mobile

Avant toute analyse, modification, verification ou mise en production de ce projet, lire
`HANDOFF_NOUVEAU_CODEX.md` en entier. Ce document est la source de verite pour
l'architecture, Netlify, OneSignal, le cron de notifications, les donnees CHGA, le
deploiement et les limites connues.

Regles importantes:

- Ne jamais afficher, copier dans un message ou committer une cle OneSignal, un secret
  de webhook ou le contenu d'un fichier `.env`.
- Ne pas supposer que le plugin WordPress est actif: le mecanisme de production actuel
  est la fonction planifiee Netlify.
- Distinguer ce qui est implemente dans le depot, ce qui a ete confirme en production et
  ce qui doit etre reverifie.
- Preserver les changements existants de l'utilisateur et executer `npm run build`
  apres toute modification de code.

