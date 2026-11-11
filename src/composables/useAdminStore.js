import { ref, computed } from 'vue';
import { readData, commitData, getToken, setToken, verifyToken } from '../lib/github.js';
import { compressImage, blobToBase64, shortHash } from '../lib/image.js';
import { slugify } from '../lib/slug.js';
import { IMAGES_DIR } from '../settings.js';

// État partagé de l'admin (singleton : tous les composants voient la même liste).
const data = ref(null);
const token = ref(getToken());
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const notice = ref('');

const connected = computed(() => Boolean(token.value));

function familyName(d, id) {
  return d.families.find((f) => f.id === id)?.name ?? id;
}

function uniqueId(base, taken) {
  let id = base;
  for (let i = 2; taken.includes(id); i++) id = `${base}-${i}`;
  return id;
}

function cleanCodes(codes) {
  return [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))].sort();
}

// Un code compagnie ne peut viser qu'une checklist par famille, sinon le choix serait ambigu.
function assertAirlinesFree(d, family, airlines, ignoreId) {
  for (const code of airlines) {
    const other = d.checklists.find((c) => c.id !== ignoreId && c.family === family && c.airlines.includes(code));
    if (other) throw new Error(`${code} est déjà utilisé par « ${other.label} » (${familyName(d, family)}).`);
  }
}

// Un type d'avion ne peut appartenir qu'à une famille.
function assertTypesFree(d, types, ignoreId) {
  for (const type of types) {
    const other = d.families.find((f) => f.id !== ignoreId && f.types.includes(type));
    if (other) throw new Error(`${type} appartient déjà à la famille « ${other.name} ».`);
  }
}

async function prepareImage(file, id) {
  const { blob } = await compressImage(file);
  const path = `${IMAGES_DIR}/${id}-${await shortHash(blob)}.webp`;
  // path : chemin vu par le site (checklists.json) ; repoPath : chemin dans le dépôt.
  return { path, repoPath: `public/${path}`, base64: await blobToBase64(blob) };
}

async function run(task, successMessage) {
  saving.value = true;
  error.value = '';
  notice.value = '';
  try {
    data.value = await task();
    notice.value = `${successMessage} Visible dans OBS dans ~1 min (redéploiement du site).`;
    return true;
  } catch (err) {
    error.value = err.message;
    return false;
  } finally {
    saving.value = false;
  }
}

async function load() {
  if (!connected.value) return;
  loading.value = true;
  error.value = '';
  try {
    data.value = await readData();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function connect(newToken) {
  error.value = '';
  try {
    await verifyToken(newToken.trim());
  } catch (err) {
    error.value = err.message;
    return false;
  }
  setToken(newToken.trim());
  token.value = newToken.trim();
  await load();
  return true;
}

function clearMessages() {
  error.value = '';
  notice.value = '';
}

function disconnect() {
  setToken('');
  token.value = '';
  data.value = null;
}

// Une seule checklist "par défaut" par famille.
function applyDefault(d, checklist) {
  if (!checklist.default) return;
  for (const c of d.checklists) if (c.family === checklist.family && c !== checklist) c.default = false;
}

// form : { family, label, airlines[], isDefault, file }
function addChecklist(form) {
  return run(() => commitData(async (d) => {
    const airlines = cleanCodes(form.airlines);
    assertAirlinesFree(d, form.family, airlines);
    const id = uniqueId(`${form.family}-${slugify(form.label)}`, d.checklists.map((c) => c.id));
    const image = await prepareImage(form.file, id);
    const checklist = { id, family: form.family, label: form.label.trim(), airlines, image: image.path, default: form.isDefault };
    d.checklists.push(checklist);
    applyDefault(d, checklist);
    return { add: [{ path: image.repoPath, base64: image.base64 }] };
  }, `Checklists : ajout ${form.label}`), `« ${form.label} » ajoutée.`);
}

// form.file facultatif : sans fichier, l'image actuelle est gardée.
function updateChecklist(id, form) {
  return run(() => commitData(async (d) => {
    const checklist = d.checklists.find((c) => c.id === id);
    if (!checklist) throw new Error('Checklist introuvable : recharge la page.');
    const airlines = cleanCodes(form.airlines);
    assertAirlinesFree(d, form.family, airlines, id);

    const changes = { add: [], remove: [] };
    if (form.file) {
      const image = await prepareImage(form.file, id);
      if (image.path !== checklist.image) {
        changes.add.push({ path: image.repoPath, base64: image.base64 });
        changes.remove.push(`public/${checklist.image}`);
        checklist.image = image.path;
      }
    }
    Object.assign(checklist, { family: form.family, label: form.label.trim(), airlines, default: form.isDefault });
    applyDefault(d, checklist);
    return changes;
  }, `Checklists : modification ${form.label}`), `« ${form.label} » enregistrée.`);
}

function removeChecklist(id) {
  const label = data.value?.checklists.find((c) => c.id === id)?.label ?? id;
  return run(() => commitData((d) => {
    const index = d.checklists.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Checklist introuvable : recharge la page.');
    const [removed] = d.checklists.splice(index, 1);
    return { remove: [`public/${removed.image}`] };
  }, `Checklists : suppression ${label}`), `« ${label} » supprimée.`);
}

function setDefault(id) {
  const label = data.value?.checklists.find((c) => c.id === id)?.label ?? id;
  return run(() => commitData((d) => {
    const checklist = d.checklists.find((c) => c.id === id);
    if (!checklist) throw new Error('Checklist introuvable : recharge la page.');
    checklist.default = true;
    applyDefault(d, checklist);
  }, `Checklists : ${label} par défaut`), `« ${label} » est la checklist par défaut.`);
}

// form : { name, types[] }
function addFamily(form) {
  return run(() => commitData((d) => {
    const types = cleanCodes(form.types);
    assertTypesFree(d, types);
    const id = uniqueId(slugify(form.name), d.families.map((f) => f.id));
    d.families.push({ id, name: form.name.trim(), types });
  }, `Checklists : famille ${form.name}`), `Famille « ${form.name} » ajoutée.`);
}

function updateFamily(id, form) {
  return run(() => commitData((d) => {
    const family = d.families.find((f) => f.id === id);
    if (!family) throw new Error('Famille introuvable : recharge la page.');
    const types = cleanCodes(form.types);
    assertTypesFree(d, types, id);
    Object.assign(family, { name: form.name.trim(), types });
  }, `Checklists : famille ${form.name}`), `Famille « ${form.name} » enregistrée.`);
}

function removeFamily(id) {
  const name = data.value?.families.find((f) => f.id === id)?.name ?? id;
  return run(() => commitData((d) => {
    if (d.checklists.some((c) => c.family === id)) throw new Error(`Vide d'abord la famille « ${name} ».`);
    d.families = d.families.filter((f) => f.id !== id);
  }, `Checklists : suppression famille ${name}`), `Famille « ${name} » supprimée.`);
}

export function useAdminStore() {
  return {
    data, token, connected, loading, saving, error, notice,
    load, connect, disconnect, clearMessages,
    addChecklist, updateChecklist, removeChecklist, setDefault,
    addFamily, updateFamily, removeFamily,
  };
}
