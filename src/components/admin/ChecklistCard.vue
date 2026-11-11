<script setup>
import { rawUrl } from '../../lib/github.js';
import { airlineName } from '../../lib/airlines.js';

defineProps({
  checklist: { type: Object, required: true },
  // Checklist affichée quand la compagnie du vol n'a pas la sienne.
  isFallback: { type: Boolean, default: false },
});
const emit = defineEmits(['edit', 'make-default']);
</script>

<template>
  <article class="card">
    <button type="button" class="card__thumb" :aria-label="`Modifier ${checklist.label}`" @click="emit('edit')">
      <img :src="rawUrl(checklist.image)" alt="" loading="lazy">
    </button>
    <div class="card__body">
      <div class="card__title">
        {{ checklist.label }}
        <span v-if="isFallback" class="badge" :title="checklist.default ? 'Choisie comme défaut' : 'Défaut automatique'">par défaut</span>
      </div>
      <div class="card__codes">
        <span v-for="code in checklist.airlines" :key="code" class="chip chip--small" :title="airlineName(code)">{{ code }}</span>
        <span v-if="!checklist.airlines.length" class="card__muted">générique</span>
      </div>
      <div class="card__actions">
        <button type="button" class="link-button" @click="emit('edit')">Modifier</button>
        <button v-if="!checklist.default" type="button" class="link-button" @click="emit('make-default')">Mettre par défaut</button>
      </div>
    </div>
  </article>
</template>
