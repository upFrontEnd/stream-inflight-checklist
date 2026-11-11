// Plugin Vite :
// - module virtuel `virtual:checklists` : liste des checklists scannée dans le Dropbox
// - en dev, sert les images du Dropbox sous /checklists/ et recharge la page si un fichier change
// - au build, copie la page (un seul fichier HTML) dans le dossier Dropbox
import { createReadStream, copyFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { buildManifest } from '../scripts/manifest.js';

const VIRTUAL_ID = 'virtual:checklists';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

export function checklistsPlugin(config) {
  const checklistDir = resolve(config.checklistDir);
  let outDir;

  return {
    name: 'checklists',

    configResolved(resolved) {
      outDir = resolve(resolved.root, resolved.build.outDir);
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id !== RESOLVED_ID) return;
      const { manifest, warnings } = buildManifest(config);
      for (const w of warnings) this.warn(w);
      const settings = { simbrief: config.simbrief, refreshSeconds: config.refreshSeconds, border: config.border };
      return `export const manifest = ${JSON.stringify(manifest)};\nexport const settings = ${JSON.stringify(settings)};\n`;
    },

    configureServer(server) {
      server.middlewares.use('/checklists', (req, res, next) => {
        const file = resolve(checklistDir, '.' + decodeURIComponent(req.url.split('?')[0]));
        if (!file.startsWith(checklistDir + sep) || !existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] ?? 'application/octet-stream');
        createReadStream(file).pipe(res);
      });

      // Checklist ajoutée / supprimée / renommée : on rescane et on recharge la page.
      server.watcher.add(checklistDir);
      const onChange = (file) => {
        if (!resolve(file).startsWith(checklistDir + sep)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
    },

    closeBundle() {
      const built = join(outDir, 'index.html');
      if (!existsSync(built)) return;
      const target = join(checklistDir, config.outputFile);
      copyFileSync(built, target);
      console.log(`\n✔ Page OBS : ${target}`);
    },
  };
}
