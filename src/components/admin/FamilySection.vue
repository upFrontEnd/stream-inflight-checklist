<script setup>
import ChecklistCard from './ChecklistCard.vue';

defineProps({
  family: { type: Object, required: true },
  checklists: { type: Array, required: true },
  fallbackId: { type: String, default: null },
});
const emit = defineEmits(['edit-family', 'add-checklist', 'edit-checklist', 'make-default']);
</script>

<template>
  <section class="family">
    <header class="family__header">
      <div>
        <h2 class="family__title">{{ family.name }}</h2>
        <div class="family__types">
          <span v-for="type in family.types" :key="type" class="chip chip--small chip--muted">{{ type }}</span>
        </div>
      </div>
      <div class="family__actions">
        <button type="button" class="button button--ghost button--small" @click="emit('edit-family')">Modifier la famille</button>
        <button type="button" class="button button--small" @click="emit('add-checklist')">+ Checklist</button>
      </div>
    </header>

    <div v-if="checklists.length" class="family__grid">
      <ChecklistCard
        v-for="c in checklists"
        :key="c.id"
        :checklist="c"
        :is-fallback="c.id === fallbackId"
        @edit="emit('edit-checklist', c)"
        @make-default="emit('make-default', c)"
      />
    </div>
    <p v-else class="family__empty">Aucune checklist : un vol de cette famille n'affichera rien.</p>
  </section>
</template>
