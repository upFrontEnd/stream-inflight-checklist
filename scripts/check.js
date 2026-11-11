// Teste le choix de checklist sans OBS, avec la liste locale (public/checklists.json).
//   bun run check              → plan SimBrief actuel
//   bun run check RYR123 B738  → callsign + type ICAO au choix
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SIMBRIEF_PILOT } from '../src/settings.js';
import { fetchPlan } from '../src/lib/simbrief.js';
import { pickChecklist, airlineFromPlan, aircraftFromPlan, callsignFromPlan } from '../src/lib/select.js';

const data = JSON.parse(readFileSync(join(import.meta.dir, '../public/checklists.json'), 'utf8'));
let [callsign, aircraft] = process.argv.slice(2);
let airline;

if (!callsign) {
  const plan = await fetchPlan(SIMBRIEF_PILOT);
  callsign = callsignFromPlan(plan);
  aircraft = aircraftFromPlan(plan);
  airline = airlineFromPlan(plan);
} else {
  airline = airlineFromPlan({ atc: { callsign } });
}

const { checklist, reason } = pickChecklist(data, aircraft ?? '', airline);
console.log(`${callsign.toUpperCase()} · ${(aircraft ?? '?').toUpperCase()}`);
console.log(`→ ${checklist ? `${checklist.label} (${checklist.image})` : '(rien à afficher)'}`);
console.log(`  ${reason}`);
