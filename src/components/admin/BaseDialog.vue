<script setup>
import { ref, onMounted } from 'vue';
import AdminIcon from './AdminIcon.vue';

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
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
        <div>
          <h2 class="dialog__title">{{ title }}</h2>
          <p v-if="subtitle" class="card__subtitle">{{ subtitle }}</p>
        </div>
        <button type="button" class="icon-btn" aria-label="Fermer" @click="emit('close')">
          <AdminIcon name="close" :size="18" />
        </button>
      </header>
      <slot />
    </div>
  </dialog>
</template>
