<script setup>
import { ref, computed, watch } from 'vue';
import BaseDialog from './BaseDialog.vue';
import ImageDrop from './ImageDrop.vue';
import CodesInput from './CodesInput.vue';
import AdminIcon from './AdminIcon.vue';
import { AIRLINES } from '../../lib/airlines.js';
import { rawUrl } from '../../lib/github.js';
import { useAdminStore } from '../../composables/useAdminStore.js';

const props = defineProps({
  // Checklist à modifier, ou null pour en ajouter une.
  checklist: { type: Object, default: null },
  // Famille présélectionnée à l'ajout.
  family: { type: String, default: '' },
});
const emit = defineEmits(['close']);

const store = useAdminStore();
const families = computed(() => store.data.value.families);

const form = ref({
  family: props.checklist?.family ?? props.family ?? families.value[0]?.id ?? '',
  label: props.checklist?.label ?? '',
  airlines: [...(props.checklist?.airlines ?? [])],
  isDefault: props.checklist?.default ?? false,
  file: null,
});
const localError = ref('');

const AIRLINE_CODE = /^[A-Z]{3}$/;
const airlineOptions = AIRLINES.map((a) => ({ code: a.icao, name: a.name }));

function normalize(text) {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
}

// Codes proposés d'après le nom saisi : nom officiel ou autre écriture connue.
const suggestions = computed(() => {
  const label = normalize(form.value.label);
  if (label.length < 2) return [];
  return AIRLINES
    .filter((a) => normalize(a.name) === label || (a.aliases ?? []).some((x) => normalize(x) === label))
    .map((a) => a.icao);
});

// Nouvelle checklist : nom officiel reconnu → son code est ajouté d'office.
watch(() => form.value.label, (label) => {
  if (props.checklist || form.value.airlines.length) return;
  const exact = AIRLINES.find((a) => normalize(a.name) === normalize(label));
  if (exact) form.value.airlines = [exact.icao];
});

async function submit() {
  localError.value = '';
  if (!form.value.label.trim()) return (localError.value = 'Donne un nom à la checklist.');
  if (!props.checklist && !form.value.file) return (localError.value = 'Ajoute l\'image de la checklist.');
  const ok = props.checklist
    ? await store.updateChecklist(props.checklist.id, form.value)
    : await store.addChecklist(form.value);
  if (ok) emit('close');
}

async function remove() {
  if (!confirm(`Supprimer la checklist « ${props.checklist.label} » ?`)) return;
  if (await store.removeChecklist(props.checklist.id)) emit('close');
}
</script>

<template>
  <BaseDialog
    :title="checklist ? `Modifier « ${checklist.label} »` : 'Ajouter une checklist'"
    subtitle="L'image est compressée en WebP puis publiée sur GitHub."
    @close="emit('close')"
  >
    <form class="fields" @submit.prevent="submit">
      <div class="field">
        <span class="field__label">Image</span>
        <ImageDrop v-model="form.file" :current="checklist ? rawUrl(checklist.image) : null" />
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field__label" for="checklist-family">Famille d'avion</label>
          <select id="checklist-family" v-model="form.family" class="input">
            <option v-for="f in families" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>

        <div class="field">
          <label class="field__label" for="checklist-label">Nom affiché</label>
          <input id="checklist-label" v-model="form.label" class="input" list="airline-names" placeholder="Ryanair, ou « Générique »">
          <datalist id="airline-names">
            <option v-for="a in AIRLINES" :key="a.icao" :value="a.name" />
          </datalist>
        </div>
      </div>

      <div class="field">
        <span class="field__label">Codes ICAO compagnie <span class="field__optional">(début du callsign : RYR pour RYR4KJ)</span></span>
        <CodesInput
          v-model="form.airlines"
          list-id="airline-codes"
          :options="airlineOptions"
          :suggestions="suggestions"
          :pattern="AIRLINE_CODE"
          placeholder="RYR, ou rechercher une compagnie"
        />
        <span class="field__hint">Aucun code : checklist générique de la famille.</span>
      </div>

      <label class="switch">
        <input v-model="form.isDefault" type="checkbox">
        <span class="switch__track"></span>
        <span class="switch__label">
          Checklist par défaut de la famille
          <small>Affichée quand la compagnie du vol n'a pas la sienne</small>
        </span>
      </label>

      <p v-if="localError || store.error.value" class="status status--error" role="alert">
        <AdminIcon name="alert" :size="16" />
        {{ localError || store.error.value }}
      </p>

      <div class="dialog__actions">
        <button v-if="checklist" type="button" class="btn btn--danger" :disabled="store.saving.value" @click="remove">
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
