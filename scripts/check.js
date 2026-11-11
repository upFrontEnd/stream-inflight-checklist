// Teste le choix de checklist sans OBS.
//   bun run check              → plan SimBrief actuel
//   bun run check RYR123 B738  → callsign + type ICAO au choix
import config from '../config.js';
import { buildManifest } from './manifest.js';
import { pickChecklist, airlineFromPlan, aircraftFromPlan, callsignFromPlan } from '../src/lib/select.js';

const { manifest } = buildManifest(config);
let [callsign, aircraft] = process.argv.slice(2);
let airline;

if (!callsign) {
  const param = /^\d+$/.test(config.simbrief) ? 'userid' : 'username';
  const plan = await (await fetch(`https://www.simbrief.com/api/xml.fetcher.php?${param}=${encodeURIComponent(config.simbrief)}&json=1`)).json();
  if (plan?.fetch?.status !== 'Success') throw new Error(`SimBrief : ${plan?.fetch?.status}`);
  callsign = callsignFromPlan(plan);
  aircraft = aircraftFromPlan(plan);
  airline = airlineFromPlan(plan);
} else {
  airline = airlineFromPlan({ atc: { callsign } });
}

const { path, reason } = pickChecklist(manifest, aircraft ?? '', airline);
console.log(`${callsign.toUpperCase()} · ${(aircraft ?? '?').toUpperCase()}`);
console.log(`→ ${path ?? '(rien à afficher)'}`);
console.log(`  ${reason}`);
