<script setup>
import { ref, computed } from 'vue';
import { familyFallback } from '../../lib/select.js';
import { useAdminStore } from '../../composables/useAdminStore.js';
import { useAdminNav, familyKey, familyTone } from '../../composables/useAdminNav.js';
import { GITHUB_REPO } from '../../settings.js';
import AdminIcon from './AdminIcon.vue';
import TestPanel from './TestPanel.vue';

const emit = defineEmits(['open']);

const { data } = useAdminStore();
const { go } = useAdminNav();

const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  .format(new Date())
  .replace(/^./, (c) => c.toUpperCase());

const checklists = computed(() => data.value.checklists);
const families = computed(() => data.value.families);
const airlines = computed(() => new Set(checklists.value.flatMap((c) => c.airlines)));
const types = computed(() => families.value.flatMap((f) => f.types));
const emptyFamilies = computed(() => families.value.filter((f) => !checklists.value.some((c) => c.family === f.id)));

// Phrase de résumé sous la date, comme un point de situation rapide.
const summary = computed(() => {
  let text = `${checklists.value.length} checklists pour ${airlines.value.size} compagnies, réparties dans ${families.value.length} familles d'avion.`;
  const empty = emptyFamilies.value;
  if (empty.length) {
    text += ` ${empty.map((f) => f.name).join(', ')} n'${empty.length > 1 ? 'ont' : 'a'} encore aucune checklist.`;
  }
  return text;
});

const publicUrl = computed(() => {
  const [owner, repo] = GITHUB_REPO.split('/');
  return `https://${owner.toLowerCase()}.github.io/${repo}/`;
});

const stats = computed(() => [
  { key: 'checklists', label: 'Checklists', value: checklists.value.length, hint: `${checklists.value.filter((c) => !c.airlines.length).length} génériques` },
  { key: 'families', label: 'Familles d\'avion', value: families.value.length, hint: `${types.value.length} types SimBrief reconnus` },
  { key: 'airlines', label: 'Compagnies', value: airlines.value.size, hint: 'codes ICAO couverts' },
]);

// Une ligne par famille : nombre de checklists et checklist de repli.
const familyRows = computed(() => families.value.map((f, i) => ({
  ...f,
  tone: familyTone(i),
  count: checklists.value.filter((c) => c.family === f.id).length,
  fallback: familyFallback(data.value, f.id)?.label ?? null,
})));

const copied = ref(false);
async function copyUrl() {
  await navigator.clipboard?.writeText(publicUrl.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
  <div class="overview">
    <header class="overview__hero">
      <p class="overview__date">{{ today }}</p>
      <p class="overview__summary">{{ summary }}</p>
    </header>

    <div class="stats">
      <div v-for="s in stats" :key="s.key" class="card stat">
        <span class="stat__label">{{ s.label }}</span>
        <span class="stat__value">{{ s.value }}</span>
        <span class="stat__foot"><span class="stat__hint">{{ s.hint }}</span></span>
      </div>
    </div>

    <div class="overview__grid">
      <section class="card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Familles d'avion</h2>
            <p class="card__subtitle">Checklist de repli quand la compagnie du vol n'a pas la sienne</p>
          </div>
          <button class="btn" type="button" @click="emit('open', 'family')">
            <AdminIcon name="plus" :size="18" />
            Famille
          </button>
        </div>
        <ul class="shortcuts">
          <li v-for="f in familyRows" :key="f.id">
            <button type="button" class="shortcut" @click="go(familyKey(f.id))">
              <span class="shortcut__icon" :class="`tone-${f.tone}`"><AdminIcon name="plane" /></span>
              <span class="shortcut__text">
                <span class="shortcut__title">{{ f.name }}</span>
                <span class="shortcut__desc">{{ f.types.join(' · ') }}</span>
              </span>
              <span class="shortcut__meta">
                <span class="badge" :class="f.count ? 'badge--neutral' : 'badge--danger'">
                  {{ f.count ? `${f.count} checklist${f.count > 1 ? 's' : ''}` : 'Vide' }}
                </span>
                <span v-if="f.fallback" class="shortcut__desc">Défaut : {{ f.fallback }}</span>
              </span>
              <AdminIcon name="arrow" :size="18" class="shortcut__arrow" />
            </button>
          </li>
        </ul>
      </section>

      <div class="overview__aside">
        <section class="card">
          <div class="card__header">
            <div>
              <h2 class="card__title">Tester un vol</h2>
              <p class="card__subtitle">La checklist qu'OBS affichera</p>
            </div>
          </div>
          <TestPanel compact />
        </section>

        <section class="card">
          <div class="card__header">
            <div>
              <h2 class="card__title">Source OBS</h2>
              <p class="card__subtitle">URL de la source navigateur</p>
            </div>
          </div>
          <div class="input-group">
            <input class="input input--code" :value="publicUrl" readonly aria-label="URL de la source OBS" @focus="$event.target.select()">
            <button type="button" class="input-group__btn" title="Copier" aria-label="Copier l'URL" @click="copyUrl">
              <AdminIcon :name="copied ? 'check' : 'copy'" :size="18" />
            </button>
          </div>
          <div class="card__actions">
            <button class="btn btn--primary btn--block" type="button" @click="emit('open', 'checklist')">
              <AdminIcon name="plus" :size="18" />
              Ajouter une checklist
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
