/**
 * expo-image-manipulator — web shim using Canvas API.
 *
 * Provides the same API surface as expo-image-manipulator so screens that
 * import { manipulateAsync, SaveFormat, FlipType, Action, ImageResult }
 * work in the webpack web bundle without any native Expo modules.
 */

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

// ── Action types (matching expo-image-manipulator's public API) ───────────────
export type ResizeAction  = { resize:  { width?: number; height?: number } };
export type CropAction    = { crop:    { originX: number; originY: number; width: number; height: number } };
export type RotateAction  = { rotate:  number };
export type FlipAction    = { flip:    FlipType };
export type Action = ResizeAction | CropAction | RotateAction | FlipAction;

// ── Result type (matching expo-image-manipulator's ImageResult) ───────────────
export interface ImageResult {
  uri:     string;
  width:   number;
  height:  number;
  base64?: string;
}
// Alias used in some codebases
export type ManipulationResult = ImageResult;

// ── Save options ──────────────────────────────────────────────────────────────
export interface SaveOptions {
  compress?: number;
  format?:   SaveFormat;
  base64?:   boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadHTMLImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new (window as any).Image() as HTMLImageElement;
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${uri.slice(0, 80)}`));
    img.src = uri;
  });
}

function toDataURL(canvas: HTMLCanvasElement, fmt: SaveFormat, quality: number): string {
  const mime: Record<string, string> = {
    jpeg: 'image/jpeg',
    jpg:  'image/jpeg',
    png:  'image/png',
    webp: 'image/webp',
  };
  return canvas.toDataURL(mime[fmt] ?? 'image/jpeg', quality);
}

// ── Main function ─────────────────────────────────────────────────────────────
export async function manipulateAsync(
  uri: string,
  actions: Action[] = [],
  saveOptions: SaveOptions = {},
): Promise<ImageResult> {
  const img = await loadHTMLImage(uri);

  let canvas = document.createElement('canvas');
  canvas.width  = img.naturalWidth  || img.width;
  canvas.height = img.naturalHeight || img.height;
  let ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  for (const action of actions) {
    if ('resize' in action) {
      const { width, height } = action.resize;
      const srcW = canvas.width;
      const srcH = canvas.height;
      const newW = width  ?? Math.round((height! / srcH) * srcW);
      const newH = height ?? Math.round((width!  / srcW) * srcH);
      const c2 = document.createElement('canvas');
      c2.width  = Math.max(1, newW);
      c2.height = Math.max(1, newH);
      c2.getContext('2d')!.drawImage(canvas, 0, 0, c2.width, c2.height);
      canvas = c2; ctx = c2.getContext('2d')!;
    } else if ('crop' in action) {
      const { originX, originY, width, height } = action.crop;
      const c2 = document.createElement('canvas');
      c2.width  = Math.max(1, Math.round(width));
      c2.height = Math.max(1, Math.round(height));
      c2.getContext('2d')!.drawImage(
        canvas,
        Math.round(originX), Math.round(originY),
        Math.round(width),   Math.round(height),
        0, 0, c2.width, c2.height,
      );
      canvas = c2; ctx = c2.getContext('2d')!;
    } else if ('rotate' in action) {
      const deg = action.rotate;
      const rad = (deg * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const newW = Math.round(canvas.width * cos + canvas.height * sin);
      const newH = Math.round(canvas.width * sin + canvas.height * cos);
      const c2 = document.createElement('canvas');
      c2.width  = newW; c2.height = newH;
      const c2ctx = c2.getContext('2d')!;
      c2ctx.translate(newW / 2, newH / 2);
      c2ctx.rotate(rad);
      c2ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      canvas = c2; ctx = c2ctx;
    } else if ('flip' in action) {
      const c2 = document.createElement('canvas');
      c2.width  = canvas.width; c2.height = canvas.height;
      const c2ctx = c2.getContext('2d')!;
      if (action.flip === FlipType.Horizontal) {
        c2ctx.translate(canvas.width, 0);
        c2ctx.scale(-1, 1);
      } else {
        c2ctx.translate(0, canvas.height);
        c2ctx.scale(1, -1);
      }
      c2ctx.drawImage(canvas, 0, 0);
      canvas = c2; ctx = c2ctx;
    }
  }

  const format  = saveOptions.format   ?? SaveFormat.JPEG;
  const quality = saveOptions.compress ?? 0.92;
  const dataURL = toDataURL(canvas, format, quality);

  const result: ImageResult = {
    uri:    dataURL,
    width:  canvas.width,
    height: canvas.height,
  };
  if (saveOptions.base64) {
    result.base64 = dataURL.split(',')[1] ?? '';
  }
  return result;
}

export default { manipulateAsync, SaveFormat, FlipType };
