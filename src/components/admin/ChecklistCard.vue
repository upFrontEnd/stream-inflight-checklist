<script setup>
import { rawUrl } from '../../lib/github.js';
import { airlineName } from '../../lib/airlines.js';
import AdminIcon from './AdminIcon.vue';

defineProps({
  checklist: { type: Object, required: true },
  // Checklist affichée quand la compagnie du vol n'a pas la sienne.
  isFallback: { type: Boolean, default: false },
  // Un envoi est en cours : on évite d'en lancer un second.
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['edit', 'make-default']);
</script>

<template>
  <article class="card checklist">
    <button type="button" class="checklist__thumb" :aria-label="`Modifier ${checklist.label}`" @click="emit('edit')">
      <img :src="rawUrl(checklist.image)" alt="" loading="lazy">
      <span v-if="isFallback" class="badge badge--accent checklist__default" :title="checklist.default ? 'Choisie comme défaut' : 'Défaut automatique'">
        <AdminIcon name="star" :size="12" />
        Par défaut
      </span>
    </button>
    <div class="checklist__body">
      <p class="checklist__title">{{ checklist.label }}</p>
      <div class="chips">
        <span v-for="code in checklist.airlines" :key="code" class="chip" :title="airlineName(code)">{{ code }}</span>
        <span v-if="!checklist.airlines.length" class="chip chip--muted">Générique</span>
      </div>
    </div>
    <div class="checklist__actions">
      <button type="button" class="btn btn--sm btn--ghost" @click="emit('edit')">
        <AdminIcon name="pencil" :size="16" />
        Modifier
      </button>
      <button
        v-if="!checklist.default"
        type="button"
        class="icon-btn"
        title="Définir comme checklist par défaut"
        :aria-label="`Définir ${checklist.label} comme checklist par défaut`"
        :disabled="busy"
        @click="emit('make-default')"
      >
        <AdminIcon name="star" :size="18" />
      </button>
    </div>
  </article>
</template>
