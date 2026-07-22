// OCR service – 100% offline, no API.
// Web: Tesseract.js v7 (dynamically imported to avoid native Metro crash)
// Native: ML Kit / react-native-tesseract-ocr architecture stub with
//         detailed implementation guidance.
import { Platform } from 'react-native';
import type { OcrResult } from '../types';

/**
 * Run OCR on an image URI.
 * - Web: Tesseract.js v7 — real text extraction from images
 * - Native: returns architecture stub (requires native module)
 *
 * Supported languages: eng, hin, eng+hin, guj, tam, tel, mar, ben
 */
export async function runOcr(imageUri: string, language = 'eng'): Promise<OcrResult> {
  if (Platform.OS === 'web') {
    try {
      // Dynamic import prevents Metro from bundling tesseract.js for native
      const { createWorker } = await import('tesseract.js' as any);
      const worker = await createWorker(language, 1, {
        logger: () => {}, // silence progress logs
      });
      const { data } = await worker.recognize(imageUri);
      await worker.terminate();
      return {
        text: data.text ?? '',
        confidence: (data.confidence ?? 0) / 100,
        engine: 'tesseract',
      };
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error';
      return {
        text: `[OCR Error] ${msg}\n\nMake sure tesseract.js is installed:\npnpm add tesseract.js`,
        confidence: 0,
        engine: 'stub',
      };
    }
  }

  // ── Native path ────────────────────────────────────────────────────────────
  // Full native OCR requires one of:
  //   • react-native-tesseract-ocr (Tesseract 4.x LSTM)
  //   • @react-native-ml-kit/text-recognition (Google ML Kit, offline-capable)
  //   • @react-native-google-mlkit/text-recognition
  //
  // Implementation steps:
  //   1. Install: npm install react-native-tesseract-ocr
  //               OR npm install @react-native-ml-kit/text-recognition
  //   2. Link native modules: npx react-native link (auto-linked in RN 0.60+)
  //   3. For Tesseract: download trained data files for language packs:
  //      https://github.com/tesseract-ocr/tessdata (place in android/app/src/main/assets/tessdata/)
  //   4. Replace this stub with the actual native OCR call.
  //
  // Example (react-native-tesseract-ocr):
  //   import TesseractOcr from 'react-native-tesseract-ocr';
  //   const text = await TesseractOcr.recognize(imageUri, 'LANG_ENGLISH');
  //   return { text, confidence: 1, engine: 'tesseract' };
  //
  // Example (ML Kit):
  //   import TextRecognition from '@react-native-ml-kit/text-recognition';
  //   const result = await TextRecognition.recognize(imageUri);
  //   return { text: result.text, confidence: 1, engine: 'tesseract' };

  return {
    text:
      '📱 Native OCR Setup Required\n\n' +
      'To enable fully offline OCR on Android, install one of:\n\n' +
      '• react-native-tesseract-ocr\n' +
      '  Supports: ' + language + ' + 100+ languages\n' +
      '  Open source, Tesseract 4.x LSTM engine\n\n' +
      '• @react-native-ml-kit/text-recognition\n' +
      '  Google ML Kit — fast, accurate, offline\n' +
      '  Supports: Hindi, English, and 12+ Indian languages\n\n' +
      'Web preview provides full OCR functionality.\n' +
      'Selected language: ' + language,
    confidence: 0,
    engine: 'stub',
  };
}

/**
 * AI-Ready architecture stubs for MediaPipe / OpenCV document processing.
 * These are ready-to-implement integration points.
 */
export const AI_FEATURES = {
  autoEdgeDetection:     'MediaPipe Document Detection — ready for integration',
  autoCrop:              'MediaPipe Selfie Segmentation + Document Crop — ready',
  perspectiveCorrection: 'OpenCV warpPerspective — ready for WASM integration',
  shadowRemoval:         'Custom CNN / guided filter — see lib/ai/processors/',
  noiseReduction:        'Bilateral filter via WASM OpenCV — ready for integration',
  smartAlignment:        'Hough transform via OpenCV WASM — ready for integration',
  autoCenter:            'Face/document detection centroid — see lib/ai/services/',
  hdExport:              'ESRGAN super-resolution — ONNX model slot available',
  faceDetection:         'MediaPipe FaceMesh — ready for integration',
  documentDetection:     'MediaPipe Document Detection — ready for integration',
};
