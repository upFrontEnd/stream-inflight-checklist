// Choix de la checklist à partir du plan SimBrief.
// Utilisé par la page (useChecklist) et par `bun run check`.
// Pas de dépendance navigateur ou Node : doit tourner des deux côtés.

// Code ICAO compagnie : general.icao_airline, sinon les lettres en tête du callsign ATC.
export function airlineFromPlan(plan) {
  const icao = String(plan?.general?.icao_airline ?? '').trim().toUpperCase();
  if (icao) return icao;
  const callsign = String(plan?.atc?.callsign ?? '').trim().toUpperCase();
  return callsign.match(/^[A-Z]{3}/)?.[0] ?? '';
}

export function aircraftFromPlan(plan) {
  return String(plan?.aircraft?.icaocode ?? plan?.aircraft?.icao_code ?? '').trim().toUpperCase();
}

export function callsignFromPlan(plan) {
  const cs = String(plan?.atc?.callsign ?? '').trim().toUpperCase();
  if (cs) return cs;
  return `${plan?.general?.icao_airline ?? ''}${plan?.general?.flight_number ?? ''}`.toUpperCase();
}

// manifest : [{ folder, types, fallback, entries: [{ path, airlines }] }] (généré par le build)
export function pickChecklist(manifest, aircraft, airline) {
  const type = String(aircraft).toUpperCase();
  const folder = manifest.find((f) => f.types.includes(type));
  if (!folder) return { path: null, reason: `aucun dossier de checklist pour le type ${type || '?'}` };

  const exact = folder.entries.find((e) => e.airlines.includes(airline));
  if (exact) return { path: exact.path, reason: `checklist ${airline} (${folder.folder})` };

  if (folder.fallback) {
    return { path: folder.fallback, reason: `pas de checklist ${airline || '?'} → défaut du dossier ${folder.folder}` };
  }
  return { path: null, reason: `dossier ${folder.folder} vide` };
}
