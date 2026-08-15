# Transfert complet - CHGA Mobile

Derniere mise a jour du transfert: 14 aout 2026

Ce document doit etre lu en entier par tout nouveau chat Codex avant de modifier le
projet. Il rassemble le contexte produit, le fonctionnement reel, l'hebergement, les
notifications, les decisions deja prises, les tests et les limites connues. Il ne
contient volontairement aucun secret.

## 1. Resume du projet

CHGA Mobile est une Progressive Web App (PWA) mobile-first pour la radio communautaire
CHGA. Ce n'est pas une application App Store ou Google Play et ce n'est pas une copie du
site WordPress. Elle lit les donnees publiques de `https://www.chga.fm`, les normalise
avec de petites fonctions Netlify et les presente dans une interface mobile legere.

Fonctions principales actuellement implementees:

- accueil avec les dernieres nouvelles;
- liste complete des nouvelles;
- article detaille avec image principale, categorie, date, auteur et texte complet;
- extraits audio places au bon endroit dans l'article, avec la photo propre a chaque
  extrait audio;
- ecoute en direct de CHGA;
- balados et evenements dans l'onglet Plus;
- installation PWA avec icone officielle CHGA;
- abonnement et desabonnement aux notifications push;
- notification automatique lorsqu'une nouvelle CHGA est detectee;
- liens officiels Facebook, X et Instagram;
- etats de chargement, erreur reseau et contenu vide.

Navigation principale: `Accueil`, `Nouvelles`, `Direct`, `Plus`.

## 2. Adresses, depot et branche

- Production: `https://chgamobile.netlify.app/`
- Site source: `https://www.chga.fm/`
- Hebergement actif: Netlify
- Nom visible du site Netlify: `chgamobile`
- Depot GitHub: `https://github.com/UrbanCS/CHGA.git`
- Branche de production: `main`
- Commit au moment de ce transfert: `c738b0c` (`Centralize customizable site content config`)
- Repertoire historique Windows: `C:\Users\marca\OneDrive\Desktop\CHGA`
- Chemin WSL correspondant: `/mnt/c/Users/marca/OneDrive/Desktop/CHGA`

Le deploiement Netlify est relie au depot et utilise:

- commande de build: `npm run build`;
- dossier publie: `dist`;
- version Node: 20;
- fonctions: `netlify/functions`;
- bundler des fonctions: esbuild.

La configuration est dans `netlify.toml`. Une modification poussee sur `main` declenche
normalement un nouveau deploiement de production. Verifier le deploiement dans Netlify
apres chaque push; ne pas confondre une Deploy Preview avec l'URL principale.

## 3. Architecture

Stack:

- React 18;
- TypeScript strict;
- Vite 6;
- Tailwind CSS 3;
- fonctions serverless Netlify;
- Netlify Blobs pour l'etat du cron;
- OneSignal Web SDK v16 pour les notifications;
- aucune base de donnees applicative classique.

Flux principal:

```text
Navigateur/PWA
  -> /api/* sur chgamobile.netlify.app
  -> redirects Netlify
  -> fonctions dans netlify/functions/
  -> logique partagee api/_lib/chga.ts
  -> API REST et pages publiques de chga.fm
```

Le navigateur ne scrape pas CHGA directement. Le scraping/enrichissement se fait dans
les fonctions serveur afin d'eviter CORS et de centraliser les ajustements quand le HTML
de CHGA change.

## 4. Sources de donnees CHGA

Logique centrale: `api/_lib/chga.ts`.

Sources utilisees:

- nouvelles: `https://www.chga.fm/wp-json/wp/v2/posts?categories=19&...`;
- article par slug: `wp/v2/posts?slug=...&_embed=1`, puis page publique de l'article;
- balados: `wp-json/wp/v2/podcast`;
- evenements: `wp-json/tribe/events/v1/events`;
- emission en cours: `wp-json/chga/v1/radio/update`;
- URL du flux direct: AJAX public WordPress
  `wp/wp-admin/admin-ajax.php` avec `action=get_live_radio`;
