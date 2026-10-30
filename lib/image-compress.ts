// Browser image compression (refs ISSUE-09, spec section 9.1).
// Compress to a maximum of 1200 pixels on the longest edge, WebP format,
// with a 400 pixel thumbnail. Full resolution phone photos are never stored.
// No em dashes are used in this file.

export async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('Could not load image.')); img.src = url; });
    return img;
  } finally { URL.revokeObjectURL(url); }
}

export async function compressImage(file: File, maxEdge: number): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available.');
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (!blob) throw new Error('Image compression failed.');
  return { blob, width, height };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const result = String(reader.result || ''); resolve(result.includes(',') ? result.split(',')[1] : result); };
    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.readAsDataURL(blob);
  });
}
