import { ref, computed, watch } from 'vue';
import { manifest, settings } from 'virtual:checklists';
import { useSimbrief } from './useSimbrief.js';
import { pickChecklist, airlineFromPlan, aircraftFromPlan, callsignFromPlan } from '../lib/select.js';

const CACHE_KEY = 'checklist-auto:last';
// En dev, Vite sert le dossier Dropbox sous /checklists/. Au build, la page est
// posée à la racine de ce dossier : chemins relatifs.
const IMAGE_BASE = import.meta.env.DEV ? '/checklists/' : '';

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function writeCache(path) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(path));
  } catch {}
}

function toUrl(path) {
  return path ? IMAGE_BASE + path.split('/').map(encodeURIComponent).join('/') : null;
}

// ?test=RYR4KJ,B738 : simule un vol sans toucher au plan SimBrief.
function testPlan(value) {
  const [callsign = '', aircraft = ''] = value.split(',');
  return { atc: { callsign }, aircraft: { icaocode: aircraft } };
}

export function useChecklist() {
  const params = new URLSearchParams(location.search);
  const pilot = params.get('simbrief') || settings.simbrief;
  const { plan, error } = params.has('test')
    ? { plan: ref(testPlan(params.get('test'))), error: ref('') }
    : useSimbrief(pilot, settings.refreshSeconds);

  // Affiche tout de suite la dernière checklist connue, en attendant SimBrief.
  const path = ref(readCache());
  const flight = ref(null);

  watch(plan, (data) => {
    if (!data) return;
    const callsign = callsignFromPlan(data);
    const airline = airlineFromPlan(data);
    const aircraft = aircraftFromPlan(data);
    const pick = pickChecklist(manifest, aircraft, airline);
    flight.value = { callsign, aircraft, reason: pick.reason };
    path.value = pick.path;
    if (!params.has('test')) writeCache(pick.path);
  }, { immediate: true });

  const src = computed(() => toUrl(path.value));

  return { src, path, flight, error, border: settings.border };
}