- flux de secours: `https://arcq.streamb.live/SB00209`.

Pourquoi le HTML public est aussi lu:

- certains articles retournent des champs REST incomplets;
- l'image de l'article doit venir de `figure.figure__main` ou des metadonnees sociales;
- l'auteur et certains paragraphes ne sont disponibles que sur la page publique;
- les extraits audio CHGA sont des blocs `article.podcast__preview`;
- chaque extrait doit garder sa propre image, generalement la personne interrogee;
- les paragraphes et extraits audio doivent rester dans l'ordre de l'article.

Regle visuelle deja corrigee et a ne pas regresser:

- la carte de nouvelle et le haut de l'article montrent l'image principale de l'article;
- les cartes d'extraits audio montrent l'image de la personne associee a l'extrait;
- ne pas reutiliser automatiquement l'image principale pour tous les extraits audio.

Si CHGA change son HTML, inspecter d'abord `parseArticlePage()` et
`parseContentBlocks()` dans `api/_lib/chga.ts`.

## 5. Routes API Netlify

Routes publiques de lecture:

- `GET /api/news?limit=12`
- `GET /api/news/:slug`
- `GET /api/news-detail?slug=...`
- `GET /api/live`
- `GET /api/podcasts`
- `GET /api/events`

Routes de notifications:

- `POST /api/push-webhook`: envoi manuel ou futur appel WordPress;
- `POST /api/check-news-push`: execution manuelle protegee du controle des nouvelles;
- la fonction Netlify `check-news-push` est aussi executee automatiquement par Netlify.

Les redirects sont declares dans `netlify.toml`. Le dernier redirect renvoie toute autre
URL vers `index.html`, necessaire pour la PWA.

## 6. Notifications automatiques en production

Le mecanisme actif ne depend pas d'un acces administrateur WordPress.

1. `netlify/functions/check-news-push.ts` est une Scheduled Function Netlify.
2. Son horaire est `*/5 * * * *`, donc toutes les cinq minutes.
3. Elle appelle `runCheckNewsPush()` dans `_check-news-push.ts`.
4. Elle lit les 10 nouvelles CHGA les plus recentes.
5. Netlify Blobs conserve l'etat dans le store `chga-push`, cle `notified-news`.
6. Au tout premier passage sans etat, les articles existants sont memorises sans envoyer
   de notification. Cela evite un envoi massif initial.
7. Aux passages suivants, les nouveaux ID WordPress sont compares aux ID deja connus.
8. Un maximum de trois notifications est envoye par passage, dans l'ordre chronologique.
9. Jusqu'a 100 ID deja vus sont gardes pour eviter les doublons.
10. `_onesignal.ts` envoie les messages a OneSignal.
11. La notification ouvre la PWA avec `?article=slug`; `src/App.tsx` lit ce parametre,
    ouvre l'article puis nettoie l'URL.

Delai attendu: normalement de quelques secondes a environ cinq minutes apres que la
nouvelle est visible dans la source CHGA. Le delai peut etre plus long si CHGA, Netlify
ou OneSignal connait un retard temporaire.

Comportement confirme pendant le projet:

- la Scheduled Function a ete vue active dans Netlify avec un horaire de cinq minutes;
- des notifications automatiques de vraies nouvelles CHGA ont ete recues sur telephone;
- le test webhook manuel OneSignal a aussi ete recu;
- les abonnes sont visibles dans OneSignal sous Audience/Subscriptions.

Ces confirmations datent des tests du projet. Pour une nouvelle session de maintenance,
reverifier les logs Netlify et faire un test sur un appareil abonne avant d'affirmer que
la chaine externe fonctionne encore.

## 7. OneSignal

- Organisation OneSignal utilisee lors de la configuration: `Webaction`.
- Application OneSignal: `CHGA Mobile`.
- App ID public configure lors du projet:
  `27ff5558-d957-47c7-b545-214d4f2a968c`.
