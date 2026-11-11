import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';
import config from './config.js';
import { checklistsPlugin } from './vite/checklists-plugin.js';

export default defineConfig({
  // OBS charge la page en fichier local : tout (JS + CSS) est inliné dans un seul HTML
  // et les images sont lues en chemins relatifs depuis le dossier Dropbox.
  base: './',
  server: { port: 5190 },
  plugins: [vue(), viteSingleFile(), checklistsPlugin(config)],
});
