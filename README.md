# stream-checklist

Affiche automatiquement dans OBS la checklist qui correspond au vol du jour :
compagnie (début du callsign SimBrief, ex. `RYR` pour `RYR4KJ`) + type d'avion
(`B738`, `A20N`…).

Le bouton qui affiche/masque la source **Checklist** ne change pas : c'est le
contenu de la source qui s'adapte tout seul.

## Stack

- [Bun](https://bun.sh) : gestionnaire de paquets et runner
- [Vite](https://vitejs.dev) : bundler, avec `vite-plugin-singlefile` (un seul fichier HTML)
- [Vue 3](https://vuejs.org) : Composition API, `<script setup>`, JavaScript sans TypeScript
- Sass / SCSS

## Fonctionnement

```
SimBrief (plan du jour)
   │  general.icao_airline = RYR, aircraft.icaocode = B738
   ▼
checklist-auto.html  (source navigateur "Checklist" dans OBS)
   │  B738 → dossier "BOEING 737Ng", RYR → fichier "... - RYANAIR.png"
   ▼
D:/Dropbox/SIMULATION/Checklist et Phraséologie/BOEING 737Ng/checklist 737-800 - RYANAIR.png
```

- La liste des checklists est scannée dans le Dropbox **au build** (module
  virtuel `virtual:checklists`) et intégrée à la page.
- `bun run build` produit un seul fichier HTML (JS et CSS inclus), copié à la
  racine du dossier Dropbox : OBS le charge en fichier local et lit les images
  en chemins relatifs.
- Le plan SimBrief est relu toutes les 60 s et à chaque fois que la source est
  affichée. La checklist est donc déjà prête quand tu appuies sur le bouton.
- Pas de checklist pour la compagnie : checklist générique du dossier (ex.
  `BOEING 737 MAX copie.png`), sinon la première du dossier.
- Type d'avion sans dossier (ex. A330) : rien ne s'affiche.
- SimBrief injoignable : la dernière checklist reste affichée.

## Installation (une fois)

```bash
bun install
bun run build        # génère checklist-auto.html dans le dossier Dropbox
# fermer OBS
bun run obs:install  # transforme la source "Checklist" en source navigateur
```

`obs:install` garde la même source (nom, position, transitions slide, bouton) et
sauvegarde l'ancienne config à côté (`Sans_nom.json.avant-checklist-auto`).
Pour revenir en arrière : OBS fermé, renommer ce fichier en `Sans_nom.json`.

Installation manuelle possible à la place : supprimer la source image
"Checklist", ajouter une **Source navigateur** nommée `Checklist`, cocher
**Fichier local** → `checklist-auto.html`, largeur 662, hauteur 948, décocher
"Arrêter la source quand elle n'est pas visible", placer en x 1238 / y 115 à
100 %.

## Développement

```bash
bun run dev
```

Ouvre `http://localhost:5190` avec un bandeau de diagnostic (callsign, type,
fichier choisi, erreurs). Les images sont servies directement depuis le
Dropbox sous `/checklists/`, et la page se recharge quand une checklist est
ajoutée ou supprimée.

Paramètres d'URL (dev ou page buildée ouverte dans un navigateur) :

| Paramètre            | Effet                                               |
| -------------------- | --------------------------------------------------- |
| `?test=RYR4KJ,B738`  | Simule un vol sans toucher au plan SimBrief         |
| `?simbrief=pseudo`   | Autre compte SimBrief que celui de `config.js`      |
| `?debug`             | Force le bandeau de diagnostic (il est masqué dans OBS) |

Une modification du code ne change OBS qu'après `bun run build`.

## Ajouter une checklist

1. Déposer l'image dans le bon dossier, avec le nom de la compagnie dans le nom
   du fichier : `Airbus A-320 - VUELING.png`.
2. Si la compagnie n'est pas encore connue, soit ajouter son code dans
   `airlines` de [config.js](config.js) (`VLG: ['VUELING']`), soit mettre le
   code dans le nom du fichier : `Airbus A-320 - VUELING (VLG).png`.
3. `bun run build` (OBS peut rester ouvert ; la source se met à jour à son
   prochain rechargement, ou clic droit → Actualiser).

Nouveau dossier (nouvelle famille d'avion) : l'ajouter dans `folders` de
[config.js](config.js) avec ses types ICAO SimBrief.

## Tester en ligne de commande

```bash
bun run check               # plan SimBrief actuel
bun run check RYR4KJ B738   # callsign + type au choix
```

## Structure

```
config.js                     Réglages : dossier, compte SimBrief, types par dossier, compagnies
index.html                    Point d'entrée Vite
vite.config.js                Config Vite (base relative, single file, plugin checklists)
vite/
└── checklists-plugin.js      Module virtuel, images en dev, copie du build dans le Dropbox
src/
├── main.js                   Entrée Vue
├── App.vue                   Assemble l'image et le bandeau de diagnostic
├── components/
│   ├── ChecklistImage.vue    Image préchargée, fondu, cadre
│   └── DebugPanel.vue        Bandeau de diagnostic
├── composables/
│   ├── useSimbrief.js        Lecture du plan SimBrief (intervalle + visibilité OBS)
│   └── useChecklist.js       Choix de la checklist, cache de la dernière affichée
├── lib/
│   └── select.js             Règles de choix (partagées avec bun run check)
└── scss/
    └── style.scss            Styles globaux (fond transparent)
scripts/
├── manifest.js               Scanne les checklists et associe chaque image à ses compagnies
├── check.js                  Test en ligne de commande
└── install-obs.js            Conversion de la source OBS
```
