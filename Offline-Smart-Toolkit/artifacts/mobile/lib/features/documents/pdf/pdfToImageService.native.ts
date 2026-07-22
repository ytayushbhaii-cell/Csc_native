// PDF to Image service — native Android implementation using react-native-pdf-thumbnail.
// This file is ONLY bundled for native (Android) builds via Metro platform extensions.
// Web builds use pdfToImageService.web.ts (pdfjs-dist).
import PDFThumbnail from 'react-native-pdf-thumbnail';
import * as FileSystem from 'expo-file-system';
import type { PdfToImageResult } from '../types';

/**
 * Convert a data: URI or local file URI to a local file path for PDFThumbnail.
 * PDFThumbnail requires a file:// path on Android.
 */
async function ensureLocalFile(uri: string): Promise<string> {
  if (uri.startsWith('data:')) {
    const base64 = uri.split(',')[1];
    const dir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? '';
    const tempPath = `${dir}pdf-render-${Date.now()}.pdf`;
    await FileSystem.writeAsStringAsync(tempPath, base64, { encoding: 'base64' as const });
    return tempPath;
  }
  return uri;
}

/**
 * Convert PDF pages to images using Android's native PdfRenderer (via react-native-pdf-thumbnail).
 * Works 100% offline — no network requests.
 *
 * @param uri          Local file URI or data: URI of the PDF
 * @param pageIndices  0-based page indices to convert; undefined = all pages
 * @param format       Output format (jpeg or png) — note: pdf-thumbnail always returns JPEG on Android
 * @param scale        Scale factor (not directly supported by pdf-thumbnail; kept for API compat)
 */
export async function pdfPageToImages(
  uri: string,
  pageIndices?: number[],
  _format: 'jpeg' | 'png' = 'jpeg',
  _scale = 2.0
): Promise<PdfToImageResult[]> {
  const localPath = await ensureLocalFile(uri);
  const results: PdfToImageResult[] = [];

  if (pageIndices && pageIndices.length > 0) {
    // Render specific pages
    for (const idx of pageIndices) {
      try {
        const thumb = await PDFThumbnail.generate(localPath, idx);
        results.push({
          pageNumber: idx + 1,
          uri: thumb.uri,
          width: thumb.width,
          height: thumb.height,
          isStub: false,
        });
      } catch {
        // Skip pages that fail (e.g., out of range)
        break;
      }
    }
  } else {
    // Render all pages: iterate until PDFThumbnail throws (no more pages)
    let pageIdx = 0;
    while (true) {
      try {
        const thumb = await PDFThumbnail.generate(localPath, pageIdx);
        results.push({
          pageNumber: pageIdx + 1,
          uri: thumb.uri,
          width: thumb.width,
          height: thumb.height,
          isStub: false,
        });
        pageIdx++;
        // Safety cap — no PDF should realistically have >500 pages
        if (pageIdx >= 500) break;
      } catch {
        break; // No more pages
      }
    }
  }

  if (results.length === 0) {
    return [
      {
        pageNumber: 1,
        uri: '',
        width: 0,
        height: 0,
        isStub: true,
        stubMessage: 'PDF rendering failed. Make sure react-native-pdf-thumbnail is linked in the Android build.',
      },
    ];
  }

  return results;
}
