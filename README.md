# CHGA Mobile PWA

## Français

MVP d'une Progressive Web App mobile-first pour CHGA. L'app ne clone pas le site WordPress: elle lit les données publiques du site `https://www.chga.fm`, les normalise via un petit proxy serverless Netlify, puis les affiche dans une interface légère.

Site de production: `https://chgamobile.netlify.app/`

### 1. Audit de faisabilité

Le site expose une API REST WordPress exploitable à `https://www.chga.fm/wp-json/`.

Endpoints validés:

- Nouvelles: `wp/v2/posts?categories=19&_embed=1`
- Catégories: `wp/v2/categories`
- Balados: `wp/v2/podcast` et `ssp/v1/episodes`
- Événements: `tribe/events/v1/events`
- Écoute en direct: `chga/v1/radio/update` + AJAX public `admin-ajax.php?action=get_live_radio`

Point important: les nouvelles récentes retournent parfois `content.rendered`, `excerpt.rendered` et `featured_media` vides dans l'API REST. Les pages publiques contiennent pourtant l'article complet et l'image. Le MVP utilise donc l'API WP comme source principale et enrichit les nouvelles côté serveur en lisant la page publique de l'article.

### 2. Recommandation technique

Architecture retenue: React + TypeScript + Vite + Tailwind côté frontend, avec fonctions API Netlify côté proxy.

Ce choix garde l'app rapide et simple à déployer, tout en évitant une dépendance fragile au HTML côté navigateur. Le proxy résout aussi les limites CORS et les champs WordPress manquants pour les nouvelles. Aucun backend lourd ni base de données n'est nécessaire pour le MVP. En local, un mini serveur API sans Express reproduit les fonctions Netlify pour lancer l'app avec une seule commande.

### 3. Scope MVP

Inclus dans le MVP:

- Accueil mobile-first
- Liste des dernières nouvelles réelles de CHGA
- Cartes avec image, titre, date, catégorie et extrait
- Vue article détaillée avec contenu complet
- Onglet Écoute en direct avec flux audio réel
- Manifest PWA, icônes, service worker et cache minimal de l'app shell
- États chargement, erreur réseau et vide
- Balados récents et événements dans l'onglet Plus
- Notifications push OneSignal via webhook Netlify
- Mini plugin WordPress pour envoyer une notification à la publication d'une nouvelle

Phase 2:

- Navigation par catégories et recherche
- Favoris / lecture hors ligne d'articles
- Lecteur balado intégré complet
- Analytics PWA
- Synchronisation fine du cache d'articles
- Gestion avancée des segments OneSignal

### 4. Échéancier réaliste

- Jour 1: audit, architecture, MVP nouvelles + article + direct
- Jour 2: PWA, cache, polish mobile, déploiement Netlify
- Jour 3: OneSignal, webhook WordPress, tests appareils iOS/Android
- Jour 4: balados/événements améliorés et corrections client

### 5. Arborescence

```text
.
├── api/
│   └── _lib/chga.ts
├── netlify/
│   └── functions/
│       ├── _response.ts
│       ├── events.ts
│       ├── live.ts
│       ├── news.ts
│       ├── news-detail.ts
│       ├── podcasts.ts
│       └── push-webhook.ts
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── favicon.ico
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
├── wordpress/
│   └── chga-push-webhook/
│       ├── README.md
│       └── chga-push-webhook.php
├── .env.example
├── netlify.toml
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

### 6. Installation locale

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

### 7. Build production

```bash
npm run build
npm run preview
```

### 8. Déploiement

Netlify est recommandé.

1. Créer un nouveau site Netlify depuis ce dépôt.
2. Garder la commande de build: `npm run build`.
3. Garder le dossier de sortie: `dist`.
4. Netlify détectera `netlify.toml`.
5. Déployer.

Les redirects dans `netlify.toml` exposent les fonctions sous:

- `/api/news`
- `/api/news/:slug`
- `/api/live`
- `/api/podcasts`
- `/api/events`
- `/api/push-webhook`

Les fonctions Netlify réelles sont dans `netlify/functions/`. Le dossier `api/_lib/` contient seulement la logique partagée d'accès CHGA.

Développement local Netlify:

```bash
npm run dev:netlify
```

Cette commande utilise le CLI Netlify. Elle peut demander une connexion Netlify. Pour travailler sans connexion, `npm run dev` lance Vite avec le proxy API local.

### 9. Personnalisation

Nom de l'app:

- `public/manifest.webmanifest`
- `index.html`
- `src/App.tsx`

Couleurs:

- `tailwind.config.ts`
- `src/styles/index.css`
- `public/manifest.webmanifest` pour `theme_color`

Icônes:

- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/favicon.ico`

