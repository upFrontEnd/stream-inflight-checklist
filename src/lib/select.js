// Choix de la checklist à partir du plan SimBrief.
// Utilisé par l'overlay, par l'onglet "Tester" de l'admin et par `bun run check`.
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

// Checklist affichée quand aucune ne correspond à la compagnie :
// celle marquée "par défaut", sinon une générique (sans compagnie), sinon la première.
export function familyFallback(data, familyId) {
  const list = data.checklists.filter((c) => c.family === familyId);
  return list.find((c) => c.default) ?? list.find((c) => !c.airlines.length) ?? list[0] ?? null;
}

// data : contenu de checklists.json → { checklist, reason }
export function pickChecklist(data, aircraft, airline) {
  const type = String(aircraft).toUpperCase();
  const family = data.families.find((f) => f.types.includes(type));
  if (!family) return { checklist: null, reason: `aucune famille d'avion pour le type ${type || '?'}` };

  const exact = data.checklists.find((c) => c.family === family.id && c.airlines.includes(airline));
  if (exact) return { checklist: exact, reason: `checklist ${airline} (${family.name})` };

  const fallback = familyFallback(data, family.id);
  if (fallback) {
    return { checklist: fallback, reason: `pas de checklist ${airline || '?'} → défaut ${family.name}` };
  }
  return { checklist: null, reason: `aucune checklist dans ${family.name}` };
}
