<script setup>
import { ref, onMounted } from 'vue';

defineProps({
  title: { type: String, required: true },
});
const emit = defineEmits(['close']);

const dialog = ref(null);

onMounted(() => dialog.value.showModal());

// Clic sur le fond (hors de la boîte) : ferme.
function onClick(e) {
  if (e.target === dialog.value) emit('close');
}
</script>

<template>
  <dialog ref="dialog" class="dialog" @click="onClick" @cancel.prevent="emit('close')">
    <div class="dialog__box">
      <header class="dialog__header">
        <h2 class="dialog__title">{{ title }}</h2>
        <button type="button" class="icon-button" aria-label="Fermer" @click="emit('close')">✕</button>
      </header>
      <slot />
    </div>
  </dialog>
</template>
