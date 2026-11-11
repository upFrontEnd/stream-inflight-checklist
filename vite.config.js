import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // Chemins relatifs : le site est servi sous /stream-inflight-checklist/ sur GitHub Pages.
  base: './',
  server: { port: 5190 },
  build: {
    rollupOptions: {
      input: {
        overlay: 'index.html', // source OBS
        admin: 'admin.html', // interface d'administration
      },
    },
  },
  plugins: [vue()],
});
