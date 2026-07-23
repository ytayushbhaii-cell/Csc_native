// ─── ID Card Export Service ───────────────────────────────────────────────────
// Handles PNG / JPG / PDF export from a captured ViewShot image URI.
// Uses pdf-lib for PDF generation (same as the rest of the app).
// 100% offline — no network calls.
//
// Native patterns match the rest of the project (see lib/photoTools/exportUtils.ts,
// lib/photoTools/pdfUtils.ts):
//   • native file I/O and sharing use the React Native CLI Phase 6 service
//   • Uint8Array → base64 via uint8ToBase64() (no Buffer)

import { Platform } from 'react-native';
import type { ExportFormat } from './types';
import {
  readFileAsBase64,
  writeBase64File,
  saveFile,
  shareFiles,
} from '@/lib/phase6/Phase6FileService';
import { addPhase6History } from '@/lib/phase6/Phase6History';
import { getDefaultFolder } from '@/lib/features/settings/SettingsService';

/** Standard ID card dimensions in points (85.6mm × 54mm @ 96dpi) */
const CARD_W_PT = 242.8;  // 85.6mm in pts
const CARD_H_PT = 153.1;  // 54mm in pts

// ── Pure-JS helpers (cross-platform) ──────────────────────────────────────────

/** Convert Uint8Array to base64 without Buffer (works on web + native). */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ── Web helpers ───────────────────────────────────────────────────────────────

async function downloadOnWeb(dataUrl: string, filename: string): Promise<void> {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const base64 = dataUrl.split(',')[1];
  const binStr = atob(base64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return bytes;
}

// ── Export functions ──────────────────────────────────────────────────────────

/**
 * Export a single captured image URI to PNG/JPG/PDF.
 * @param capturedUri  Data-URL (web) or file:// URI (native) from ViewShot
 * @param format       'png' | 'jpg' | 'pdf'
 * @param filename     Base name without extension
 */
export async function exportIDCard(
  capturedUri: string,
  format: ExportFormat,
  filename: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    return exportWeb(capturedUri, format, filename);
  }
  return exportNative(capturedUri, format, filename);
}

async function exportWeb(
  dataUrl: string,
  format: ExportFormat,
  filename: string,
): Promise<string> {
  if (format === 'pdf') {
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();

    const imgBytes = await dataUrlToBytes(dataUrl);
    const page = pdfDoc.addPage([CARD_W_PT + 40, CARD_H_PT + 40]);

    let img;
    if (dataUrl.startsWith('data:image/png')) {
      img = await pdfDoc.embedPng(imgBytes);
    } else {
      img = await pdfDoc.embedJpg(imgBytes);
    }
    page.drawImage(img, { x: 20, y: 20, width: CARD_W_PT, height: CARD_H_PT });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    await addPhase6History({ kind: 'download', action: 'id-card-pdf', fileName: `${filename}.pdf`, uri: url, mimeType: 'application/pdf' });
    return url;
  }

  if (format === 'jpg') {
    // Convert PNG data-URL to JPEG via canvas
    const canvas = document.createElement('canvas');
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
      img.src = dataUrl;
    });
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const jpgUrl = canvas.toDataURL('image/jpeg', 0.92);
    await downloadOnWeb(jpgUrl, `${filename}.jpg`);
    await addPhase6History({ kind: 'download', action: 'id-card-jpg', fileName: `${filename}.jpg`, uri: jpgUrl, mimeType: 'image/jpeg' });
    return jpgUrl;
  }

  // PNG
  await downloadOnWeb(dataUrl, `${filename}.png`);
  await addPhase6History({ kind: 'download', action: 'id-card-png', fileName: `${filename}.png`, uri: dataUrl, mimeType: 'image/png' });
  return dataUrl;
}

