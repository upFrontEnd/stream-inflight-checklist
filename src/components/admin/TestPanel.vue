<script setup>
import { ref, computed } from 'vue';
import { pickChecklist, airlineFromPlan, aircraftFromPlan, callsignFromPlan } from '../../lib/select.js';
import { fetchPlan } from '../../lib/simbrief.js';
import { rawUrl } from '../../lib/github.js';
import { SIMBRIEF_PILOT } from '../../settings.js';
import { useAdminStore } from '../../composables/useAdminStore.js';

// Vérifie quelle checklist OBS affichera pour un vol donné (avec la liste actuelle).
const store = useAdminStore();
const callsign = ref('');
const aircraft = ref('');
const loadingPlan = ref(false);
const planError = ref('');

const result = computed(() => {
  if (!callsign.value || !aircraft.value || !store.data.value) return null;
  const airline = airlineFromPlan({ atc: { callsign: callsign.value } });
  return pickChecklist(store.data.value, aircraft.value, airline);
});

async function loadCurrentFlight() {
  loadingPlan.value = true;
  planError.value = '';
  try {
    const plan = await fetchPlan(SIMBRIEF_PILOT);
    callsign.value = callsignFromPlan(plan) || airlineFromPlan(plan);
    aircraft.value = aircraftFromPlan(plan);
  } catch (err) {
    planError.value = err.message;
  } finally {
    loadingPlan.value = false;
  }
}
</script>

<template>
  <section class="panel test">
    <h2 class="panel__title">Tester un vol</h2>
    <div class="test__row">
      <input v-model.trim="callsign" class="field__control" placeholder="Callsign (RYR4KJ)" @input="callsign = callsign.toUpperCase()">
      <input v-model.trim="aircraft" class="field__control" placeholder="Type (B738)" @input="aircraft = aircraft.toUpperCase()">
      <button type="button" class="button button--ghost" :disabled="loadingPlan" @click="loadCurrentFlight">
        {{ loadingPlan ? 'Lecture…' : 'Vol SimBrief actuel' }}
      </button>
    </div>
    <p v-if="planError" class="status status--error">{{ planError }}</p>
    <div v-if="result" class="test__result">
      <img v-if="result.checklist" class="test__thumb" :src="rawUrl(result.checklist.image)" alt="">
      <div>
        <div class="test__label">{{ result.checklist?.label ?? 'Rien ne s\'affiche' }}</div>
        <div class="status">{{ result.reason }}</div>
      </div>
    </div>
  </section>
</template>
