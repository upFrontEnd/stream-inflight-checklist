// Import des checklists Dropbox dans le site (à lancer une fois, ou pour tout réimporter).
//   bun run import
// Compresse chaque image en WebP dans public/checklists/ et écrit public/checklists.json.
// ⚠ Remplace entièrement la liste : les modifications faites dans l'admin sont perdues.
import { readdirSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import sharp from 'sharp';
import { AIRLINES } from '../src/lib/airlines.js';
import { IMAGE_MAX_WIDTH, IMAGE_QUALITY, IMAGES_DIR } from '../src/settings.js';
import { slugify } from '../src/lib/slug.js';

const DROPBOX_DIR = 'D:/Dropbox/SIMULATION/Checklist et Phraséologie';

// Dossier Dropbox → famille d'avion (types ICAO SimBrief : aircraft.icaocode).
const FAMILIES = {
  'AIRBUS A-320': { id: 'a320', name: 'Airbus A320', types: ['A318', 'A319', 'A320', 'A321', 'A19N', 'A20N', 'A21N'] },
  'BOEING 737Ng': { id: 'b737ng', name: 'Boeing 737 NG', types: ['B736', 'B737', 'B738', 'B739'] },
  'BOEING 737MAX': { id: 'b737max', name: 'Boeing 737 MAX', types: ['B37M', 'B38M', 'B39M', 'B3XM'] },
  'EMBRAER E-JET': { id: 'ejet', name: 'Embraer E-Jet', types: ['E170', 'E75S', 'E75L', 'E190', 'E195', 'E290', 'E295'] },
  'AIRBUS A-310': { id: 'a300-a310', name: 'Airbus A300 / A310', types: ['A306', 'A30B', 'A310'] },
  'AIRBUS A-340': { id: 'a340', name: 'Airbus A340', types: ['A342', 'A343', 'A345', 'A346'] },
};

const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;
const root = join(import.meta.dir, '..');
const publicDir = join(root, 'public');
const imagesDir = join(publicDir, IMAGES_DIR);

// "Checklist A320 - Air Algérie" → " CHECKLIST A320 AIR ALGERIE "
function normalize(text) {
  return ' ' + text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim() + ' ';
}

// Noms affichés quand le fichier n'écrit pas le nom officiel (modifiables ensuite dans l'admin).
const LABELS = { 'AIR ASIA': 'AirAsia', THAI: 'Thai Airways', ALASKA: 'Alaska Airlines', UNITED: 'United Airlines' };

// Nom affiché : nom officiel si le fichier l'écrit tel quel, sinon le texte trouvé.
function labelFor(matchedText, airlines) {
  if (LABELS[matchedText]) return LABELS[matchedText];
  const exact = airlines.find((a) => normalize(a.name) === normalize(matchedText));
  if (exact) return exact.name;
  return matchedText; // sigles : DHL, ASL, LATAM...
}

function airlinesForFile(fileName) {
  const label = normalize(fileName.replace(IMAGE_EXT, '').replace(/png$/i, '')); // "ANApng.png"
  const matched = [];
  let matchedText = '';
  for (const airline of AIRLINES) {
    for (const text of [airline.name, ...(airline.aliases ?? [])]) {
      if (!label.includes(normalize(text))) continue;
      matched.push(airline);
      if (text.length > matchedText.length) matchedText = text;
      break;
    }
  }
  return {
    icaos: matched.map((a) => a.icao).sort(),
    label: matched.length ? labelFor(matchedText, matched) : 'Générique',
  };
}

rmSync(imagesDir, { recursive: true, force: true });
mkdirSync(imagesDir, { recursive: true });

const data = { families: [], checklists: [] };

for (const [folder, family] of Object.entries(FAMILIES)) {
  data.families.push(family);
  const dir = join(DROPBOX_DIR, folder);
  if (!existsSync(dir)) {
    console.warn(`⚠ Dossier introuvable : ${folder}`);
    continue;
  }

  const files = readdirSync(dir).filter((f) => IMAGE_EXT.test(f)).sort((a, b) => a.localeCompare(b));
  console.log(`\n${family.name}`);
  for (const file of files) {
    const { icaos, label } = airlinesForFile(file);
    const webp = await sharp(join(dir, file))
      .resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: Math.round(IMAGE_QUALITY * 100) })
      .toBuffer();
    const hash = createHash('sha1').update(webp).digest('hex').slice(0, 8);
    const id = `${family.id}-${slugify(label)}`;
    const image = `${IMAGES_DIR}/${id}-${hash}.webp`;
    writeFileSync(join(publicDir, image), webp);

    data.checklists.push({ id, family: family.id, label, airlines: icaos, image, default: false });
    console.log(`  ${label.padEnd(20)} ${icaos.join(' ').padEnd(26)} ${(webp.length / 1024).toFixed(0)} Ko  ← ${file}`);
  }
}

writeFileSync(join(publicDir, 'checklists.json'), JSON.stringify(data, null, 2) + '\n');
console.log(`\n✔ ${data.checklists.length} checklists importées dans public/`);
