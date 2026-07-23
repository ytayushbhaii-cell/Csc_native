/**
 * Reusable PDF export utility — embeds a PNG/JPG image into an A4 PDF page.
 * Used by QR Generator, Barcode Generator, Signature Maker, and Stamp tools.
 * Works identically on web (data: URI) and native (expo-file-system cache).
 */
import { PDFDocument } from 'pdf-lib';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

async function fetchImageBytes(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

/**
 * Embeds `imageUri` (PNG or JPG data-URI / file URI) centred on an A4 PDF page
 * and returns a URI to the resulting PDF (data: on web, file:// on native).
 */
export async function exportImageAsPdf(
  imageUri: string,
  fileName: string,
  caption?: string,
): Promise<string> {
  const bytes = await fetchImageBytes(imageUri);

  const pdfDoc = await PDFDocument.create();
  const isPng =
    imageUri.startsWith('data:image/png') ||
    imageUri.toLowerCase().endsWith('.png');

  const image = isPng
    ? await pdfDoc.embedPng(bytes)
    : await pdfDoc.embedJpg(bytes);

  const { width: imgW, height: imgH } = image.scale(1);

  const A4_W = 595.28;
  const A4_H = 841.89;
  const margin = 48;
  const maxW = A4_W - margin * 2;
  const maxH = A4_H - margin * 2;
  const scale = Math.min(maxW / imgW, maxH / imgH, 1);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  const page = pdfDoc.addPage([A4_W, A4_H]);
  page.drawImage(image, {
    x: (A4_W - drawW) / 2,
    y: (A4_H - drawH) / 2,
    width: drawW,
    height: drawH,
  });

  if (caption) {
    page.drawText(caption, {
      x: margin,
      y: margin / 2,
      size: 9,
    });
  }

  const pdfBytes = await pdfDoc.save();

  if (Platform.OS === 'web') {
    const base64 = bytesToBase64(pdfBytes);
    return `data:application/pdf;base64,${base64}`;
  }

  // Native — write to cache directory
  const dir =
    (FileSystem as any).cacheDirectory ??
    (FileSystem as any).documentDirectory;
  const fileUri = `${dir}${fileName.replace(/\.pdf$/i, '')}-${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(fileUri, bytesToBase64(pdfBytes), {
    encoding: 'base64' as const,
  });
  return fileUri;
}