- Domaine Web Push configure: `https://chgamobile.netlify.app/`.
- SDK charge dans `index.html`: OneSignal Web SDK v16.
- Service workers OneSignal:
  `public/push/onesignal/OneSignalSDKWorker.js` et
  `OneSignalSDKUpdaterWorker.js`.
- Portee OneSignal: `/push/onesignal/`.
- Le bouton natif OneSignal est desactive; l'interface CHGA gere l'abonnement.

Les utilisateurs n'ont pas besoin de compte OneSignal. Ils autorisent simplement les
notifications dans leur navigateur. L'etat reel vient de
`OneSignal.User.PushSubscription.optedIn`; un petit indicateur localStorage sert de
retour rapide d'interface.

Dans `Plus`, le bouton permet:

- d'activer les notifications;
- d'afficher l'etat actif lors d'une prochaine visite;
- de desactiver les notifications CHGA avec `optOut()`;
- d'expliquer que l'autorisation globale du navigateur peut aussi etre retiree dans les
  reglages du site.

Envoi serveur OneSignal:

- API: `https://api.onesignal.com/notifications`;
- canal: push Web;
- ciblage actuel: abonnements Web ayant au moins une session;
- titre et contenu fournis en francais et en anglais avec le meme texte CHGA;
- icone: `/icons/icon-192.png`;
- grande image: image de la nouvelle lorsqu'elle existe.

Erreur historique utile: `All included players are not subscribed` signifie que la cle
et l'App ID peuvent etre valides, mais qu'aucun abonnement cible actif n'existe dans
l'application OneSignal utilisee. Verifier que l'appareil et les cles sont rattaches a
la meme application OneSignal.

## 8. Variables d'environnement

Modele: `.env.example`. Les vraies valeurs doivent rester dans les variables Netlify ou
dans un fichier local `.env` ignore par Git.

Variables frontend, integrees au moment du build:

- `VITE_ONESIGNAL_APP_ID`: App ID public OneSignal;
- `VITE_API_BASE_URL`: vide en production; optionnel pour une API externe;
- `VITE_APP_NAME`: variable historique, actuellement le nom visible vient plutot de
  `src/lib/site-config.ts`.

Variables serveur Netlify:

- `ONESIGNAL_APP_ID`: App ID OneSignal cote fonctions;
- `ONESIGNAL_REST_API_KEY`: cle secrete d'envoi OneSignal;
- `CHGA_PWA_URL`: normalement `https://chgamobile.netlify.app/`;
- `CHGA_PUSH_WEBHOOK_SECRET`: protege le webhook et le controle manuel.

Regles de securite:

- `ONESIGNAL_REST_API_KEY` est un secret et ne doit jamais apparaitre dans le frontend,
  GitHub, une capture ou un chat;
- `CHGA_PUSH_WEBHOOK_SECRET` doit etre considere obligatoire en production. Si cette
  variable est absente, les routes manuelles acceptent les appels sans secret;
- un ancien secret de webhook a ete saisi en clair dans des exemples de terminal pendant
  le projet. Il faut le faire tourner dans Netlify avant la remise finale au client, puis
  utiliser seulement la nouvelle valeur;
- ne jamais lire ou afficher un `.env` dans une reponse Codex;
- apres une modification de variable `VITE_*`, relancer un deploiement car elle est
  integree au bundle frontend au moment du build.

## 9. Webhook manuel et plugin WordPress

`netlify/functions/push-webhook.ts` accepte un JSON contenant notamment:

```json
{
  "title": "Titre",
  "excerpt": "Resume",
  "url": "https://chgamobile.netlify.app/?article=slug",
  "imageUrl": "https://www.chga.fm/image.jpg"
}
```

L'entete `x-chga-secret` doit correspondre a `CHGA_PUSH_WEBHOOK_SECRET`.

