import { Platform } from 'react-native';
import { fromByteArray } from 'base64-js';
import { addPhase6History } from '@/lib/phase6/Phase6History';
// @ts-ignore - upng-js has no types
import UPNG from 'upng-js';

function dataUri(base64: string, mime: string): string {
  return `data:${mime};base64,${base64}`;
}
export async function writePngFromRGBA(rgba: Uint8ClampedArray, width: number, height: number): Promise<string> {
  return dataUri(fromByteArray(new Uint8Array(UPNG.encode([rgba.buffer], width, height, 0))), 'image/png');
}
export async function writeBase64Image(base64: string, ext: 'png' | 'jpg' | 'webp' = 'png'): Promise<string> {
  return dataUri(base64, ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');
}
export async function convertToWebP(uri: string, quality = 0.88): Promise<{ uri: string; ext: 'webp' | 'jpg' }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/webp', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image for WEBP conversion'));
    img.src = uri;
  });
  return { uri: dataUrl, ext: 'webp' };
}
export function guessFileName(prefix: string, ext: string): string { return `${prefix}-${Date.now()}.${ext}`; }

export async function convertToJPG(
  uri: string,
  quality = 0.92,
): Promise<{ uri: string; ext: 'jpg' }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image for JPEG conversion'));
    img.src = uri;
  });
  return { uri: dataUrl, ext: 'jpg' };
}

export async function convertToFormat(
  uri: string,
  format: 'png' | 'jpg' | 'webp',
  quality = 0.92,
): Promise<{ uri: string; ext: 'png' | 'jpg' | 'webp' }> {
  if (format === 'jpg')  return convertToJPG(uri, quality);
  if (format === 'webp') return convertToWebP(uri, quality);
  return { uri, ext: 'png' };
}
export async function exportFile(uri: string, fileName: string): Promise<void> {
  const { saveFile } = await import('@/lib/phase6/Phase6FileService');
  await saveFile(uri, fileName, 'downloads');
  await addPhase6History({ kind: 'download', action: 'download', fileName, uri, mimeType: 'application/octet-stream' });
}
export async function saveToGallery(_uri: string): Promise<boolean> { return false; }
export async function readFileSize(uri: string): Promise<number | undefined> {
  try { return (await (await fetch(uri)).blob()).size; } catch { return undefined; }
}