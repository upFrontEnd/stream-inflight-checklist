<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  src: { type: String, default: null },
  border: { type: Object, required: true },
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
  <img
    v-if="displayed"
    class="checklist"
    :class="{ shown }"
    :src="displayed"
    :style="{ borderWidth: `${border.width}px`, borderColor: border.color }"
    alt=""
  >
</template>

<style scoped lang="scss">
.checklist {
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: top;
  border-style: solid;
  opacity: 0;
  transition: opacity 0.25s;

  &.shown {
    opacity: 1;
  }
}
</style>
