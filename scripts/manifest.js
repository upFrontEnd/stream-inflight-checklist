// Scanne le dossier des checklists et associe chaque image à ses compagnies.
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

// "Checklist A320 - Air Algérie.png" → " CHECKLIST A320 AIR ALGERIE "
function normalize(text) {
  return ' ' + text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim() + ' ';
}

function airlinesForFile(fileName, airlines) {
  const base = fileName.replace(IMAGE_EXT, '').replace(/png$/i, ''); // "ANApng.png"
  const label = normalize(base);
  const found = new Set();

  // Code ICAO explicite dans le nom : "... - VUELING (VLG).png"
  for (const m of base.matchAll(/\(([A-Z]{3})\)/gi)) found.add(m[1].toUpperCase());

  for (const [icao, names] of Object.entries(airlines)) {
    if (names.some((name) => label.includes(normalize(name)))) found.add(icao);
  }
  return [...found].sort();
}

export function buildManifest(config) {
  const warnings = [];
  const manifest = [];

  for (const [folder, settings] of Object.entries(config.folders)) {
    const dir = join(config.checklistDir, folder);
    if (!existsSync(dir)) {
      warnings.push(`Dossier introuvable : ${folder}`);
      continue;
    }

    const files = readdirSync(dir).filter((f) => IMAGE_EXT.test(f)).sort((a, b) => a.localeCompare(b));
    const entries = files.map((file) => ({
      path: `${folder}/${file}`,
      airlines: airlinesForFile(file, config.airlines),
    }));

    let fallback = null;
    if (settings.fallback) {
      fallback = `${folder}/${settings.fallback}`;
      if (!files.includes(settings.fallback)) warnings.push(`Fallback introuvable : ${fallback}`);
    } else {
      // Checklist générique (sans compagnie reconnue), sinon la première.
      fallback = (entries.find((e) => e.airlines.length === 0) ?? entries[0])?.path ?? null;
    }

    manifest.push({ folder, types: settings.types.map((t) => t.toUpperCase()), fallback, entries });
  }

  const known = new Set(Object.keys(config.folders));
  for (const d of readdirSync(config.checklistDir, { withFileTypes: true })) {
    if (d.isDirectory() && !known.has(d.name)) warnings.push(`Dossier non configuré (ignoré) : ${d.name}`);
  }

  return { manifest, warnings };
}
