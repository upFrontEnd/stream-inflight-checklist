import { ref, onMounted, onUnmounted } from 'vue';

const SIMBRIEF_API = 'https://www.simbrief.com/api/xml.fetcher.php';

// Relit le plan SimBrief à intervalle régulier et à chaque affichage de la source OBS.
export function useSimbrief(pilot, refreshSeconds) {
  const plan = ref(null);
  const error = ref('');

  async function refresh() {
    const param = /^\d+$/.test(pilot) ? 'userid' : 'username';
    try {
      const res = await fetch(`${SIMBRIEF_API}?${param}=${encodeURIComponent(pilot)}&json=1`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.fetch?.status !== 'Success') throw new Error(data?.fetch?.status || `HTTP ${res.status}`);
      plan.value = data;
      error.value = '';
    } catch (err) {
      // On garde le dernier plan connu.
      error.value = `SimBrief : ${err.message}`;
    }
  }

  const onObsVisibility = (e) => {
    if (e.detail?.visible) refresh();
  };
  let timer;

  onMounted(() => {
    refresh();
    timer = setInterval(refresh, refreshSeconds * 1000);
    window.addEventListener('obsSourceVisibleChanged', onObsVisibility);
  });

  onUnmounted(() => {
    clearInterval(timer);
    window.removeEventListener('obsSourceVisibleChanged', onObsVisibility);
  });

  return { plan, error, refresh };
}