async function exportNative(
  fileUri: string,
  format: ExportFormat,
  filename: string,
): Promise<string> {
  if (format === 'pdf') {
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();

    const b64 = await readFileAsBase64(fileUri);
    const imgBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const page = pdfDoc.addPage([CARD_W_PT + 40, CARD_H_PT + 40]);
    const img = await pdfDoc.embedPng(imgBytes);
    page.drawImage(img, { x: 20, y: 20, width: CARD_W_PT, height: CARD_H_PT });

    const pdfBytes = await pdfDoc.save();
    const outPath = await writeBase64File(uint8ToBase64(pdfBytes), `${filename}.pdf`);
    const saved = await saveFile(outPath, `${filename}.pdf`, await getDefaultFolder());
    await shareFiles([saved.uri], [`${filename}.pdf`]);
    await addPhase6History({
      kind: 'export',
      action: 'id-card-pdf',
      fileName: `${filename}.pdf`,
      uri: saved.uri,
      mimeType: 'application/pdf',
    });
    return saved.uri;
  }

  if (format === 'jpg') {
    const outPath = await writeBase64File(await readFileAsBase64(fileUri), `${filename}.jpg`);
    const saved = await saveFile(outPath, `${filename}.jpg`, await getDefaultFolder());
    await shareFiles([saved.uri], [`${filename}.jpg`]);
    await addPhase6History({
      kind: 'export',
      action: 'id-card-jpg',
      fileName: `${filename}.jpg`,
      uri: saved.uri,
      mimeType: 'image/jpeg',
    });
    return saved.uri;
  }

  const outPath = await writeBase64File(await readFileAsBase64(fileUri), `${filename}.png`);
  const saved = await saveFile(outPath, `${filename}.png`, await getDefaultFolder());
  await shareFiles([saved.uri], [`${filename}.png`]);
  await addPhase6History({
    kind: 'export',
    action: 'id-card-png',
    fileName: `${filename}.png`,
    uri: saved.uri,
    mimeType: 'image/png',
  });
  return saved.uri;
}

/**
 * Export multiple cards arranged on A4 sheets as PDF.
 * capturedUris: array of data-URLs (web) or file:// URIs (native)
 */
export async function exportMultipleIDCards(
  capturedUris: string[],
  perSheet: 1 | 2 | 4 | 6,
  filename: string,
): Promise<void> {
  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  // A4 in pts: 595 × 842
  const A4_W = 595, A4_H = 842;
  const margin = 20;
  const gutter = 8;

  let cols = 1, rows = 1;
  if (perSheet === 2) { cols = 1; rows = 2; }
  else if (perSheet === 4) { cols = 2; rows = 2; }
  else if (perSheet === 6) { cols = 2; rows = 3; }

  const cardW = (A4_W - margin * 2 - gutter * (cols - 1)) / cols;
  const cardH = (A4_H - margin * 2 - gutter * (rows - 1)) / rows;

  const pages = Math.ceil(capturedUris.length / perSheet);

  if (Platform.OS === 'web') {
    for (let p = 0; p < pages; p++) {
      const page = pdfDoc.addPage([A4_W, A4_H]);
      for (let i = 0; i < perSheet; i++) {
        const uri = capturedUris[p * perSheet + i];
        if (!uri) break;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + col * (cardW + gutter);
        const y = A4_H - margin - (row + 1) * cardH - row * gutter;
        const imgBytes = await dataUrlToBytes(uri);
        let img;
        try {
          img = await pdfDoc.embedPng(imgBytes);
        } catch {
          img = await pdfDoc.embedJpg(imgBytes);
        }
        page.drawImage(img, { x, y, width: cardW, height: cardH });
      }
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    await addPhase6History({ kind: 'download', action: 'id-card-multiple-pdf', fileName: `${filename}.pdf`, uri: url, mimeType: 'application/pdf', metadata: { count: capturedUris.length, perSheet } });
  } else {
    for (let p = 0; p < pages; p++) {
      const page = pdfDoc.addPage([A4_W, A4_H]);
      for (let i = 0; i < perSheet; i++) {
        const uri = capturedUris[p * perSheet + i];
        if (!uri) break;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + col * (cardW + gutter);
        const y = A4_H - margin - (row + 1) * cardH - row * gutter;
        const b64 = await readFileAsBase64(uri);
        const imgBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        let img;
        try {
          img = await pdfDoc.embedPng(imgBytes);
        } catch {
          img = await pdfDoc.embedJpg(imgBytes);
        }
        page.drawImage(img, { x, y, width: cardW, height: cardH });
      }
    }
    const pdfBytes = await pdfDoc.save();
    const outPath = await writeBase64File(uint8ToBase64(pdfBytes), `${filename}.pdf`);
    const saved = await saveFile(outPath, `${filename}.pdf`, await getDefaultFolder());
    await shareFiles([saved.uri], [`${filename}.pdf`]);
    await addPhase6History({
      kind: 'export',
      action: 'id-card-multiple-pdf',
      fileName: `${filename}.pdf`,
      uri: saved.uri,
      mimeType: 'application/pdf',
      metadata: { count: capturedUris.length, perSheet },
    });
  }
}
