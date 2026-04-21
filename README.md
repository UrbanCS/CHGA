# CHGA Mobile PWA

MVP d'une Progressive Web App mobile-first pour CHGA. L'app ne clone pas le site WordPress: elle lit les données publiques du site `https://www.chga.fm`, les normalise via un petit proxy Node/Vercel, puis les affiche dans une interface légère.

## 1. Audit de faisabilité

Le site expose une API REST WordPress exploitable à `https://www.chga.fm/wp-json/`.

Endpoints validés:

- Nouvelles: `wp/v2/posts?categories=19&_embed=1`
- Catégories: `wp/v2/categories`
- Balados: `wp/v2/podcast` et `ssp/v1/episodes`
- Événements: `tribe/events/v1/events`
- Écoute en direct: `chga/v1/radio/update` + AJAX public `admin-ajax.php?action=get_live_radio`

Point important: les nouvelles récentes retournent parfois `content.rendered`, `excerpt.rendered` et `featured_media` vides dans l'API REST. Les pages publiques contiennent pourtant l'article complet et l'image. Le MVP utilise donc l'API WP comme source principale et enrichit les nouvelles côté serveur en lisant la page publique de l'article.

## 2. Recommandation technique

Architecture retenue: React + TypeScript + Vite + Tailwind côté frontend, avec fonctions API Node/Vercel côté proxy.

Ce choix garde l'app rapide et simple à déployer, tout en évitant une dépendance fragile au HTML côté navigateur. Le proxy résout aussi les limites CORS et les champs WordPress manquants pour les nouvelles. Aucun backend lourd ni base de données n'est nécessaire pour le MVP. En local, un mini serveur API sans Express reproduit les fonctions Vercel pour lancer l'app avec une seule commande.

## 3. Scope MVP

Inclus dans le MVP:

- Accueil mobile-first
- Liste des dernières nouvelles réelles de CHGA
- Cartes avec image, titre, date, catégorie et extrait
- Vue article détaillée avec contenu complet
- Onglet Écoute en direct avec flux audio réel
- Manifest PWA, icônes, service worker et cache minimal de l'app shell
- États chargement, erreur réseau et vide
- Balados récents et événements dans l'onglet Plus
- Architecture de webhook push prête à brancher

Phase 2:

- Push complet avec OneSignal en production
- Navigation par catégories et recherche
- Favoris / lecture hors ligne d'articles
- Lecteur balado intégré complet
- Analytics PWA
- Synchronisation fine du cache d'articles

## 4. Échéancier réaliste

- Jour 1: audit, architecture, MVP nouvelles + article + direct
- Jour 2: PWA, cache, polish mobile, déploiement Vercel
- Jour 3: OneSignal, webhook WordPress, tests appareils iOS/Android
- Jour 4: balados/événements améliorés et corrections client

## 5. Arborescence

```text
.
├── api/
│   ├── _lib/chga.ts
│   ├── events.ts
│   ├── live.ts
│   ├── news.ts
│   ├── news/[slug].ts
│   ├── podcasts.ts
│   └── push-webhook.ts
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── manifest.webmanifest
│   └── sw.js
├── scripts/dev-api.ts
├── src/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   ├── styles/index.css
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
├── tailwind.config.ts
├── vercel.json
└── vite.config.ts
```

## 6. Installation locale

```bash
npm install
npm run dev
```

L'app démarre sur:

```text
http://localhost:5173
```

Le proxy API local démarre sur:

```text
http://localhost:8787
```

Dans WSL avec Node Windows, le serveur peut être plus fiable depuis le navigateur Windows que depuis `curl` Linux. L'interface reste disponible sur `http://localhost:5173`.

## 7. Build production

```bash
npm run build
npm run preview
```

## 8. Déploiement

### Vercel recommandé

1. Créer un projet Vercel depuis ce dépôt.
2. Garder la commande de build: `npm run build`.
3. Garder le dossier de sortie: `dist`.
4. Déployer.

Les fonctions dans `api/` deviennent automatiquement:

- `/api/news`
- `/api/news/:slug`
- `/api/live`
- `/api/podcasts`
- `/api/events`
- `/api/push-webhook`

### Netlify

Possible, mais il faudra déplacer les fonctions Vercel vers `netlify/functions`. Pour aller vite, Vercel est le chemin le plus direct.

## 9. Personnalisation

Nom de l'app:

- `public/manifest.webmanifest`
- `index.html`
- `src/App.tsx`

Couleurs:

- `tailwind.config.ts`
- `src/styles/index.css`
- `public/manifest.webmanifest` pour `theme_color`

Icônes:

- Remplacer `public/icons/icon-192.png`
- Remplacer `public/icons/icon-512.png`

Les icônes actuelles sont des placeholders propres aux couleurs CHGA. Pour production, exporter les vraies icônes depuis le logo officiel.

## 10. Notifications push

Choix recommandé: OneSignal.

Raison: configuration rapide, coût faible au démarrage, intégration WordPress existante possible, moins de code serveur qu'une implémentation Web Push maison.

Déjà présent dans le MVP:

- Service worker avec écoute `push`
- Endpoint `/api/push-webhook`
- Variable `VITE_ONESIGNAL_APP_ID` prévue
- Secret optionnel `CHGA_PUSH_WEBHOOK_SECRET`

Étapes restantes:

1. Créer une app Web Push dans OneSignal.
2. Configurer le domaine de production Vercel.
3. Ajouter `VITE_ONESIGNAL_APP_ID` dans Vercel.
4. Ajouter le SDK OneSignal côté frontend.
5. Installer/configurer le plugin OneSignal WordPress ou créer un webhook WordPress à la publication d'un post.
6. Faire appeler `/api/push-webhook` par WordPress avec `x-chga-secret`.
7. Dans `api/push-webhook.ts`, appeler l'API REST OneSignal avec le titre, l'extrait et l'URL de la nouvelle.

## 11. Limites actuelles

- Les nouvelles nécessitent parfois un enrichissement par scraping serveur, car l'API REST WordPress ne retourne pas toujours le contenu complet.
- Le cache service worker reste volontairement minimal.
- Les notifications ne sont pas activées sans compte OneSignal et configuration du domaine final.
- Les balados et événements sont en lecture légère dans l'onglet Plus.

## 12. Checklist finale de test

- `npm install`
- `npm run build`
- `npm run dev`
- Ouvrir `http://localhost:5173`
- Vérifier la liste des nouvelles
- Ouvrir un article complet
- Vérifier le bouton Direct et la lecture audio
- Vérifier l'onglet Plus
- Vérifier `manifest.webmanifest`
- Vérifier installation PWA dans Chrome mobile/desktop
- Tester hors ligne: l'app shell doit s'afficher
- Tester sur iOS Safari et Android Chrome avant livraison client
