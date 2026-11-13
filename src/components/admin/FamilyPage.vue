<script setup>
import { computed } from 'vue';
import { familyFallback } from '../../lib/select.js';
import { useAdminStore } from '../../composables/useAdminStore.js';
import AdminIcon from './AdminIcon.vue';
import ChecklistCard from './ChecklistCard.vue';

const props = defineProps({
  family: { type: Object, required: true },
});
const emit = defineEmits(['open']);

const store = useAdminStore();

const checklists = computed(() => store.data.value.checklists.filter((c) => c.family === props.family.id));
const fallbackId = computed(() => familyFallback(store.data.value, props.family.id)?.id ?? null);
</script>

<template>
  <div class="family">
    <section class="card family__info">
      <div class="family__types">
        <span class="field__label">Types SimBrief</span>
        <div class="chips">
          <span v-for="type in family.types" :key="type" class="chip chip--muted">{{ type }}</span>
        </div>
      </div>
      <div class="family__actions">
        <button type="button" class="btn" @click="emit('open', 'family', family)">
          <AdminIcon name="pencil" :size="18" />
          Modifier la famille
        </button>
        <button type="button" class="btn btn--primary" @click="emit('open', 'checklist', null, family.id)">
          <AdminIcon name="plus" :size="18" />
          Ajouter une checklist
        </button>
      </div>
    </section>

    <ul v-if="checklists.length" class="checklist-grid">
      <li v-for="c in checklists" :key="c.id">
        <ChecklistCard
          :checklist="c"
          :is-fallback="c.id === fallbackId"
          :busy="store.saving.value"
          @edit="emit('open', 'checklist', c)"
          @make-default="store.setDefault(c.id)"
        />
      </li>
    </ul>
    <div v-else class="card empty">
      <AdminIcon name="image" :size="28" />
      <p>Aucune checklist : un vol de cette famille n'affichera rien.</p>
      <button type="button" class="btn btn--primary" @click="emit('open', 'checklist', null, family.id)">
        <AdminIcon name="plus" :size="18" />
        Ajouter la première
      </button>
    </div>
  </div>
</template>
