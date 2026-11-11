# stream-inflight-checklist

Affiche automatiquement dans OBS la checklist qui correspond au vol du jour :
compagnie (début du callsign SimBrief, ex. `RYR` pour `RYR4KJ`) + type d'avion
(`B738`, `A20N`…). Les checklists sont stockées dans le site et se gèrent depuis
une interface d'administration.

| Page    | URL                                                         | Usage                         |
| ------- | ----------------------------------------------------------- | ----------------------------- |
| Overlay | `https://upfrontend.github.io/stream-inflight-checklist/`   | Source navigateur OBS 662 × 948 |
| Admin   | `https://upfrontend.github.io/stream-inflight-checklist/admin.html` | Ajouter / modifier les checklists |

Le bouton qui affiche/masque la source **Checklist** dans OBS ne change pas :
c'est le contenu de la source qui s'adapte tout seul.

## Stack

- [Bun](https://bun.sh) : gestionnaire de paquets et runner
- [Vite](https://vitejs.dev) : bundler, deux pages (overlay + admin)
- [Vue 3](https://vuejs.org) : Composition API, `<script setup>`, JavaScript sans TypeScript
- Sass / SCSS : tous les styles dans `src/scss/`, aucun dans les composants
- GitHub Pages : hébergement, redéployé à chaque commit sur `main`

## Fonctionnement

```
Admin (admin.html) ──commit via l'API GitHub──▶ dépôt : public/checklists.json + public/checklists/*.webp
                                                    │
                                     GitHub Actions redéploie le site (~1 min)
                                                    ▼
OBS (source navigateur) ── lit ──▶ checklists.json + plan SimBrief ──▶ affiche la bonne image
```

- **Overlay** : relit le plan SimBrief **et** la liste des checklists toutes les
  60 s et à chaque affichage de la source. Une checklist ajoutée dans l'admin
  apparaît donc dans OBS sans recharger la source.
- **Choix** : famille d'avion d'après le type (`aircraft.icaocode`), puis la
  checklist qui porte le code de la compagnie. Sinon la checklist « par défaut »
  de la famille, sinon une générique (sans code), sinon la première. Type sans
  famille (ex. A330) : rien ne s'affiche.
- **SimBrief ou réseau indisponible** : la dernière checklist reste affichée.

## Admin

Accès par **login + mot de passe**. Le site n'ayant pas de serveur, le jeton
GitHub qui permet d'écrire dans le dépôt est publié **chiffré** avec ces
identifiants (`public/admin-auth.json`, PBKDF2 600 000 itérations + AES-GCM) ;
la page le déchiffre à la connexion. Sans le bon couple, le fichier est
illisible : d'où le mot de passe de 12 caractères minimum.

```bash
bun run admin:password   # crée ou change le login / mot de passe
```

- Première fois : le script donne le lien de création du jeton GitHub
  (pré-rempli : Contents en écriture, valable 1 an ; choisir « Only select
  repositories » → ce dépôt), demande le jeton, le vérifie, puis le login et le
  mot de passe (saisie masquée).
- Changer de mot de passe : relancer, répondre « O » pour garder le jeton
  actuel (ancien login / mot de passe demandés).
- Jeton expiré (au bout d'un an) : relancer, répondre « n », coller le nouveau.
- Dans tous les cas : commiter et pousser `public/admin-auth.json`. Le nouveau
  login marche après le déploiement (~1 min).

Connexion valable le temps de l'onglet, ou sur ce navigateur avec « Rester
connecté ». « Se déconnecter » efface le jeton du navigateur.

- **+ Checklist** : glisser l'image, choisir la famille, taper le nom de la
  compagnie : son code ICAO est ajouté tout seul s'il est connu, les codes
  liés sont proposés (ex. Ryanair → RUK, MAY, LDM…). Recherche par nom ou par
  code dans le champ des codes.
- **Image** : compressée dans le navigateur avant l'envoi (WebP, 1400 px de large,
  ~230 Ko au lieu de 3-5 Mo). Garder les originaux dans le Dropbox.
- **Modifier** : nom, codes, famille, image (l'ancienne est supprimée du dépôt).
- **Mettre par défaut** : checklist affichée quand la compagnie du vol n'a pas
  la sienne. Le badge « par défaut » montre celle qui sera utilisée.
- **+ Famille d'avion** / **Modifier la famille** : nom et types ICAO SimBrief.
  Une famille ne se supprime que vide.
- **Tester un vol** : callsign + type, ou « Vol SimBrief actuel », montre la
  checklist qui sortira dans OBS.

Garde-fous : un code compagnie ne peut viser qu'une checklist par famille, un
type d'avion qu'une famille. Chaque action est un seul commit ; si le dépôt a
changé entre-temps, l'admin refuse d'écraser et demande de recharger.

Liste des compagnies proposées : [src/lib/airlines.js](src/lib/airlines.js).
Une compagnie absente peut toujours être saisie par son code.

## Mise en place (une fois)

1. Sur GitHub : **Settings → Pages → Source : GitHub Actions**.
2. Pousser le projet sur `main` : le workflow
   [.github/workflows/deploy.yml](.github/workflows/deploy.yml) publie le site.
3. OBS fermé : `bun run obs:install`. La source image « Checklist » devient une
   source navigateur sur l'URL de l'overlay, en gardant nom, position,
   transitions et bouton. Sauvegarde de l'ancienne config :
   `Sans_nom.json.avant-checklist-auto` (renommer en `Sans_nom.json` pour revenir
   en arrière).

Installation manuelle possible à la place : source navigateur nommée
`Checklist`, URL de l'overlay, 662 × 948, décocher « Arrêter la source quand
elle n'est pas visible », x 1238 / y 115 à 100 %, et retirer le filtre shader de
bordure (le cadre est dessiné par la page).

## Commandes

```bash
bun install
bun run dev                 # http://localhost:5190 (overlay) et /admin.html
bun run build               # site dans dist/
bun run preview             # sert dist/ en local
bun run check               # checklist choisie pour le plan SimBrief actuel
bun run check RYR4KJ B738   # … ou pour un callsign + type au choix
bun run import              # réimporte tout depuis le Dropbox (écrase l'admin !)
bun run obs:install         # convertit la source OBS (OBS fermé, une seule fois)
bun run admin:password      # login / mot de passe de l'admin
```

En dev, l'overlay lit `public/checklists.json` local ; l'admin lit et écrit
toujours dans le dépôt GitHub. Après des modifications faites dans l'admin,
`git pull` pour les récupérer en local.

Paramètres d'URL de l'overlay :

| Paramètre            | Effet                                                  |
| -------------------- | ------------------------------------------------------ |
| `?test=RYR4KJ,B738`  | Simule un vol sans toucher au plan SimBrief            |
| `?simbrief=pseudo`   | Autre compte SimBrief que celui de `src/settings.js`   |
| `?debug`             | Bandeau de diagnostic (affiché d'office hors OBS)      |

## Structure

```
index.html / admin.html        Points d'entrée Vite (overlay OBS / admin)
vite.config.js                 Deux pages, chemins relatifs pour GitHub Pages
public/
├── admin-auth.json            Jeton GitHub chiffré (bun run admin:password)
├── checklists.json            Familles d'avion + checklists (écrit par l'admin)
└── checklists/*.webp          Images (nom suffixé d'une empreinte : pas de vieux cache)
src/
├── settings.js                Compte SimBrief, dépôt, compression
├── overlay/                   OverlayApp.vue + main.js
├── admin/                     AdminApp.vue + main.js
├── components/
│   ├── overlay/               ChecklistImage, DebugPanel
│   └── admin/                 LoginCard, TestPanel, FamilySection, ChecklistCard,
│                              ChecklistDialog, FamilyDialog, BaseDialog, ImageDrop, CodesInput
├── composables/
│   ├── useChecklist.js        Overlay : relecture SimBrief + liste, choix, cache
│   └── useAdminStore.js       Admin : état partagé et actions (commit GitHub)
├── lib/
│   ├── select.js              Règles de choix (overlay, admin, bun run check)
│   ├── github.js              API GitHub : jeton, lecture, commit unique
│   ├── vault.js               Chiffrement du jeton avec login / mot de passe
│   ├── image.js               Compression WebP dans le navigateur
│   ├── simbrief.js            Lecture du plan SimBrief
│   ├── airlines.js            Compagnies connues (code ICAO → nom)
│   └── slug.js
├── img/logo.png
└── scss/
    ├── overlay.scss / admin.scss   Points d'entrée
    ├── _variables.scss              Cadre de la checklist, fondu
    ├── overlay/                     _base, _checklist, _debug
    └── admin/                       _base, _layout, _forms, _chips, _panels,
                                     _family, _card, _dialog, _dropzone
scripts/
├── import-dropbox.js          Import initial depuis le Dropbox (sharp)
├── admin-password.js          Login / mot de passe de l'admin
├── check.js                   Test en ligne de commande
└── install-obs.js             Conversion de la source OBS
```

## Limites

- Le site est public : toute personne qui a l'URL voit les checklists (pas l'admin).
- Le jeton chiffré est public : sa sécurité repose sur la force du mot de passe.
  Pas de limite de tentatives possible sans serveur.
- Une modification met ~1 min à arriver dans OBS (redéploiement GitHub Pages).
- Les aperçus de l'admin passent par `raw.githubusercontent.com` (le dépôt doit
  être public), pour voir une image tout de suite sans attendre le déploiement.
