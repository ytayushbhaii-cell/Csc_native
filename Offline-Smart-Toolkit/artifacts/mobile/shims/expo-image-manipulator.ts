/**
 * expo-image-manipulator — native shim.
 *
 * Replaces the Expo-managed version with a pure React Native CLI implementation.
 * Uses @react-native-community/image-editor for crop and resize.
 * Uses react-native-image-resizer for rotate and flip (if available).
 * Falls back gracefully when native modules aren't linked yet.
 *
 * Exports Action, ImageResult, ManipulationResult, SaveFormat, FlipType —
 * the full type surface used by this codebase.
 */
import RNFS from 'react-native-fs';

// ── Public types (match expo-image-manipulator exactly) ───────────────────────
export const SaveFormat = {
  JPEG: 'jpeg',
  PNG:  'png',
  WEBP: 'webp',
} as const;
export type SaveFormat = (typeof SaveFormat)[keyof typeof SaveFormat];

export const FlipType = {
  Vertical:   'vertical',
  Horizontal: 'horizontal',
} as const;
export type FlipType = (typeof FlipType)[keyof typeof FlipType];

export type ResizeAction  = { resize:  { width?: number; height?: number } };
export type CropAction    = { crop:    { originX: number; originY: number; width: number; height: number } };
export type RotateAction  = { rotate:  number };
export type FlipAction    = { flip:    FlipType };
export type Action = ResizeAction | CropAction | RotateAction | FlipAction;

export interface ImageResult {
  uri:     string;
  width:   number;
  height:  number;
  base64?: string;
}
export type ManipulationResult = ImageResult;

export interface SaveOptions {
  compress?: number;
  format?:   SaveFormat;
  base64?:   boolean;
}

// ── Lazy module loaders ───────────────────────────────────────────────────────
let _ImageEditor: any = null;
function getImageEditor() {
  if (_ImageEditor !== undefined) return _ImageEditor;
  try {
    const mod = require('@react-native-community/image-editor');
    _ImageEditor = mod.default ?? mod.ImageEditor ?? mod;
  } catch { _ImageEditor = null; }
  return _ImageEditor;
}

let _ImageResizer: any = null;
function getImageResizer() {
  if (_ImageResizer !== undefined) return _ImageResizer;
  try {
    const mod = require('react-native-image-resizer');
    _ImageResizer = mod.default ?? mod;
  } catch { _ImageResizer = null; }
  return _ImageResizer;
}

// ── Crop / resize via ImageEditor ─────────────────────────────────────────────
async function applyCrop(
  uri: string,
  crop: { originX: number; originY: number; width: number; height: number },
): Promise<ImageResult> {
  const ImageEditor = getImageEditor();
  if (!ImageEditor?.cropImage) return { uri, width: Math.round(crop.width), height: Math.round(crop.height) };

  const result = await ImageEditor.cropImage(uri, {
    offset: { x: Math.round(crop.originX), y: Math.round(crop.originY) },
    size:   { width: Math.round(crop.width), height: Math.round(crop.height) },
  });
  if (typeof result === 'string') return { uri: result, width: Math.round(crop.width), height: Math.round(crop.height) };
  return { uri: result.uri, width: result.width ?? Math.round(crop.width), height: result.height ?? Math.round(crop.height) };
}

async function applyResize(
  uri: string,
  resize: { width?: number; height?: number },
  srcW: number,
  srcH: number,
): Promise<ImageResult> {
  const newW = Math.max(1, Math.round(resize.width  ?? (resize.height! / srcH) * srcW));
  const newH = Math.max(1, Math.round(resize.height ?? (resize.width!  / srcW) * srcH));

  const ImageEditor = getImageEditor();
  if (!ImageEditor?.cropImage) return { uri, width: newW, height: newH };

  const result = await ImageEditor.cropImage(uri, {
    offset:      { x: 0, y: 0 },
    size:        { width: srcW || newW, height: srcH || newH },
    displaySize: { width: newW, height: newH },
  });
  if (typeof result === 'string') return { uri: result, width: newW, height: newH };
  return { uri: result.uri, width: result.width ?? newW, height: result.height ?? newH };
}

async function applyRotate(
  uri: string,
  degrees: number,
  saveOptions: SaveOptions,
): Promise<ImageResult> {
  const ImageResizer = getImageResizer();
  if (!ImageResizer?.createResizedImage) {
    console.warn('[expo-image-manipulator shim] react-native-image-resizer not linked — rotate skipped');
    return { uri, width: 0, height: 0 };
  }
  const format = saveOptions.format === SaveFormat.PNG ? 'PNG' : 'JPEG';
  const quality = Math.round((saveOptions.compress ?? 0.92) * 100);
  const result = await ImageResizer.createResizedImage(
    uri, 0, 0, format, quality, degrees,
  );
  return { uri: result.uri, width: result.width ?? 0, height: result.height ?? 0 };
}

async function applyFlip(
  uri: string,
  flip: FlipType,
  saveOptions: SaveOptions,
): Promise<ImageResult> {
  const ImageResizer = getImageResizer();
  if (!ImageResizer?.createResizedImage) {
    console.warn('[expo-image-manipulator shim] react-native-image-resizer not linked — flip skipped');
    return { uri, width: 0, height: 0 };
  }
  const format  = saveOptions.format === SaveFormat.PNG ? 'PNG' : 'JPEG';
  const quality = Math.round((saveOptions.compress ?? 0.92) * 100);
  const flipMode = flip === FlipType.Horizontal ? 'horizontal' : 'vertical';
  const result = await ImageResizer.createResizedImage(
    uri, 0, 0, format, quality, 0, undefined, false, { mode: 'stretch', onlyScaleDown: false },
    { [flipMode]: true },
  );
  return { uri: result.uri, width: result.width ?? 0, height: result.height ?? 0 };
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function manipulateAsync(
  uri: string,
  actions: Action[] = [],
  saveOptions: SaveOptions = {},
): Promise<ImageResult> {
  let current: ImageResult = { uri, width: 0, height: 0 };

  for (const action of actions) {
    if ('resize' in action) {
      current = await applyResize(current.uri, action.resize, current.width || 1024, current.height || 1024);
    } else if ('crop' in action) {
      current = await applyCrop(current.uri, action.crop);
    } else if ('rotate' in action) {
      current = await applyRotate(current.uri, action.rotate, saveOptions);
    } else if ('flip' in action) {
      current = await applyFlip(current.uri, action.flip, saveOptions);
    }
  }

  if (saveOptions.base64 && current.uri && !current.uri.startsWith('data:')) {
    try {
      const b64 = await RNFS.readFile(current.uri.replace(/^file:\/\//, ''), 'base64');
      current.base64 = b64;
    } catch { /* best-effort */ }
  }

  return current;
}

export default { manipulateAsync, SaveFormat, FlipType };
