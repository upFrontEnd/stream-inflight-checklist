<script setup>
import { ref, computed } from 'vue';
import BaseDialog from './BaseDialog.vue';
import CodesInput from './CodesInput.vue';
import AdminIcon from './AdminIcon.vue';
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
  <BaseDialog
    :title="family ? `Modifier « ${family.name} »` : `Ajouter une famille d'avion`"
    subtitle="Un vol SimBrief avec un de ces types utilise les checklists de la famille."
    @close="emit('close')"
  >
    <form class="fields" @submit.prevent="submit">
      <div class="field">
        <label class="field__label" for="family-name">Nom</label>
        <input id="family-name" v-model="form.name" class="input" placeholder="Airbus A330">
      </div>

      <div class="field">
        <span class="field__label">Types ICAO SimBrief <span class="field__optional">(aircraft.icaocode)</span></span>
        <CodesInput v-model="form.types" list-id="aircraft-types" placeholder="A332, A333, A339" />
        <span class="field__hint">Entrée après chaque type.</span>
      </div>

      <p v-if="localError || store.error.value" class="status status--error" role="alert">
        <AdminIcon name="alert" :size="16" />
        {{ localError || store.error.value }}
      </p>

      <div class="dialog__actions">
        <button
          v-if="family"
          type="button"
          class="btn btn--danger"
          :disabled="store.saving.value || !isEmpty"
          :title="isEmpty ? '' : `Supprime d'abord ses checklists`"
          @click="remove"
        >
          <AdminIcon name="trash" :size="18" />
          Supprimer
        </button>
        <span class="dialog__spacer"></span>
        <button type="button" class="btn btn--ghost" @click="emit('close')">Annuler</button>
        <button type="submit" class="btn btn--primary" :disabled="store.saving.value">
          {{ store.saving.value ? 'Envoi…' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </BaseDialog>
</template>