Les icônes actuelles utilisent les assets officiels CHGA récupérés depuis le site existant.

### 10. Notifications push

Choix recommandé: OneSignal.

Raison: configuration rapide, coût faible au démarrage, intégration WordPress existante possible, moins de code serveur qu'une implémentation Web Push maison.

Déjà présent dans le MVP:

- SDK OneSignal Web configuré côté frontend
- Service workers OneSignal sous `public/push/onesignal/`
- Endpoint `/api/push-webhook`
- Fonction planifiée `/api/check-news-push` qui vérifie les nouvelles CHGA toutes les 5 minutes
- Stockage Netlify Blobs pour mémoriser les articles déjà notifiés
- Variables Netlify `VITE_ONESIGNAL_APP_ID`, `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`
- Secret optionnel `CHGA_PUSH_WEBHOOK_SECRET`
- Plugin WordPress optionnel `wordpress/chga-push-webhook/` si un accès admin devient disponible plus tard

Variables Netlify requises:

- `VITE_ONESIGNAL_APP_ID`
- `ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`
- `CHGA_PWA_URL`
- `CHGA_PUSH_WEBHOOK_SECRET`

Automatisation sans accès WordPress:

1. Déployer le site sur Netlify.
2. Vérifier que les variables OneSignal sont configurées.
3. Netlify exécutera `netlify/functions/check-news-push.ts` toutes les 5 minutes.
4. Au premier passage, la fonction initialise la liste des articles déjà vus et n'envoie aucune notification.
5. Aux passages suivants, si une nouvelle CHGA apparaît, elle envoie une notification aux abonnés.

Test manuel de la vérification automatique:

```powershell
$headers = @{
  "x-chga-secret" = "votre-secret-netlify"
}

Invoke-RestMethod -Uri "https://chgamobile.netlify.app/api/check-news-push" -Method Post -Headers $headers
```

Option future avec accès WordPress:

1. Copier `wordpress/chga-push-webhook/` dans `wp-content/plugins/chga-push-webhook/`.
2. Activer l'extension `CHGA Push Webhook` dans WordPress.
3. Aller dans `Réglages > CHGA Push Webhook`.
4. Mettre `https://chgamobile.netlify.app/api/push-webhook` comme Webhook URL.
5. Mettre le même secret que `CHGA_PUSH_WEBHOOK_SECRET`.
6. Publier une nouvelle de test.

Le plugin envoie une notification seulement quand un article passe à `Publié`. Une modification d'article déjà publié ne renvoie pas de notification.

### 11. Limites actuelles

- Les nouvelles nécessitent parfois un enrichissement par scraping serveur, car l'API REST WordPress ne retourne pas toujours le contenu complet.
- Le cache service worker reste volontairement minimal et utilise une stratégie network-first pour les navigations.
- Les notifications nécessitent un compte OneSignal configuré sur le domaine final.
- Sans accès WordPress, les notifications automatiques ont un délai maximal d'environ 5 minutes.
- Les balados et événements sont en lecture légère dans l'onglet Plus.

