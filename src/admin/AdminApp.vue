<script setup>
import { ref, computed, markRaw, onMounted, watch } from 'vue';
import LoginCard from '../components/admin/LoginCard.vue';
import AdminIcon from '../components/admin/AdminIcon.vue';
import AdminOverview from '../components/admin/AdminOverview.vue';
import FamilyPage from '../components/admin/FamilyPage.vue';
import TestPanel from '../components/admin/TestPanel.vue';
import ChecklistDialog from '../components/admin/ChecklistDialog.vue';
import FamilyDialog from '../components/admin/FamilyDialog.vue';
import { useAdminStore } from '../composables/useAdminStore.js';
import { useAdminNav, familyKey, familyTone } from '../composables/useAdminNav.js';
import logo from '../img/logo.webp';

const store = useAdminStore();
const { data, connected, loading, error, notice } = store;
const { current, go } = useAdminNav();

const families = computed(() => (data.value?.families ?? []).map((family, i) => ({
  ...family,
  tone: familyTone(i),
  count: data.value.checklists.filter((c) => c.family === family.id).length,
})));

// Une entrée = une page de l'admin. La clé sert aussi d'ancre dans l'URL.
const pages = computed(() => [
  { key: 'overview', group: null, label: 'Accueil', icon: 'home', component: markRaw(AdminOverview) },
  ...families.value.map((f) => ({
    key: familyKey(f.id),
    group: 'Familles d\'avion',
    label: f.name,
    icon: 'plane',
    tone: f.tone,
    count: f.count || null,
    description: 'Checklists affichées pour un vol avec un de ces types d\'avion SimBrief.',
    component: markRaw(FamilyPage),
    props: { family: f },
  })),
  {
    key: 'test',
    group: 'Outils',
    label: 'Tester un vol',
    icon: 'search',
    tone: 'green',
    description: 'Vérifie quelle checklist OBS affichera pour un callsign et un type d\'avion donnés.',
    component: markRaw(TestPanel),
  },
]);

// Page inconnue (famille supprimée, ancre tapée à la main) : retour à l'accueil.
const page = computed(() => pages.value.find((p) => p.key === current.value) ?? pages.value[0]);

// Pages regroupées par section de la barre latérale (null = en tête, sans titre).
const navGroups = computed(() => {
  const groups = [];
  for (const p of pages.value) {
    let group = groups.find((g) => g.title === p.group);
    if (!group) groups.push((group = { title: p.group, pages: [] }));
    group.pages.push(p);
  }
  return groups;
});

// Sur mobile, la barre latérale devient un tiroir : on le referme dès
// qu'une page est choisie.
const sidebarOpen = ref(false);
function navigate(key) {
  if (key !== current.value) store.clearMessages();
  go(key);
  sidebarOpen.value = false;
}

watch(() => page.value.key, () => {
  document.title = `${page.value.label} · Admin checklists`;
  document.querySelector('.shell__main')?.scrollTo({ top: 0 });
}, { immediate: true });

// Fenêtre ouverte : { kind: 'checklist' | 'family', item, family }
const dialog = ref(null);

function open(kind, item = null, family = '') {
  store.clearMessages();
  dialog.value = { kind, item, family };
}

function closeDialog() {
  dialog.value = null;
  store.error.value = '';
}

const overlayUrl = './';
const siteAdminUrl = 'https://www.skyflyer-aviation.com/admin.html';

onMounted(store.load);
</script>

