<script setup>
import { ref, computed } from 'vue';
import { pickChecklist, airlineFromPlan } from '../../lib/select.js';
import { rawUrl } from '../../lib/github.js';
import { useAdminStore } from '../../composables/useAdminStore.js';
import AdminIcon from './AdminIcon.vue';

// Vérifie quelle checklist OBS affichera pour un vol donné (avec la liste actuelle).
// compact : version encadrée dans une carte de l'accueil.
defineProps({
  compact: { type: Boolean, default: false },
});

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
  <div class="test" :class="{ 'test--page': !compact }">
    <component :is="compact ? 'div' : 'section'" :class="{ card: !compact }">
      <div class="field-row">
        <div class="field">
          <label class="field__label" :for="`test-callsign-${compact}`">Callsign</label>
          <input
            :id="`test-callsign-${compact}`"
            v-model.trim="callsign"
            class="input input--code"
            placeholder="RYR4KJ"
            @input="callsign = callsign.toUpperCase()"
          >
        </div>
        <div class="field">
          <label class="field__label" :for="`test-aircraft-${compact}`">Type d'avion</label>
          <input
            :id="`test-aircraft-${compact}`"
            v-model.trim="aircraft"
            class="input input--code"
            placeholder="B738"
            @input="aircraft = aircraft.toUpperCase()"
          >
        </div>
      </div>

      <div v-if="result" class="test__result" :class="{ 'test__result--empty': !result.checklist }">
        <img v-if="result.checklist" class="test__thumb" :src="rawUrl(result.checklist.image)" alt="">
        <span v-else class="test__thumb test__thumb--empty"><AdminIcon name="alert" :size="22" /></span>
        <div>
          <p class="test__label">{{ result.checklist?.label ?? 'Rien ne s\'affiche' }}</p>
          <p class="test__reason">{{ result.reason }}</p>
        </div>
      </div>
      <p v-else class="hint">Saisis un callsign et un type d'avion pour voir le résultat.</p>
    </component>

    <img v-if="!compact && result?.checklist" class="test__preview" :src="rawUrl(result.checklist.image)" alt="">
  </div>
</template>