Un mini plugin existe dans `wordpress/chga-push-webhook/`. Il peut appeler le webhook
immediatement lorsqu'un article passe pour la premiere fois a l'etat `publish`.

Etat important: ce plugin est une option future et n'est pas le mecanisme actif, car
l'utilisateur n'avait pas acces a l'administration WordPress CHGA. Ne jamais annoncer
qu'il est installe sans verification dans WordPress. Tant qu'il n'est pas installe, le
cron Netlify demeure la source des notifications automatiques.

## 10. Installation PWA

Fichiers:

- `public/manifest.webmanifest`;
- `public/icons/icon-192.png`;
- `public/icons/icon-512.png`;
- `public/favicon.ico`;
- `public/sw.js`.

Le service worker principal utilise le cache `chga-pwa-v2`. Il met en cache le manifest,
les icones, le favicon et les ressources visitees. Les navigations utilisent une
strategie network-first avec retour au shell deja mis en cache. Les routes `/api/` ne
sont pas mises en cache par ce service worker.

Installation selon l'appareil:

- Android/Chrome et certains navigateurs desktop: si `beforeinstallprompt` est emis, le
  bouton `Installer l'app` ouvre l'invite native;
- iPhone/iPad: Safari ne fournit generalement pas cet evenement. L'utilisateur doit
  utiliser Partager, puis Ajouter a l'ecran d'accueil;
- navigation privee/incognito ou appareil non admissible: l'invite native peut ne pas
  apparaitre. Le bouton devient `Voir comment l'installer` et ouvre les instructions;
- il n'existe pas de lien universel capable d'installer automatiquement une PWA sur tous
  les telephones sans confirmation de l'utilisateur.

Les instructions iPhone et Android sont volontairement conservees dans l'onglet Plus
comme solution de secours. Elles sont placees juste apres la carte Notifications et
avant les reseaux sociaux.

## 11. Personnalisation

Le look et le contenu sont personnalisables dans le code; il n'existe pas de panneau
d'administration pour l'utilisateur final.

Point central pour les textes, les noms, les liens sociaux et les fonctions visibles:

- `src/lib/site-config.ts`.

Autres fichiers de personnalisation:

- couleurs Tailwind: `tailwind.config.ts`;
- styles d'article/audio: `src/styles/index.css`;
- manifest, couleurs PWA et nom d'installation: `public/manifest.webmanifest`;
- titre et metadonnees initiales: `index.html`;
- icones: `public/icons/` et `public/favicon.ico`.

Les couleurs principales actuelles sont bleu `#151f6d`, orange CHGA `#fa4616`, fond
`#f4f7fb` et encre `#141720`.

Liens sociaux officiels actuellement configures:

- Facebook: `https://www.facebook.com/chga.fm`;
- X: `https://twitter.com/RadioChga`;
- Instagram: `https://www.instagram.com/radiochga/`.

## 12. Carte des fichiers

- `src/App.tsx`: navigation interne, chargement des nouvelles/articles, lien de
  notification, service worker, invite d'installation;
- `src/pages/HomePage.tsx`: accueil et bouton d'installation;
- `src/pages/NewsPage.tsx`: liste des nouvelles;
- `src/pages/ArticlePage.tsx`: article complet et cartes d'extraits audio;
- `src/pages/LivePage.tsx`: lecteur du direct;
- `src/pages/MorePage.tsx`: notifications, installation, reseaux, balados, evenements;
- `src/lib/site-config.ts`: textes et options personnalisables;
- `src/lib/onesignal.ts`: initialisation, abonnement et desabonnement OneSignal;
- `src/lib/api.ts`: client API frontend;
- `src/lib/types.ts`: contrats de donnees frontend;
- `api/_lib/chga.ts`: recuperation, enrichissement et parsing de CHGA;
- `netlify/functions/*.ts`: endpoints Netlify;
- `netlify/functions/_check-news-push.ts`: detection et etat anti-doublon;
- `netlify/functions/_onesignal.ts`: envoi des notifications;
- `netlify.toml`: build, fonctions et redirects;
- `public/sw.js`: cache PWA principal;
- `scripts/dev-api.ts`: API locale sans Netlify;
- `wordpress/chga-push-webhook/`: option WordPress non active;
- `README.md`: documentation bilingue generale;
- `.env.example`: noms de variables sans valeurs secretes.

