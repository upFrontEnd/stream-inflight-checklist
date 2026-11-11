// Transforme la source image "Checklist" d'OBS en source navigateur qui charge le site.
// Garde la même source (même nom, même uuid) : position, transitions slide et
// bouton Stream Deck / raccourci restent inchangés.
// OBS doit être fermé (il réécrit sa config en quittant).
//   bun run obs:install              → source "Checklist", URL GitHub Pages
//   bun run obs:install "Autre nom"  → autre nom de source
import { readFileSync, writeFileSync, copyFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { GITHUB_REPO } from '../src/settings.js';

const SOURCE_NAME = process.argv[2] || 'Checklist';
const [owner, repo] = GITHUB_REPO.split('/');
const OVERLAY_URL = process.env.OVERLAY_URL || `https://${owner.toLowerCase()}.github.io/${repo}/`;
// Taille de l'ancienne image à l'écran (3494 × 5007 réduite à ~19 %, cadre compris).
const SIZE = { width: 662, height: 948 };

// OBS_SCENES_DIR : pour tester sur une copie de la config.
const scenesDir = process.env.OBS_SCENES_DIR || join(process.env.APPDATA, 'obs-studio/basic/scenes');

if (!process.env.OBS_SCENES_DIR && execSync('tasklist /FI "IMAGENAME eq obs64.exe" /NH').toString().includes('obs64.exe')) {
  console.error('✖ OBS est ouvert. Ferme-le puis relance : bun run obs:install');
  process.exit(1);
}

let changed = 0;
for (const file of readdirSync(scenesDir).filter((f) => f.endsWith('.json'))) {
  const path = join(scenesDir, file);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const source = data.sources?.find((s) => s.name === SOURCE_NAME);
  if (!source) continue;
  if (source.id === 'browser_source' && !source.settings?.is_local_file && source.settings?.url === OVERLAY_URL) {
    console.log(`= ${file} : déjà installé`);
    continue;
  }

  // Une seule sauvegarde : celle d'avant la toute première installation.
  const backup = `${path}.avant-checklist-auto`;
  if (!existsSync(backup)) copyFileSync(path, backup);

  const wasImage = source.id === 'image_source';
  source.id = 'browser_source';
  source.versioned_id = 'browser_source';
  source.settings = {
    is_local_file: false,
    url: OVERLAY_URL,
    width: SIZE.width,
    height: SIZE.height,
    css: '',
    shutdown: false, // reste chargée quand masquée : la checklist est prête dès l'affichage
    restart_when_active: false,
    reroute_audio: false,
  };
  // Le cadre est maintenant dessiné par la page.
  source.filters = (source.filters ?? []).filter(
    (f) => !(f.id === 'shader_filter' && String(f.settings?.shader_file_name).endsWith('border.shader')),
  );

  // L'ancienne image était réduite (~19 %) ; la page a déjà la taille finale.
  if (wasImage) {
    for (const scene of data.sources.filter((s) => s.id === 'scene')) {
      for (const item of scene.settings?.items ?? []) {
        if (item.source_uuid !== source.uuid) continue;
        item.scale = { x: 1, y: 1 };
        if (item.scale_rel) item.scale_rel = { x: 1, y: 1 };
        console.log(`  scène "${scene.name}" : position conservée, échelle 100 %`);
      }
    }
  }

  writeFileSync(path, JSON.stringify(data, null, 4));
  console.log(`✔ ${file} : source "${SOURCE_NAME}" → ${OVERLAY_URL}`);
  console.log(`  sauvegarde : ${backup}`);
  changed++;
}

if (!changed) console.log(`Aucune modification (source "${SOURCE_NAME}" introuvable ou déjà installée).`);
