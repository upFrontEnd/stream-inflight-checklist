// Définit (ou change) le login / mot de passe de l'admin.
//   bun run admin:password
// Chiffre le jeton GitHub avec ces identifiants dans public/admin-auth.json,
// à commiter et pousser ensuite. Le jeton lui-même n'est jamais écrit en clair.
//
// Sans interaction (CI, tests) : variables ADMIN_LOGIN, ADMIN_PASSWORD, GITHUB_TOKEN.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { encryptToken, decryptToken } from '../src/lib/vault.js';
import { verifyToken, TOKEN_CREATE_URL } from '../src/lib/github.js';
import { GITHUB_REPO } from '../src/settings.js';

const AUTH_FILE = join(import.meta.dir, '../public/admin-auth.json');
const MIN_PASSWORD = 12;

// Lecture d'une ligne au clavier ; `hidden` affiche des * à la place des caractères.
function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    process.stdout.write(`${question} `);
    const stdin = process.stdin;
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const done = () => {
      stdin.off('data', onData);
      stdin.setRawMode?.(false);
      stdin.pause();
      process.stdout.write('\n');
      resolve(value.trim());
    };
    const onData = (chunk) => {
      for (const c of chunk) {
        if (c === '\r' || c === '\n') return done();
        if (c === '\u0003') process.exit(130); // Ctrl+C
        if (c === '\u007f' || c === '\b') {
          if (value) {
            value = value.slice(0, -1);
            process.stdout.write('\b \b');
          }
          continue;
        }
        value += c;
        process.stdout.write(hidden ? '*' : c);
      }
    };
    stdin.on('data', onData);
  });
}

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const env = process.env;
const interactive = !(env.ADMIN_LOGIN && env.ADMIN_PASSWORD && env.GITHUB_TOKEN);

let token = env.GITHUB_TOKEN ?? '';
if (interactive && existsSync(AUTH_FILE)) {
  const keep = (await ask('Garder le jeton GitHub actuel (changement de mot de passe) ? [O/n]')).toLowerCase();
  if (keep !== 'n') {
    const vault = JSON.parse(readFileSync(AUTH_FILE, 'utf8'));
    const oldLogin = await ask('Login actuel :');
    const oldPassword = await ask('Mot de passe actuel :', { hidden: true });
    token = (await decryptToken(oldLogin, oldPassword, vault)) ?? fail('Login ou mot de passe actuel incorrect.');
  }
}

if (!token) {
  console.log(`\nJeton GitHub du dépôt ${GITHUB_REPO} (Contents en écriture).`);
  console.log(`Création (page pré-remplie, choisir "Only select repositories" → ce dépôt) :\n${TOKEN_CREATE_URL}\n`);
  token = await ask('Jeton GitHub :', { hidden: true });
}

process.stdout.write('Vérification du jeton… ');
await verifyToken(token).catch((err) => fail(err.message));
console.log('OK');

const login = env.ADMIN_LOGIN ?? (await ask('\nNouveau login :'));
if (!login) fail('Login vide.');

let password = env.ADMIN_PASSWORD;
if (!password) {
  password = await ask(`Nouveau mot de passe (${MIN_PASSWORD} caractères min.) :`, { hidden: true });
  if ((await ask('Confirmer le mot de passe :', { hidden: true })) !== password) fail('Les mots de passe ne correspondent pas.');
}
if (password.length < MIN_PASSWORD) fail(`Mot de passe trop court (${MIN_PASSWORD} caractères minimum) : le fichier chiffré est public.`);

writeFileSync(AUTH_FILE, `${JSON.stringify(await encryptToken(login, password, token), null, 2)}\n`);
console.log('\n✔ public/admin-auth.json écrit. Commite et pousse-le : le nouveau login marche après le déploiement (~1 min).');
