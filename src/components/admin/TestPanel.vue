<script setup>
import { ref, computed } from 'vue';
import { pickChecklist, airlineFromPlan } from '../../lib/select.js';
import { rawUrl } from '../../lib/github.js';
import { useAdminStore } from '../../composables/useAdminStore.js';

// Vérifie quelle checklist OBS affichera pour un vol donné (avec la liste actuelle).
const store = useAdminStore();
const callsign = ref('');
const aircraft = ref('');

const result = computed(() => {
  if (!callsign.value || !aircraft.value || !store.data.value) return null;
  const airline = airlineFromPlan({ atc: { callsign: callsign.value } });
  return pickChecklist(store.data.value, aircraft.value, airline);
});
</script>

<template>
  <section class="panel test">
    <h2 class="panel__title">Trouver une checklist</h2>
    <div class="test__row">
      <input v-model.trim="callsign" class="field__control" placeholder="Callsign (RYR4KJ)" @input="callsign = callsign.toUpperCase()">
      <input v-model.trim="aircraft" class="field__control" placeholder="Type (B738)" @input="aircraft = aircraft.toUpperCase()">
    </div>
    <div v-if="result" class="test__result">
      <img v-if="result.checklist" class="test__thumb" :src="rawUrl(result.checklist.image)" alt="">
      <div>
        <div class="test__label">{{ result.checklist?.label ?? 'Rien ne s\'affiche' }}</div>
        <div class="status">{{ result.reason }}</div>
      </div>
    </div>
  </section>
</template>
