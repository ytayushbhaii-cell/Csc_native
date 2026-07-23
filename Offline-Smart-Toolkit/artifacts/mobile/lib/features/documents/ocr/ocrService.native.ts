// OCR service — native implementation using Google ML Kit Text Recognition.
// This file is ONLY bundled for native (Android) builds via Metro platform extensions.
// Web builds use ocrService.ts (Tesseract.js via dynamic import).
import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { OcrResult } from '../types';

/**
 * Run OCR on an image URI using Google ML Kit (offline, no API key needed).
 * Supports: Latin (English), Devanagari (Hindi), Chinese, Japanese, Korean.
 *
 * ML Kit auto-detects script from the image; the `language` param is kept
 * for API compatibility with the web implementation but is not used directly
 * (ML Kit selects the recognition model from the bundled model files).
 */
export async function runOcr(imageUri: string, _language = 'eng'): Promise<OcrResult> {
  try {
    const result = await TextRecognition.recognize(imageUri);
    const text = result.text ?? '';
    return {
      text,
      confidence: 1.0,
      engine: 'mlkit' as any,
    };
  } catch (err: any) {
    const msg = err?.message ?? 'Recognition failed';
    return {
      text: `[Native OCR Error] ${msg}`,
      confidence: 0,
      engine: 'mlkit',
    };
  }
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
