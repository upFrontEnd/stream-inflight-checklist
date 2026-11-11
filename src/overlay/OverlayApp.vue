<script setup>
import { ref, computed } from 'vue';
import ChecklistImage from '../components/overlay/ChecklistImage.vue';
import DebugPanel from '../components/overlay/DebugPanel.vue';
import { useChecklist } from '../composables/useChecklist.js';

const { src, image, flight, error } = useChecklist();
const imageError = ref('');

// Hors OBS (navigateur, bun run dev) ou avec ?debug : bandeau de diagnostic.
const debug = new URLSearchParams(location.search).has('debug') || !window.obsstudio;

const debugLines = computed(() => {
  const lines = [];
  if (flight.value) lines.push(`${flight.value.callsign} · ${flight.value.aircraft}`, flight.value.reason);
  lines.push(image.value ?? '(rien à afficher)');
  if (error.value) lines.push(error.value);
  if (imageError.value) lines.push(imageError.value);
  return lines;
});

function onImageError(url) {
  imageError.value = `Image introuvable : ${url}`;
}
</script>

<template>
  <ChecklistImage :src="src" @error="onImageError" />
  <DebugPanel v-if="debug" :lines="debugLines" />
</template>
