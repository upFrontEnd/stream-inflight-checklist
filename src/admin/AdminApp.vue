<script setup>
import { ref, computed, onMounted } from 'vue';
import LoginCard from '../components/admin/LoginCard.vue';
import TestPanel from '../components/admin/TestPanel.vue';
import FamilySection from '../components/admin/FamilySection.vue';
import ChecklistDialog from '../components/admin/ChecklistDialog.vue';
import FamilyDialog from '../components/admin/FamilyDialog.vue';
import { familyFallback } from '../lib/select.js';
import { GITHUB_REPO } from '../settings.js';
import { useAdminStore } from '../composables/useAdminStore.js';
import logo from '../img/logo.png';

const store = useAdminStore();
const { data, connected, loading, error, notice } = store;

// Fenêtre ouverte : { kind: 'checklist' | 'family', item, family }
const dialog = ref(null);

const overlayUrl = './';
const publicUrl = computed(() => {
  const [owner, repo] = GITHUB_REPO.split('/');
  return `https://${owner.toLowerCase()}.github.io/${repo}/`;
});

const sections = computed(() =>
  (data.value?.families ?? []).map((family) => ({
    family,
    checklists: data.value.checklists.filter((c) => c.family === family.id),
    fallbackId: familyFallback(data.value, family.id)?.id ?? null,
  })),
);

const total = computed(() => data.value?.checklists.length ?? 0);

function open(kind, item = null, family = '') {
  store.clearMessages();
  dialog.value = { kind, item, family };
}

onMounted(store.load);
</script>

<template>
  <div class="admin">
    <header class="admin__header">
      <div class="admin__brand">
        <img class="admin__logo" :src="logo" alt="Skyflyer Aviation">
        <div>
          <h1 class="admin__title">Checklists</h1>
          <p class="admin__subtitle">Choisies automatiquement dans OBS d'après le callsign et l'avion du plan SimBrief.</p>
        </div>
      </div>
      <nav v-if="connected" class="admin__nav">
        <a class="link" :href="overlayUrl" target="_blank" rel="noopener">Voir l'overlay</a>
        <button type="button" class="link-button" @click="store.logout">Se déconnecter</button>
      </nav>
    </header>

    <LoginCard v-if="!connected" />

    <template v-else>
      <p v-if="notice" class="banner banner--ok">{{ notice }}</p>
      <p v-if="error && !dialog" class="banner banner--error">
        {{ error }}
        <button type="button" class="link-button" @click="store.load">Recharger</button>
      </p>

      <p v-if="loading" class="status">Chargement des checklists…</p>

      <template v-else-if="data">
        <TestPanel />

        <div class="admin__toolbar">
          <span class="status">{{ total }} checklists · {{ data.families.length }} familles</span>
          <div class="admin__toolbar-actions">
            <button type="button" class="button button--ghost" @click="open('family')">+ Famille d'avion</button>
            <button type="button" class="button" @click="open('checklist')">+ Checklist</button>
          </div>
        </div>

        <FamilySection
          v-for="s in sections"
          :key="s.family.id"
          :family="s.family"
          :checklists="s.checklists"
          :fallback-id="s.fallbackId"
          @edit-family="open('family', s.family)"
          @add-checklist="open('checklist', null, s.family.id)"
          @edit-checklist="(c) => open('checklist', c)"
          @make-default="(c) => store.setDefault(c.id)"
        />

        <footer class="admin__footer">
          URL de la source OBS : <code>{{ publicUrl }}</code>
        </footer>
      </template>
    </template>

    <ChecklistDialog
      v-if="dialog?.kind === 'checklist'"
      :checklist="dialog.item"
      :family="dialog.family"
      @close="dialog = null"
    />
    <FamilyDialog v-if="dialog?.kind === 'family'" :family="dialog.item" @close="dialog = null" />
  </div>
</template>
