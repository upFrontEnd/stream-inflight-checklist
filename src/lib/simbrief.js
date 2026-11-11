const SIMBRIEF_API = 'https://www.simbrief.com/api/xml.fetcher.php';

// Dernier plan de vol SimBrief du pilote (username ou userid numérique).
export async function fetchPlan(pilot) {
  const param = /^\d+$/.test(pilot) ? 'userid' : 'username';
  const res = await fetch(`${SIMBRIEF_API}?${param}=${encodeURIComponent(pilot)}&json=1`, { cache: 'no-store' });
  const data = await res.json();
  if (data?.fetch?.status !== 'Success') throw new Error(`SimBrief : ${data?.fetch?.status || `HTTP ${res.status}`}`);
  return data;
}