## 13. Developpement local

Prealables: Git et Node.js 20.

```bash
npm install
npm run dev
```

Adresses locales:

- frontend Vite: `http://localhost:5173`;
- mini API locale: `http://localhost:8787`.

Autres commandes:

```bash
npm run build
npm run preview
npm run lint
npm run dev:netlify
```

`npm run dev` suffit pour les donnees CHGA, mais ne reproduit pas completement les
fonctions OneSignal/Netlify Blobs. Pour tester ces fonctions localement, utiliser
`npm run dev:netlify` apres authentification Netlify et avec des variables locales
securisees.

## 14. Tests operationnels

Build et interface:

1. Executer `npm install` si necessaire.
2. Executer `npm run build`.
3. Ouvrir l'accueil, Nouvelles, un article avec plusieurs extraits, Direct et Plus.
4. Verifier sur mobile et desktop qu'aucun texte ne deborde.
5. Verifier l'image principale de l'article et les images propres aux extraits audio.
6. Verifier l'installation Android/desktop et les instructions iPhone.

Production:

```powershell
Invoke-RestMethod -Uri "https://chgamobile.netlify.app/api/news?limit=1" -Method Get
```

Controle manuel du cron, en utilisant la valeur Netlify sans l'ecrire dans le depot:

```powershell
$headers = @{
  "x-chga-secret" = "COLLER_ICI_LE_SECRET_ACTUEL"
}

Invoke-RestMethod `
  -Uri "https://chgamobile.netlify.app/api/check-news-push" `
  -Method Post `
  -Headers $headers
```

Resultat attendu: JSON avec `checkedAt`, `initialized`, `totalNews`,
`notificationsSent` et `notifiedTitles`.

Attention: le controle manuel modifie le meme etat Netlify Blobs que le cron. Il ne faut
pas supprimer ou reinitialiser cet etat pour faire un test en production, car cela peut
changer quels articles seront consideres nouveaux.

Test d'envoi manuel:

```powershell
$headers = @{
  "Content-Type" = "application/json"
  "x-chga-secret" = "COLLER_ICI_LE_SECRET_ACTUEL"
}

