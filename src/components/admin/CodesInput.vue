<script setup>
// Saisie d'une liste de codes (codes ICAO compagnie, types d'avion) sous forme de pastilles.
import { ref, computed } from 'vue';

const props = defineProps({
  // Liste proposée à l'autocomplétion : [{ code, name }]
  options: { type: Array, default: () => [] },
  // Codes suggérés (ex. d'après le nom de la compagnie), ajoutables en un clic.
  suggestions: { type: Array, default: () => [] },
  placeholder: { type: String, default: '' },
  listId: { type: String, required: true },
  // Format d'un code valide (3 lettres pour une compagnie, 3-4 caractères pour un type).
  pattern: { type: RegExp, default: () => /^[A-Z0-9]{3,4}$/ },
});
const codes = defineModel({ type: Array, required: true });

const draft = ref('');

const nameOf = computed(() => new Map(props.options.map((o) => [o.code, o.name])));
const pending = computed(() => props.suggestions.filter((c) => !codes.value.includes(c)));

function add(raw) {
  // Accepte "RYR", "RYR — Ryanair" (choix dans la liste) ou plusieurs codes séparés.
  const text = String(raw).split('—')[0];
  const parts = text.split(/[\s,;]+/).map((p) => p.trim().toUpperCase()).filter(Boolean);
  // Texte qui n'est pas un code (ex. recherche "Ryan" en cours) : on le laisse dans le champ.
  if (!parts.length || !parts.every((c) => props.pattern.test(c))) return;
  codes.value = [...new Set([...codes.value, ...parts])];
  draft.value = '';
}

function remove(code) {
  codes.value = codes.value.filter((c) => c !== code);
}

function onInput(e) {
  // Choix dans la liste déroulante : ajout immédiat.
  if (e.inputType === 'insertReplacementText' || e.inputType === undefined) {
    if (draft.value.includes('—')) add(draft.value);
  }
}

function onBackspace() {
  if (!draft.value && codes.value.length) codes.value = codes.value.slice(0, -1);
}
</script>

<template>
  <div class="codes">
    <div class="codes__box">
      <span v-for="code in codes" :key="code" class="chip" :title="nameOf.get(code)">
        {{ code }}
        <button type="button" class="chip__remove" :aria-label="`Retirer ${code}`" @click="remove(code)">✕</button>
      </span>
      <input
        v-model="draft"
        class="codes__input"
        :list="listId"
        :placeholder="codes.length ? '' : placeholder"
        @input="onInput"
        @keydown.enter.prevent="add(draft)"
        @keydown.backspace="onBackspace"
        @blur="add(draft)"
      >
      <datalist :id="listId">
        <option v-for="o in options" :key="o.code" :value="`${o.code} — ${o.name}`" />
      </datalist>
    </div>
    <div v-if="pending.length" class="codes__suggestions">
      Suggestions :
      <button v-for="code in pending" :key="code" type="button" class="chip chip--suggestion" :title="nameOf.get(code)" @click="add(code)">
        + {{ code }}
      </button>
      <button v-if="pending.length > 1" type="button" class="link-button" @click="add(pending.join(' '))">tout ajouter</button>
    </div>
  </div>
</template>