### 12. Checklist finale de test

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
- S'abonner aux notifications depuis l'onglet Plus
- Envoyer un test manuel vers `/api/push-webhook`
- Appeler `/api/check-news-push` une première fois pour initialiser Netlify Blobs
- Vérifier les logs Netlify de la fonction planifiée après publication d'une nouvelle CHGA
- Tester hors ligne: l'app shell doit s'afficher
- Tester sur iOS Safari et Android Chrome avant livraison client

---

## English

Mobile-first Progressive Web App MVP for CHGA. The app does not clone the WordPress site: it reads public data from `https://www.chga.fm`, normalizes it through a small Netlify serverless proxy, then displays it in a lightweight mobile interface.

Production site: `https://chgamobile.netlify.app/`

### 1. Feasibility Audit

The site exposes a usable WordPress REST API at `https://www.chga.fm/wp-json/`.

Validated endpoints:

- News: `wp/v2/posts?categories=19&_embed=1`
- Categories: `wp/v2/categories`
- Podcasts: `wp/v2/podcast` and `ssp/v1/episodes`
- Events: `tribe/events/v1/events`
- Live radio: `chga/v1/radio/update` + public AJAX endpoint `admin-ajax.php?action=get_live_radio`

Important note: recent news posts sometimes return empty `content.rendered`, `excerpt.rendered`, and `featured_media` fields through the REST API. The public article pages still contain the complete article and image. The MVP therefore uses the WordPress API as the primary source and enriches news items server-side by reading the public article page when required.

### 2. Technical Recommendation

Chosen architecture: React + TypeScript + Vite + Tailwind on the frontend, with Netlify Functions as the API proxy.

This keeps the app fast and easy to deploy while avoiding fragile browser-side HTML scraping. The proxy also solves CORS concerns and compensates for missing WordPress fields. No heavy backend or database is needed for the MVP. Locally, a small API server without Express mirrors the Netlify Functions so the app can run with one command.

### 3. MVP Scope

Included in the MVP:

- Mobile-first home screen
- Real CHGA latest news list
- Cards with image, title, date, category, and excerpt
- Full article detail view
- Live radio tab with the real audio stream
- PWA manifest, icons, service worker, and minimal app shell cache
- Loading, network error, and empty states
- Recent podcasts and events in the More tab
- OneSignal push notifications through a Netlify webhook
- Small WordPress plugin to send a notification when a news post is published

Phase 2:

- Category navigation and search
- Favorites / offline article reading
- Full embedded podcast player
- PWA analytics
- More granular article caching
- Advanced OneSignal segment management

### 4. Realistic Timeline

- Day 1: audit, architecture, news + article + live MVP
- Day 2: PWA, cache, mobile polish, Netlify deployment
- Day 3: OneSignal, WordPress webhook, iOS/Android device testing
- Day 4: improved podcasts/events and client feedback fixes

### 5. Project Structure

```text
.
├── api/
│   └── _lib/chga.ts
├── netlify/
│   └── functions/
│       ├── _response.ts
│       ├── events.ts
│       ├── live.ts
│       ├── news.ts
│       ├── news-detail.ts
│       ├── podcasts.ts
│       └── push-webhook.ts
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── favicon.ico
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
├── wordpress/
│   └── chga-push-webhook/
│       ├── README.md
│       └── chga-push-webhook.php
├── .env.example
├── netlify.toml
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

### 6. Local Setup

```bash
npm install
npm run dev
```

The app starts at:

```text
http://localhost:5173
```

The local API proxy starts at:

```text
http://localhost:8787
```

When using WSL with Windows Node, the server may be more reliable from a Windows browser than from Linux `curl`. The UI remains available at `http://localhost:5173`.

### 7. Production Build

```bash
npm run build
npm run preview
```

### 8. Deployment

Netlify is recommended.

1. Create a new Netlify site from this repository.
2. Keep the build command as `npm run build`.
3. Keep the publish directory as `dist`.
4. Netlify will detect `netlify.toml`.
5. Deploy.

