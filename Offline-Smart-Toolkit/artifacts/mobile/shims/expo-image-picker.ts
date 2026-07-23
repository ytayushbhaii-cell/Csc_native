/**
 * expo-image-picker — native shim using react-native-image-picker.
 *
 * Mirrors the exact Expo API surface used by this codebase including:
 *  - mediaTypes accepting string | string[]
 *  - ImagePickerAsset with mimeType
 *  - assets always non-null on success (null only when canceled)
 *  - exif option
 */
import { Platform, PermissionsAndroid } from 'react-native';

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

export interface ImagePickerOptions {
  mediaTypes?:        string | string[];
  allowsEditing?:     boolean;
  aspect?:            [number, number];
  quality?:           number;
  base64?:            boolean;
  allowsMultipleSelection?: boolean;
  exif?:              boolean;
  preferredAssetRepresentationMode?: string;
  selectionLimit?: number;
}

let _RNImagePicker: any = null;
function getRNImagePicker() {
  if (_RNImagePicker !== null) return _RNImagePicker;
  try { _RNImagePicker = require('react-native-image-picker'); }
  catch { _RNImagePicker = undefined; }
  return _RNImagePicker;
}

function resolveMediaType(mediaTypes: string | string[] | undefined): string {
  const types = Array.isArray(mediaTypes) ? mediaTypes : [mediaTypes ?? 'All'];
  if (types.some((t) => t === 'Videos' || t === MediaTypeOptions.Videos)) return 'video';
  if (types.some((t) => t === 'All'    || t === MediaTypeOptions.All))    return 'mixed';
  return 'photo';
}

export async function launchImageLibraryAsync(
  options: ImagePickerOptions = {},
): Promise<ImagePickerResult> {
  const RNImagePicker = getRNImagePicker();
  if (!RNImagePicker) {
    console.warn('[expo-image-picker shim] react-native-image-picker not available.');
    return { canceled: true, assets: null };
  }

  return new Promise((resolve) => {
    RNImagePicker.launchImageLibrary(
      {
        mediaType:      resolveMediaType(options.mediaTypes),
        quality:        options.quality ?? 1,
        includeBase64:  options.base64 ?? false,
        includeExtra:   options.exif ?? false,
        selectionLimit: options.allowsMultipleSelection ? 0 : 1,
      },
      (response: any) => {
        if (response.didCancel || response.errorCode) {
          resolve({ canceled: true, assets: null });
          return;
        }
        const assets: ImagePickerAsset[] = (response.assets ?? []).map((a: any) => ({
          uri:      a.uri,
          width:    a.width  ?? 0,
          height:   a.height ?? 0,
          type:     a.type?.startsWith('video') ? ('video' as const) : ('image' as const),
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.type,
          base64:   a.base64 ?? null,
          exif:     a.exif   ?? null,
        }));
        resolve({ canceled: false, assets });
      },
    );
  });
}

export async function launchCameraAsync(
  options: ImagePickerOptions = {},
): Promise<ImagePickerResult> {
  const RNImagePicker = getRNImagePicker();
  if (!RNImagePicker) return { canceled: true, assets: null };

  return new Promise((resolve) => {
    RNImagePicker.launchCamera(
      {
        mediaType:     resolveMediaType(options.mediaTypes),
        quality:       options.quality ?? 1,
        includeBase64: options.base64 ?? false,
        includeExtra:  options.exif  ?? false,
      },
      (response: any) => {
        if (response.didCancel || response.errorCode) {
          resolve({ canceled: true, assets: null });
          return;
        }
        const assets: ImagePickerAsset[] = (response.assets ?? []).map((a: any) => ({
          uri:      a.uri,
          width:    a.width  ?? 0,
          height:   a.height ?? 0,
          type:     'image' as const,
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.type,
          base64:   a.base64 ?? null,
        }));
        resolve({ canceled: false, assets });
      },
    );
  });
}

export async function requestMediaLibraryPermissionsAsync() {
  if (Platform.OS === 'android') {
    const perm = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      ?? (PermissionsAndroid.PERMISSIONS as any).READ_EXTERNAL_STORAGE;
    const result = await PermissionsAndroid.request(perm);
    const granted = result === PermissionsAndroid.RESULTS.GRANTED;
    return { status: granted ? PermissionStatus.GRANTED : PermissionStatus.DENIED, granted, canAskAgain: true };
  }
  return { status: PermissionStatus.GRANTED, granted: true, canAskAgain: true };
}

export async function requestCameraPermissionsAsync() {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    const granted = result === PermissionsAndroid.RESULTS.GRANTED;
    return { status: granted ? PermissionStatus.GRANTED : PermissionStatus.DENIED, granted, canAskAgain: true };
  }
  return { status: PermissionStatus.GRANTED, granted: true, canAskAgain: true };
}

export const getMediaLibraryPermissionsAsync = requestMediaLibraryPermissionsAsync;
export const getCameraPermissionsAsync        = requestCameraPermissionsAsync;

export const useMediaLibraryPermissions = () =>
  [{ status: PermissionStatus.GRANTED, granted: true }, requestMediaLibraryPermissionsAsync] as const;
export const useCameraPermissions = () =>
  [{ status: PermissionStatus.GRANTED, granted: true }, requestCameraPermissionsAsync] as const;
