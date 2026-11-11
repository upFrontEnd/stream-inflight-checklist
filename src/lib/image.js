// Compression des checklists dans le navigateur avant envoi (admin) :
// redimensionnée à IMAGE_MAX_WIDTH et convertie en WebP.
import { IMAGE_MAX_WIDTH, IMAGE_QUALITY } from '../settings.js';

export async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Compression impossible'))), 'image/webp', IMAGE_QUALITY),
  );
  return { blob, width, height };
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Empreinte courte du contenu : sert de suffixe au nom du fichier, pour qu'une
// image remplacée ait une nouvelle URL (pas d'ancienne version en cache dans OBS).
export async function shortHash(blob) {
  const digest = await crypto.subtle.digest('SHA-1', await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 8);
}

export function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} Ko` : `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