Redirects in `netlify.toml` expose the functions under:

- `/api/news`
- `/api/news/:slug`
- `/api/live`
- `/api/podcasts`
- `/api/events`
- `/api/push-webhook`

The actual Netlify Functions live in `netlify/functions/`. The `api/_lib/` folder only contains shared CHGA access logic.

Netlify local development:

```bash
npm run dev:netlify
```

This command uses the Netlify CLI and may require a Netlify login. To work without logging in, `npm run dev` starts Vite with the local API proxy.

### 9. Customization

App name:

- `public/manifest.webmanifest`
- `index.html`
- `src/App.tsx`

Colors:

- `tailwind.config.ts`
- `src/styles/index.css`
- `public/manifest.webmanifest` for `theme_color`

Icons:

- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/favicon.ico`

The current icons use official CHGA assets retrieved from the existing website.

### 10. Push Notifications

Recommended provider: OneSignal.

Reason: quick setup, low cost at launch, possible WordPress integration, and less server code than a custom Web Push implementation.

Already present in the MVP:

- OneSignal Web SDK configured on the frontend
- OneSignal service workers under `public/push/onesignal/`
- `/api/push-webhook` endpoint
- Scheduled `/api/check-news-push` function that checks CHGA news every 5 minutes
- Netlify Blobs storage to remember already notified articles
- Netlify variables `VITE_ONESIGNAL_APP_ID`, `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`
- Optional `CHGA_PUSH_WEBHOOK_SECRET`
- Optional WordPress plugin in `wordpress/chga-push-webhook/` if admin access becomes available later

Required Netlify variables:

- `VITE_ONESIGNAL_APP_ID`
- `ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`
- `CHGA_PWA_URL`
- `CHGA_PUSH_WEBHOOK_SECRET`

Automation without WordPress access:

1. Deploy the site to Netlify.
2. Make sure the OneSignal variables are configured.
3. Netlify will run `netlify/functions/check-news-push.ts` every 5 minutes.
4. On the first run, the function initializes the list of already seen articles and sends no notification.
5. On later runs, if a new CHGA article appears, it sends a notification to subscribers.

Manual test for the automatic check:

```powershell
$headers = @{
  "x-chga-secret" = "your-netlify-secret"
}

Invoke-RestMethod -Uri "https://chgamobile.netlify.app/api/check-news-push" -Method Post -Headers $headers
```

Future option with WordPress access:

1. Copy `wordpress/chga-push-webhook/` to `wp-content/plugins/chga-push-webhook/`.
2. Activate the `CHGA Push Webhook` plugin in WordPress.
3. Go to `Settings > CHGA Push Webhook`.
4. Use `https://chgamobile.netlify.app/api/push-webhook` as the Webhook URL.
5. Use the same secret as `CHGA_PUSH_WEBHOOK_SECRET`.
6. Publish a test news post.

The plugin only sends a notification when a post first changes to `Published`. Editing an already published post does not send another notification.

### 11. Current Limitations

- News items sometimes require server-side page enrichment because the WordPress REST API does not always return complete content.
- The service worker cache is intentionally minimal and uses network-first for navigations.
- Push notifications require a OneSignal account configured for the final domain.
- Without WordPress access, automatic notifications can be delayed by up to about 5 minutes.
- Podcasts and events are lightweight in the More tab.

### 12. Final Test Checklist

- `npm install`
- `npm run build`
- `npm run dev`
- Open `http://localhost:5173`
- Check the news list
- Open a full article
- Check the Live button and audio playback
- Check the More tab
- Check `manifest.webmanifest`
- Check PWA installation in Chrome mobile/desktop
- Subscribe to notifications from the More tab
- Send a manual test to `/api/push-webhook`
- Call `/api/check-news-push` once to initialize Netlify Blobs
- Check Netlify scheduled function logs after a new CHGA article is published
- Test offline mode: the app shell should display
- Test on iOS Safari and Android Chrome before client delivery
