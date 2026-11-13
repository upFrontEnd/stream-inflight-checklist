import { ref } from 'vue';

// Page affichée dans l'admin, partagée entre la barre latérale et les
// raccourcis de l'accueil. Elle est reflétée dans l'ancre de l'URL
// (admin.html#famille-a320) : un rechargement rouvre la même page, et les
// boutons Précédent/Suivant du navigateur fonctionnent.
const current = ref(readHash());

function readHash() {
  return decodeURIComponent(window.location.hash.slice(1)) || 'overview';
}

window.addEventListener('hashchange', () => {
  current.value = readHash();
});

// Couleur de l'icône de chaque famille (menu, accueil), attribuée dans
// l'ordre des familles.
const TONES = ['orange', 'blue', 'violet', 'green', 'amber', 'blurple'];
export const familyTone = (index) => TONES[index % TONES.length];

// Clé de la page d'une famille d'avion.
export const familyKey = (id) => `famille-${id}`;

export function useAdminNav() {
  function go(key) {
    if (key === current.value) return;
    window.location.hash = key === 'overview' ? '' : key;
    current.value = key;
  }

  return { current, go };
}
