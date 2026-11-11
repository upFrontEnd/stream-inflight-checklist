// Jeton GitHub chiffré avec le login + mot de passe de l'admin (public/admin-auth.json).
// Le fichier est public : sans le bon couple login / mot de passe, il est illisible.
// PBKDF2-SHA256 (600 000 itérations, coûteux à tester en masse) + AES-GCM 256.
// WebCrypto uniquement : tourne dans le navigateur (admin) et dans Bun (script).

const ITERATIONS = 600_000;

function toBase64(bytes) {
  let binary = '';
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(text) {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

async function deriveKey(login, password, salt, iterations) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${login.trim().toLowerCase()}\n${password}`),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptToken(login, password, token) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(login, password, salt, ITERATIONS);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token));
  return { v: 1, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), data: toBase64(data) };
}

// Mauvais login ou mot de passe : AES-GCM refuse de déchiffrer → null.
export async function decryptToken(login, password, vault) {
  try {
    const key = await deriveKey(login, password, fromBase64(vault.salt), vault.iterations);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(vault.iv) }, key, fromBase64(vault.data));
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}
