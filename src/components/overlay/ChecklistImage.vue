<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  src: { type: String, default: null },
});
const emit = defineEmits(['error']);

const displayed = ref(null);
const shown = ref(false);

// Précharge la nouvelle image avant l'échange pour éviter un flash vide.
watch(
  () => props.src,
  (src) => {
    if (!src) {
      shown.value = false;
      return;
    }
    const next = new Image();
    next.onload = () => {
      if (props.src !== src) return;
      displayed.value = src;
      shown.value = true;
    };
    next.onerror = () => emit('error', src);
    next.src = src;
  },
  { immediate: true },
);
</script>

<template>
  <img v-if="displayed" class="checklist" :class="{ shown }" :src="displayed" alt="">
</template>
