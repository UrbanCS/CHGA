# CHGA Push Webhook

Mini plugin WordPress qui appelle le webhook Netlify de CHGA Mobile quand une nouvelle est publiée.

## Installation

1. Copier le dossier `chga-push-webhook` dans `wp-content/plugins/`.
2. Dans WordPress, aller dans `Extensions`.
3. Activer `CHGA Push Webhook`.
4. Aller dans `Réglages > CHGA Push Webhook`.
5. Mettre:

```text
Webhook URL: https://chgamobile.netlify.app/api/push-webhook
Webhook secret: la même valeur que CHGA_PUSH_WEBHOOK_SECRET dans Netlify
```

## Comportement

- Envoie une notification seulement quand un article WordPress passe à `Publié`.
- N'envoie pas de notification quand un article déjà publié est simplement modifié.
- Ignore les brouillons, révisions, sauvegardes automatiques et autres types de contenus.
- Envoie à Netlify: titre, extrait, URL, image principale, ID WordPress et date de publication.
- Ouvre la notification dans la PWA avec un lien du type `https://chgamobile.netlify.app/?article=slug`.

## Test recommandé

1. Créer un nouvel article de test dans WordPress.
2. Ajouter un titre, un extrait ou du contenu, et une image mise en avant.
3. Publier l'article.
4. Vérifier que la notification arrive sur un appareil abonné.
5. Supprimer l'article de test si nécessaire.

## Dépannage

- Si aucune notification n'arrive, vérifier que le webhook manuel PowerShell fonctionne encore.
- Vérifier que `Webhook secret` correspond exactement à `CHGA_PUSH_WEBHOOK_SECRET`.
- Vérifier que `ONESIGNAL_APP_ID` et `ONESIGNAL_REST_API_KEY` existent dans Netlify.
- Consulter les logs PHP/WordPress si le plugin reçoit une erreur HTTP de Netlify.
