import { ref, computed, onMounted, onUnmounted } from 'vue';
import { fetchPlan } from '../lib/simbrief.js';
import { pickChecklist, airlineFromPlan, aircraftFromPlan, callsignFromPlan } from '../lib/select.js';
import { SIMBRIEF_PILOT, REFRESH_SECONDS } from '../settings.js';

const CACHE_KEY = 'checklist-auto:last';
// checklists.json et les images sont servis par le site lui-même (dossier public/).
const DATA_URL = `${import.meta.env.BASE_URL}checklists.json`;

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function writeCache(image) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(image));
  } catch {}
}

async function fetchData() {
  const res = await fetch(DATA_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Liste des checklists : HTTP ${res.status}`);
  return res.json();
}

// ?test=RYR4KJ,B738 : simule un vol sans toucher au plan SimBrief.
function testPlan(value) {
  const [callsign = '', aircraft = ''] = value.split(',');
  return { atc: { callsign }, aircraft: { icaocode: aircraft } };
}

// Relit le plan SimBrief et la liste des checklists toutes les REFRESH_SECONDS
// et à chaque affichage de la source OBS, puis choisit la checklist.
export function useChecklist() {
  const params = new URLSearchParams(location.search);
  const pilot = params.get('simbrief') || SIMBRIEF_PILOT;
  const test = params.get('test');

  // Affiche tout de suite la dernière checklist connue, en attendant le réseau.
  const image = ref(readCache());
  const flight = ref(null);
  const error = ref('');

  async function refresh() {
    try {
      const [plan, data] = await Promise.all([test ? testPlan(test) : fetchPlan(pilot), fetchData()]);
      const aircraft = aircraftFromPlan(plan);
      const { checklist, reason } = pickChecklist(data, aircraft, airlineFromPlan(plan));
      flight.value = { callsign: callsignFromPlan(plan), aircraft, reason, label: checklist?.label };
      image.value = checklist?.image ?? null;
      error.value = '';
      if (!test) writeCache(image.value);
    } catch (err) {
      // Réseau ou SimBrief indisponible : on garde la dernière checklist affichée.
      error.value = err.message;
    }
  }

  const onObsVisibility = (e) => {
    if (e.detail?.visible) refresh();
  };
  let timer;

  onMounted(() => {
    refresh();
    timer = setInterval(refresh, REFRESH_SECONDS * 1000);
    window.addEventListener('obsSourceVisibleChanged', onObsVisibility);
  });

  onUnmounted(() => {
    clearInterval(timer);
    window.removeEventListener('obsSourceVisibleChanged', onObsVisibility);
  });

  const src = computed(() => (image.value ? import.meta.env.BASE_URL + image.value : null));

  return { src, image, flight, error };
}
