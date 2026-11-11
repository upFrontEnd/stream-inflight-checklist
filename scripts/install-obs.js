// Transforme la source image "Checklist" d'OBS en source navigateur qui charge
// checklist-auto.html. Garde la même source (même nom, même uuid) : position,
// transitions slide et bouton Stream Deck / raccourci restent inchangés.
// OBS doit être fermé (il réécrit sa config en quittant).
import { readFileSync, writeFileSync, copyFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import config from '../config.js';

const SOURCE_NAME = process.argv[2] || 'Checklist';
// OBS_SCENES_DIR : pour tester sur une copie de la config.
const scenesDir = process.env.OBS_SCENES_DIR || join(process.env.APPDATA, 'obs-studio/basic/scenes');
const pagePath = join(config.checklistDir, config.outputFile).replaceAll('\\', '/');

if (!process.env.OBS_SCENES_DIR && execSync('tasklist /FI "IMAGENAME eq obs64.exe" /NH').toString().includes('obs64.exe')) {
  console.error('✖ OBS est ouvert. Ferme-le puis relance : bun run obs:install');
  process.exit(1);
}
if (!existsSync(pagePath)) {
  console.error('✖ Page introuvable, lance d\'abord : bun run build');
  process.exit(1);
}

let changed = 0;
for (const file of readdirSync(scenesDir).filter((f) => f.endsWith('.json'))) {
  const path = join(scenesDir, file);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const source = data.sources?.find((s) => s.name === SOURCE_NAME);
  if (!source) continue;
  if (source.id === 'browser_source' && source.settings?.local_file === pagePath) {
    console.log(`= ${file} : déjà installé`);
    continue;
  }

  copyFileSync(path, `${path}.avant-checklist-auto`);

  source.id = 'browser_source';
  source.versioned_id = 'browser_source';
  source.settings = {
    is_local_file: true,
    local_file: pagePath,
    width: config.size.width,
    height: config.size.height,
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
  for (const scene of data.sources.filter((s) => s.id === 'scene')) {
    for (const item of scene.settings?.items ?? []) {
      if (item.source_uuid !== source.uuid) continue;
      item.scale = { x: 1, y: 1 };
      if (item.scale_rel) item.scale_rel = { x: 1, y: 1 };
      console.log(`  scène "${scene.name}" : position conservée, échelle 100 %`);
    }
  }

  writeFileSync(path, JSON.stringify(data, null, 4));
  console.log(`✔ ${file} : source "${SOURCE_NAME}" convertie (sauvegarde : ${file}.avant-checklist-auto)`);
  changed++;
}

if (!changed) console.log(`Aucune modification (source "${SOURCE_NAME}" introuvable ou déjà installée).`);
