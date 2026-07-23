/**
 * expo-image-picker — web shim using browser <input type="file">.
 *
 * Mirrors the exact Expo API surface used by this codebase including:
 *  - mediaTypes accepting string | string[]
 *  - ImagePickerAsset with mimeType
 *  - assets always non-null on success (null only when canceled)
 *  - exif option (ignored on web)
 */

export const MediaTypeOptions = {
  All:    'All',
  Videos: 'Videos',
  Images: 'Images',
} as const;

export const UIImagePickerPreferredAssetRepresentationMode = {
  Automatic:  'automatic',
  Compatible: 'compatible',
  Current:    'current',
} as const;

export enum PermissionStatus {
  UNDETERMINED = 'undetermined',
  GRANTED      = 'granted',
  DENIED       = 'denied',
}

export interface ImagePickerAsset {
  uri:       string;
  width:     number;
  height:    number;
  type?:     'image' | 'video' | 'livePhoto' | 'pairedVideo';
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  base64?:   string | null;
  exif?:     Record<string, any> | null;
}

export type ImagePickerResult =
  | { canceled: true; assets: null }
  | { canceled: false; assets: ImagePickerAsset[] };

// Action type used by document-scanner.tsx via ImageManipulator.Action
// (actually from expo-image-manipulator, but kept here to prevent circular imports)

export interface ImagePickerOptions {
  mediaTypes?:        string | string[];
  allowsEditing?:     boolean;
  aspect?:            [number, number];
  quality?:           number;
  base64?:            boolean;
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
  exif?:              boolean;
  preferredAssetRepresentationMode?: string;
}

function pickFileViaInput(accept: string, multiple: boolean): Promise<ImagePickerResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type     = 'file';
    input.accept   = accept;
    input.multiple = multiple;

    let settled = false;
    const settle = (result: ImagePickerResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (!files.length) { settle({ canceled: true, assets: null }); return; }
      const assets = await Promise.all(
        files.map(async (file): Promise<ImagePickerAsset> => ({
          uri:      URL.createObjectURL(file),
          width:    0,
          height:   0,
          type:     file.type.startsWith('video') ? 'video' : 'image',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
        })),
      );
      settle({ canceled: false, assets });
    };

    // Fallback for browsers that don't fire oncancel
    const onFocus = () => {
      window.removeEventListener('focus', onFocus);
      setTimeout(() => { if (!settled) settle({ canceled: true, assets: null }); }, 500);
    };
    window.addEventListener('focus', onFocus);
    input.click();
  });
}

function resolveAccept(mediaTypes: string | string[] | undefined): string {
  const types = Array.isArray(mediaTypes) ? mediaTypes : [mediaTypes ?? 'All'];
  if (types.some((t) => t === 'All' || t === MediaTypeOptions.All)) return 'image/*,video/*';
  if (types.some((t) => t === 'Videos' || t === MediaTypeOptions.Videos)) return 'video/*';
  return 'image/*';
}

export async function launchImageLibraryAsync(
  options: ImagePickerOptions = {},
): Promise<ImagePickerResult> {
  return pickFileViaInput(
    resolveAccept(options.mediaTypes),
    options.allowsMultipleSelection ?? false,
  );
}

export async function launchCameraAsync(
  _options: ImagePickerOptions = {},
): Promise<ImagePickerResult> {
  // Camera not available in web preview
  return { canceled: true, assets: null };
}

export async function requestMediaLibraryPermissionsAsync() {
  return { status: PermissionStatus.GRANTED, granted: true, canAskAgain: true };
}
export async function requestCameraPermissionsAsync() {
  return { status: PermissionStatus.GRANTED, granted: true, canAskAgain: true };
}
export const getMediaLibraryPermissionsAsync = requestMediaLibraryPermissionsAsync;
export const getCameraPermissionsAsync        = requestCameraPermissionsAsync;

export const useMediaLibraryPermissions = () =>
  [{ status: PermissionStatus.GRANTED, granted: true }, requestMediaLibraryPermissionsAsync] as const;
export const useCameraPermissions = () =>
  [{ status: PermissionStatus.GRANTED, granted: true }, requestCameraPermissionsAsync] as const;