$body = @{
  title = "Test CHGA Mobile"
  excerpt = "Test de la chaine OneSignal."
  url = "https://chgamobile.netlify.app/"
  imageUrl = "https://chgamobile.netlify.app/icons/icon-512.png"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://chgamobile.netlify.app/api/push-webhook" `
  -Method Post `
  -Headers $headers `
  -Body $body
```

Pour diagnostiquer les notifications:

- Netlify > Functions > `check-news-push` > logs;
- verifier l'horaire et la prochaine execution;
- chercher une ligne `check-news-push` avec `notificationsSent` et `notifiedTitles`;
- OneSignal > Audience > Subscriptions pour confirmer `Subscribed`;
- OneSignal > Delivery/Messages pour verifier la livraison;
- verifier les permissions de notification du domaine sur l'appareil.

## 15. Etat verifie au moment de ce transfert

- Le depot etait propre avant l'ajout de ces documents.
- `main` et `origin/main` pointaient sur `c738b0c`.
- Le build TypeScript/Vite a ete relance pendant la preparation du transfert.
- Le 14 aout 2026, `https://chgamobile.netlify.app/` retournait l'application et son
  manifest PWA.
- Le meme jour, `GET /api/news?limit=1` retournait HTTP 200 avec une nouvelle CHGA
  reelle.
- Les notifications automatiques et le webhook avaient ete confirmes auparavant sur un
  telephone, mais une nouvelle livraison push n'a pas ete declenchee uniquement pour ce
  transfert afin d'eviter une notification inutile aux abonnes.

## 16. Limites et risques connus

- Le parsing d'article depend en partie du HTML public de CHGA. Un changement de gabarit
  peut casser l'image, l'auteur, les paragraphes ou les extraits audio.
- L'API CHGA et le direct sont des services externes; l'app doit conserver ses etats
  d'erreur et de reessai.
- Le cache est volontairement minimal; les articles et API ne sont pas garantis hors
  ligne.
- Les notifications dependent des permissions de l'appareil, de OneSignal, de Netlify et
  du navigateur.
- Si plus de trois nouvelles apparaissent entre deux controles, seules les trois
  premieres retenues par le controle sont envoyees. Les ID presents dans les 10
  nouvelles courantes sont ensuite memorises; les autres ne seront donc pas rattrapees
  au passage suivant. A cinq minutes d'intervalle, ce cas devrait rester exceptionnel,
  mais cette limite doit etre revue si CHGA publie parfois en lot.
- iOS impose une installation manuelle via Safari et l'ecran Partager.
- La PWA n'est pas un APK, une application Play Store ou une application App Store.
- Balados et evenements sont des fonctions legeres du MVP.
- Une migration vers cPanel/Webaction ou Joomla est possible, mais pas directe: il faut
  remplacer les fonctions Netlify, Netlify Blobs et la Scheduled Function par un backend
  serveur, un stockage durable et un cron cPanel. OneSignal peut rester le fournisseur
  push si le domaine et les service workers sont reconfigures.

## 17. Ne pas faire sans verification

- Ne pas annoncer que le plugin WordPress est installe.
- Ne pas supprimer l'etat Netlify Blobs pour tester le cron.
- Ne pas mettre la REST API key OneSignal dans une variable `VITE_*`.
- Ne pas committer `.env`, cles ou secrets.
- Ne pas remplacer l'image d'un extrait audio par l'image principale de l'article.
- Ne pas promettre un bouton universel d'installation automatique sur iPhone.
- Ne pas migrer hors Netlify en copiant seulement `dist`; les API, le cron, l'etat et les
  notifications serveur doivent aussi etre remplaces.

## 18. Reprise sur un autre ordinateur

1. Cloner le depot:

```bash
git clone https://github.com/UrbanCS/CHGA.git
cd CHGA
git checkout main
git pull --ff-only
npm install
```

2. Ouvrir le dossier racine dans Codex.
3. Coller ce message au nouveau chat:

```text
Nous continuons le projet CHGA Mobile. Lis AGENTS.md puis
HANDOFF_NOUVEAU_CODEX.md en entier avant toute analyse ou modification. Ensuite,
verifie l'etat Git et resume-moi l'architecture, l'hebergement Netlify, le cron de cinq
minutes et la chaine OneSignal. Ne lis et n'affiche aucun secret.
```

4. Pour administrer la production, se connecter separement aux comptes Netlify,
   OneSignal et GitHub autorises. Les secrets ne sont pas dans Git et ne doivent pas etre
   transferes par chat.
5. Avant de quitter l'ancien ordinateur, committer et pousser ce transfert afin qu'il
   existe dans le clone du nouvel ordinateur.

## 19. Priorites de maintenance restantes

1. Faire tourner `CHGA_PUSH_WEBHOOK_SECRET` dans Netlify, car une ancienne valeur a ete
   exposee dans l'historique de travail.
2. Confirmer apres rotation que le controle manuel retourne 200 avec le nouveau secret
   et 401 avec une valeur invalide.
3. Confirmer periodiquement les logs du cron et un push reel sur Android et iPhone.
4. Surveiller les changements HTML de CHGA, surtout les images principales et les blocs
   `podcast__preview`.
5. Si le client choisit Webaction/cPanel, planifier une vraie migration du backend et du
   cron plutot qu'un simple transfert du dossier `dist`.