<template>
  <div class="admin">
    <LoginCard v-if="!connected" />

    <div v-else class="shell" :class="{ 'shell--nav-open': sidebarOpen }">
      <aside class="sidebar" aria-label="Navigation de l'admin">
        <div class="sidebar__brand">
          <img class="sidebar__logo" :src="logo" alt="" width="40" height="40">
          <div>
            <p class="sidebar__name">Skyflyer Aviation</p>
            <p class="sidebar__role">Checklists du stream</p>
          </div>
        </div>

        <nav class="sidebar__nav">
          <div v-for="group in navGroups" :key="group.title ?? 'main'" class="sidebar__group">
            <p v-if="group.title" class="sidebar__group-title">{{ group.title }}</p>
            <a
              v-for="p in group.pages"
              :key="p.key"
              :href="`#${p.key === 'overview' ? '' : p.key}`"
              class="sidebar__link"
              :class="[{ 'sidebar__link--active': p.key === page.key }, p.tone && `tone-${p.tone}`]"
              :aria-current="p.key === page.key ? 'page' : undefined"
              @click.prevent="navigate(p.key)"
            >
              <AdminIcon :name="p.icon" class="sidebar__icon" />
              <span class="sidebar__label">{{ p.label }}</span>
              <span v-if="p.count" class="sidebar__count">{{ p.count }}</span>
            </a>
            <button
              v-if="group.title === 'Familles d\'avion'"
              type="button"
              class="sidebar__link sidebar__link--add"
              @click="open('family')"
            >
              <AdminIcon name="plus" class="sidebar__icon" />
              <span>Nouvelle famille</span>
            </button>
          </div>
        </nav>

        <div class="sidebar__footer">
          <a class="sidebar__link" :href="overlayUrl" target="_blank" rel="noopener">
            <AdminIcon name="external" class="sidebar__icon" />
            <span>Voir la checklist active</span>
          </a>
          <a class="sidebar__link" :href="siteAdminUrl">
            <AdminIcon name="home" class="sidebar__icon" />
            <span>Retour à l'admin du site</span>
          </a>
          <div class="sidebar__user">
            <span class="sidebar__avatar" aria-hidden="true">S</span>
            <span class="sidebar__email">Connecté à GitHub</span>
            <button class="icon-btn" type="button" title="Déconnexion" aria-label="Déconnexion" @click="store.logout">
              <AdminIcon name="logout" :size="18" />
            </button>
          </div>
        </div>
      </aside>

      <div class="shell__scrim" @click="sidebarOpen = false"></div>

      <div class="shell__main">
        <header class="topbar">
          <button class="icon-btn topbar__menu" type="button" aria-label="Ouvrir le menu" @click="sidebarOpen = true">
            <AdminIcon name="menu" />
          </button>
          <AdminIcon :name="page.icon" class="topbar__icon" />
          <span class="topbar__title">{{ page.label }}</span>
          <span v-if="store.saving.value" class="topbar__saving">
            <span class="spinner" aria-hidden="true"></span>
            Envoi sur GitHub…
          </span>
        </header>

        <main class="page">
          <Transition name="fade">
            <p v-if="notice" class="notice notice--success" role="status">
              <AdminIcon name="check" :size="18" />
              <span>{{ notice }}</span>
              <button type="button" class="icon-btn notice__close" aria-label="Masquer" @click="store.notice.value = ''">
                <AdminIcon name="close" :size="16" />
              </button>
            </p>
          </Transition>
          <p v-if="error && !dialog" class="notice notice--error" role="alert">
            <AdminIcon name="alert" :size="18" />
            <span>{{ error }}</span>
            <button type="button" class="btn btn--sm" @click="store.load">
              <AdminIcon name="refresh" :size="16" />
              Recharger
            </button>
          </p>

          <p v-if="loading && !data" class="muted page__loading">Chargement des checklists…</p>

          <template v-else-if="data">
            <header v-if="page.key !== 'overview'" class="page__header">
              <h1 class="page__title">{{ page.label }}</h1>
              <p v-if="page.description" class="page__lead">{{ page.description }}</p>
            </header>
            <component :is="page.component" v-bind="page.props" @open="open" />
          </template>
        </main>
      </div>
    </div>

    <ChecklistDialog
      v-if="dialog?.kind === 'checklist'"
      :checklist="dialog.item"
      :family="dialog.family"
      @close="closeDialog"
    />
    <FamilyDialog v-if="dialog?.kind === 'family'" :family="dialog.item" @close="closeDialog" />
  </div>
</template>
