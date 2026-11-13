<script setup>
import { ref } from 'vue';
import { useAdminStore } from '../../composables/useAdminStore.js';
import AdminIcon from './AdminIcon.vue';
import logo from '../../img/logo.webp';

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
  <div class="login">
    <form class="login__card" @submit.prevent="submit">
      <img class="login__logo" :src="logo" alt="" width="56" height="56">
      <div class="login__heading">
        <h1 class="login__title">Administration</h1>
        <p class="login__subtitle">Connecte-toi pour gérer les checklists du stream.</p>
      </div>
      <div class="fields">
        <div class="field">
          <label class="field__label" for="admin-login">Login</label>
          <input id="admin-login" v-model="username" class="input" autocomplete="username" autofocus>
        </div>
        <div class="field">
          <label class="field__label" for="admin-password">Mot de passe</label>
          <input id="admin-password" v-model="password" class="input" type="password" autocomplete="current-password">
        </div>
        <label class="switch">
          <input v-model="remember" type="checkbox">
          <span class="switch__track"></span>
          <span class="switch__label">Rester connecté sur ce navigateur</span>
        </label>
      </div>
      <button type="submit" class="btn btn--primary btn--block" :disabled="!username || !password || checking">
        {{ checking ? 'Connexion…' : 'Se connecter' }}
      </button>
      <p v-if="store.error.value" class="status status--error" role="alert">
        <AdminIcon name="alert" :size="16" />
        {{ store.error.value }}
      </p>
    </form>
  </div>
</template>
