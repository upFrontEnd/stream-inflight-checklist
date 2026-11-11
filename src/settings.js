// Réglages partagés par l'overlay OBS et l'admin.

// Compte SimBrief (username ou userid numérique). Surchargeable avec ?simbrief=...
export const SIMBRIEF_PILOT = 'SkyflyerAviation';

// Relecture du plan SimBrief et de la liste des checklists, en secondes.
export const REFRESH_SECONDS = 60;

// Dépôt GitHub qui stocke les checklists (public/checklists.json + public/checklists/*.webp).
export const GITHUB_REPO = import.meta.env?.VITE_GITHUB_REPO || 'upFrontEnd/stream-inflight-checklist';
export const GITHUB_BRANCH = 'main';

// Fichiers dans le dépôt (le dossier public/ est servi à la racine du site).
export const DATA_FILE = 'public/checklists.json';
export const IMAGES_DIR = 'checklists';

// Compression des images à l'envoi : largeur max (≈ 2× la largeur affichée dans OBS).
export const IMAGE_MAX_WIDTH = 1400;
export const IMAGE_QUALITY = 0.88;
