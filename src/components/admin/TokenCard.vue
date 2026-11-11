<script setup>
import { ref } from 'vue';
import { TOKEN_CREATE_URL } from '../../lib/github.js';
import { GITHUB_REPO } from '../../settings.js';
import { useAdminStore } from '../../composables/useAdminStore.js';

const store = useAdminStore();
const token = ref('');
const checking = ref(false);

async function submit() {
  checking.value = true;
  await store.connect(token.value);
  checking.value = false;
}
</script>

<template>
  <form class="panel token" @submit.prevent="submit">
    <h2 class="panel__title">Connecter GitHub</h2>
    <p class="panel__text">
      Les checklists sont stockées dans le dépôt <code>{{ GITHUB_REPO }}</code>. Chaque modification ici
      est un commit, puis le site se redéploie tout seul (~1 min).
    </p>
    <ol class="token__steps">
      <li>
        <a class="link" :href="TOKEN_CREATE_URL" target="_blank" rel="noopener">Créer un jeton GitHub</a>
        (page pré-remplie : Contents en écriture, valable 1 an).
      </li>
      <li>Choisir « Only select repositories » → <code>{{ GITHUB_REPO.split('/')[1] }}</code>, puis « Generate token ».</li>
      <li>Coller le jeton ci-dessous. Il reste dans ce navigateur uniquement.</li>
    </ol>
    <div class="token__row">
      <input v-model="token" class="field__control" type="password" placeholder="github_pat_…" autocomplete="off">
      <button type="submit" class="button" :disabled="!token || checking">{{ checking ? 'Vérification…' : 'Connecter' }}</button>
    </div>
    <p v-if="store.error.value" class="status status--error">{{ store.error.value }}</p>
  </form>
</template>
