/**
 * Offline PDF export utility for QR, barcode, signature and stamp tools.
 * Native file I/O is handled by React Native CLI's filesystem service.
 */
import { PDFDocument } from 'pdf-lib';
import { Platform } from 'react-native';
import { readFileAsBase64, writeBase64File } from '@/lib/phase6/Phase6FileService';

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
async function fetchImageBytes(uri: string): Promise<Uint8Array> {
  return base64ToBytes(await readFileAsBase64(uri));
}
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function exportImageAsPdf(imageUri: string, fileName: string, caption?: string): Promise<string> {
  const bytes = await fetchImageBytes(imageUri);
  const pdfDoc = await PDFDocument.create();
  const isPng = imageUri.startsWith('data:image/png') || imageUri.toLowerCase().includes('.png');
  const image = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
  const A4_W = 595.28;
  const A4_H = 841.89;
  const margin = 48;
  const scale = Math.min((A4_W - margin * 2) / image.width, (A4_H - margin * 2) / image.height, 1);
  const width = image.width * scale;
  const height = image.height * scale;
  const page = pdfDoc.addPage([A4_W, A4_H]);
  page.drawImage(image, { x: (A4_W - width) / 2, y: (A4_H - height) / 2, width, height });
  if (caption) page.drawText(caption, { x: margin, y: margin / 2, size: 9 });
  const output = bytesToBase64(await pdfDoc.save());
  if (Platform.OS === 'web') return `data:application/pdf;base64,${output}`;
  return writeBase64File(output, `${fileName.replace(/\.pdf$/i, '')}-${Date.now()}.pdf`);
}