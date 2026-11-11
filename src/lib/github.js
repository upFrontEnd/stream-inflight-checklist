// Lecture / écriture des checklists dans le dépôt GitHub, depuis l'admin.
// Chaque modification = un seul commit (image + checklists.json ensemble), ce qui
// déclenche un seul redéploiement GitHub Pages.
//
// Jeton GitHub "fine-grained" limité à ce dépôt (Contents en écriture), collé une
// fois dans l'admin. Il reste dans ce navigateur (localStorage), jamais dans le site.
import { GITHUB_REPO, GITHUB_BRANCH, DATA_FILE } from '../settings.js';

const TOKEN_KEY = 'stream-checklist-github-token';

export const TOKEN_CREATE_URL =
  'https://github.com/settings/personal-access-tokens/new?' +
  new URLSearchParams({
    name: 'Admin checklists',
    description: 'Gérer les checklists depuis l\'admin stream-inflight-checklist',
    target_name: GITHUB_REPO.split('/')[0],
    expires_in: '366', // maximum hors "jamais" : à recréer une fois par an
    contents: 'write',
  });

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // stockage indisponible (navigation privée...) : le jeton ne sera pas mémorisé
  }
}

const ERROR_BY_STATUS = {
  401: 'Jeton GitHub invalide ou expiré : reconnecte-toi avec un nouveau jeton.',
  403: 'Jeton GitHub sans les bonnes permissions (Contents en écriture sur ce dépôt).',
  404: 'Dépôt introuvable avec ce jeton : vérifie qu\'il donne accès à ce dépôt.',
  409: 'Les checklists ont changé entre-temps : recharge la page et recommence.',
  422: 'Les checklists ont changé entre-temps : recharge la page et recommence.',
};

async function github(path, { token = getToken(), ...init } = {}) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok) {
    const error = new Error(ERROR_BY_STATUS[res.status] ?? `GitHub a répondu ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.status === 204 ? null : res.json();
}

// atob/btoa ne gèrent pas l'UTF-8 (accents) sans passer par des octets.
function decodeBase64Utf8(base64) {
  const binary = atob(base64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

// Vérifie le jeton (accès au dépôt + droit d'écriture) avant de l'enregistrer.
export async function verifyToken(token) {
  const repo = await github('', { token });
  if (!repo.permissions?.push) throw new Error(ERROR_BY_STATUS[403]);
}

async function readDataAt(ref) {
  const file = await github(`/contents/${DATA_FILE}?ref=${ref}`).catch((err) => {
    if (err.status === 404) throw new Error(`${DATA_FILE} absent du dépôt : pousse d'abord le projet (git push).`);
    throw err;
  });
  return JSON.parse(decodeBase64Utf8(file.content));
}

export async function readData() {
  return readDataAt(GITHUB_BRANCH);
}

// Relit toujours la dernière version avant d'écrire. `mutate(data)` modifie la liste
// et renvoie les fichiers à ajouter ({ path, base64 }) et à supprimer (chemins).
// Si quelqu'un a commité entre-temps, la mise à jour de la branche échoue (422)
// au lieu d'écraser son travail.
export async function commitData(mutate, message) {
  const ref = await github(`/git/ref/heads/${GITHUB_BRANCH}`);
  const headSha = ref.object.sha;
  const data = await readDataAt(headSha);
  const { add = [], remove = [] } = (await mutate(data)) ?? {};

  const tree = [];
  for (const file of add) {
    const blob = await github('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: file.base64, encoding: 'base64' }),
    });
    tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  for (const path of remove) tree.push({ path, mode: '100644', type: 'blob', sha: null });
  tree.push({ path: DATA_FILE, mode: '100644', type: 'blob', content: `${JSON.stringify(data, null, 2)}\n` });

  const head = await github(`/git/commits/${headSha}`);
  const newTree = await github('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: head.tree.sha, tree }),
  });
  const commit = await github('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }),
  });
  await github(`/git/refs/heads/${GITHUB_BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });
  return data;
}

// Aperçu immédiat d'une image commitée, sans attendre le redéploiement du site.
export function rawUrl(path) {
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/public/${path}`;
}
