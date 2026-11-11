<script setup>
import { ref, computed } from 'vue';
import BaseDialog from './BaseDialog.vue';
import CodesInput from './CodesInput.vue';
import { useAdminStore } from '../../composables/useAdminStore.js';

const props = defineProps({
  // Famille à modifier, ou null pour en ajouter une.
  family: { type: Object, default: null },
});
const emit = defineEmits(['close']);

const store = useAdminStore();
const form = ref({ name: props.family?.name ?? '', types: [...(props.family?.types ?? [])] });
const localError = ref('');

const isEmpty = computed(() => !store.data.value.checklists.some((c) => c.family === props.family?.id));

async function submit() {
  localError.value = '';
  if (!form.value.name.trim()) return (localError.value = 'Donne un nom à la famille.');
  if (!form.value.types.length) return (localError.value = 'Ajoute au moins un type d\'avion.');
  const ok = props.family ? await store.updateFamily(props.family.id, form.value) : await store.addFamily(form.value);
  if (ok) emit('close');
}

async function remove() {
  if (!confirm(`Supprimer la famille « ${props.family.name} » ?`)) return;
  if (await store.removeFamily(props.family.id)) emit('close');
}
</script>

<template>
  <BaseDialog :title="family ? `Modifier « ${family.name} »` : 'Ajouter une famille d\'avion'" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <label class="field">
        <span class="field__label">Nom</span>
        <input v-model="form.name" class="field__control" placeholder="Airbus A330">
      </label>

      <div class="field">
        <span class="field__label">Types ICAO SimBrief (aircraft.icaocode)</span>
        <CodesInput v-model="form.types" list-id="aircraft-types" placeholder="A332, A333, A339" />
        <span class="field__hint">Entrée après chaque type. Un vol avec un de ces types utilise les checklists de cette famille.</span>
      </div>

      <p v-if="localError || store.error.value" class="status status--error">{{ localError || store.error.value }}</p>

      <div class="form__actions">
        <button
          v-if="family"
          type="button"
          class="button button--danger"
          :disabled="store.saving.value || !isEmpty"
          :title="isEmpty ? '' : 'Supprime d\'abord ses checklists'"
          @click="remove"
        >
          Supprimer
        </button>
        <span class="form__spacer" />
        <button type="button" class="button button--ghost" @click="emit('close')">Annuler</button>
        <button type="submit" class="button" :disabled="store.saving.value">
          {{ store.saving.value ? 'Envoi…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </BaseDialog>
</template>
