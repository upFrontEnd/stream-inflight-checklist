<script setup>
import { ref } from 'vue';
import { useAdminStore } from '../../composables/useAdminStore.js';

const store = useAdminStore();
const username = ref('');
const password = ref('');
const remember = ref(false);
const checking = ref(false);

async function submit() {
  checking.value = true;
  const ok = await store.login(username.value, password.value, { remember: remember.value });
  checking.value = false;
  if (!ok) password.value = '';
}
</script>

<template>
  <form class="panel login" @submit.prevent="submit">
    <h2 class="panel__title">Connexion</h2>
    <label class="field">
      <span class="field__label">Login</span>
      <input v-model="username" class="field__control" autocomplete="username" autofocus>
    </label>
    <label class="field">
      <span class="field__label">Mot de passe</span>
      <input v-model="password" class="field__control" type="password" autocomplete="current-password">
    </label>
    <label class="checkbox">
      <input v-model="remember" type="checkbox">
      Rester connecté sur ce navigateur
    </label>
    <p v-if="store.error.value" class="status status--error">{{ store.error.value }}</p>
    <button type="submit" class="button" :disabled="!username || !password || checking">
      {{ checking ? 'Connexion…' : 'Se connecter' }}
    </button>
  </form>
</template>
