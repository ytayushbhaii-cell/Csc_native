import JSZip from 'jszip';
import { Platform } from 'react-native';
import { readFileAsBase64, writeBase64File } from '@/lib/phase6/Phase6FileService';

function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}
export async function buildZipFromImages(images: { uri: string; fileName: string }[]): Promise<string> {
  const zip = new JSZip();
  for (const image of images) zip.file(image.fileName, base64ToBytes(await readFileAsBase64(image.uri)));
  if (Platform.OS === 'web') {
    const blob = await zip.generateAsync({ type: 'blob' });
    return URL.createObjectURL(blob);
  }
  return writeBase64File(await zip.generateAsync({ type: 'base64' }), `batch-resize-${Date.now()}.zip`);
}