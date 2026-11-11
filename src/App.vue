<script setup>
import { ref, computed } from 'vue';
import ChecklistImage from './components/ChecklistImage.vue';
import DebugPanel from './components/DebugPanel.vue';
import { useChecklist } from './composables/useChecklist.js';

const { src, path, flight, error, border } = useChecklist();
const imageError = ref('');

// Hors OBS (navigateur, bun run dev) ou avec ?debug : bandeau de diagnostic.
const debug = new URLSearchParams(location.search).has('debug') || !window.obsstudio;

const debugLines = computed(() => {
  const lines = [];
  if (flight.value) lines.push(`${flight.value.callsign} · ${flight.value.aircraft}`, flight.value.reason);
  lines.push(path.value ?? '(rien à afficher)');
  if (error.value) lines.push(error.value);
  if (imageError.value) lines.push(imageError.value);
  return lines;
});

function onImageError(url) {
  imageError.value = `Image introuvable : ${decodeURIComponent(url)} (relancer bun run build ?)`;
}
</script>

<template>
  <ChecklistImage :src="src" :border="border" @error="onImageError" />
  <DebugPanel v-if="debug" :lines="debugLines" />
</template>
