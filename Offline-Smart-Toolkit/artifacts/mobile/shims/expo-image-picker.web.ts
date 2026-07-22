/**
 * expo-image-picker web shim — browser <input type="file"> implementation.
 *
 * The real expo-image-picker pulls in expo-modules-core/src TypeScript declarations
 * that crash webpack on web. This stub provides the same API surface using the
 * standard browser File API so web preview screens can render normally.
 *
 * Actual image picking works; permissions are always granted on web.
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

interface ImagePickerOptions {
  mediaTypes?:     string;
  allowsEditing?:  boolean;
  aspect?:         [number, number];
  quality?:        number;
  base64?:         boolean;
  allowsMultipleSelection?: boolean;
}

interface ImagePickerAsset {
  uri:      string;
  width:    number;
  height:   number;
  type?:    string;
  fileName?: string;
  fileSize?: number;
  base64?:  string | null;
}

interface ImagePickerResult {
  canceled:  boolean;
  assets:    ImagePickerAsset[] | null;
}

function pickFileViaInput(accept: string, multiple: boolean): Promise<ImagePickerResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;

    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (!files.length) {
        resolve({ canceled: true, assets: null });
        return;
      }
      const assets = await Promise.all(
        files.map(async (file): Promise<ImagePickerAsset> => {
          const uri = URL.createObjectURL(file);
          return {
            uri,
            width:    0,
            height:   0,
            type:     file.type.startsWith('video') ? 'video' : 'image',
            fileName: file.name,
            fileSize: file.size,
          };
        }),
      );
      resolve({ canceled: false, assets });
    };

    input.oncancel = () => resolve({ canceled: true, assets: null });
    input.click();
  });
}

export async function launchImageLibraryAsync(
  options: ImagePickerOptions = {},
): Promise<ImagePickerResult> {
  const accept = options.mediaTypes === 'Videos' ? 'video/*' : 'image/*';
  return pickFileViaInput(accept, options.allowsMultipleSelection ?? false);
}

export async function launchCameraAsync(
  _options: ImagePickerOptions = {},
): Promise<ImagePickerResult> {
  // Camera not available in web preview — return canceled
  return { canceled: true, assets: null };
}

export async function requestMediaLibraryPermissionsAsync(): Promise<{
  status: PermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
}> {
  return { status: PermissionStatus.GRANTED, granted: true, canAskAgain: true };
}

export async function requestCameraPermissionsAsync(): Promise<{
  status: PermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
}> {
  return { status: PermissionStatus.GRANTED, granted: true, canAskAgain: true };
}

export async function getMediaLibraryPermissionsAsync() {
  return requestMediaLibraryPermissionsAsync();
}

export async function getCameraPermissionsAsync() {
  return requestCameraPermissionsAsync();
}

export const useMediaLibraryPermissions = () =>
  [{ status: PermissionStatus.GRANTED, granted: true }, requestMediaLibraryPermissionsAsync] as const;

export const useCameraPermissions = () =>
  [{ status: PermissionStatus.GRANTED, granted: true }, requestCameraPermissionsAsync] as const;
