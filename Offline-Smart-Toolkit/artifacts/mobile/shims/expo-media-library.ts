/**
 * expo-media-library — native shim using @react-native-community/cameraroll.
 *
 * On web the operations are no-ops (guarded by Platform.OS checks in screens).
 * On native, delegates to the cameraroll library already in this project.
 */
import { Platform } from 'react-native';

let _CameraRoll: any = null;
function getCameraRoll() {
  if (_CameraRoll) return _CameraRoll;
  try {
    // Package exports CameraRoll as named export
    const mod = require('@react-native-community/cameraroll');
    _CameraRoll = mod.CameraRoll ?? mod.default ?? mod;
  } catch { _CameraRoll = null; }
  return _CameraRoll;
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function requestPermissionsAsync(): Promise<{
  status: PermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
}> {
  if (Platform.OS === 'web') {
    return { status: 'denied', granted: false, canAskAgain: false };
  }
  // react-native-permissions or cameraroll handles permissions during save
  return { status: 'granted', granted: true, canAskAgain: true };
}

export async function getPermissionsAsync() {
  return requestPermissionsAsync();
}

export async function saveToLibraryAsync(uri: string): Promise<void> {
  if (Platform.OS === 'web') return; // guarded by screen

  const CameraRoll = getCameraRoll();
  if (!CameraRoll) {
    console.warn('[expo-media-library shim] @react-native-community/cameraroll not available.');
    return;
  }
  await CameraRoll.save(uri, { type: 'photo' });
}

export async function createAssetAsync(uri: string) {
  await saveToLibraryAsync(uri);
  return { uri, id: uri, filename: uri.split('/').pop() ?? 'image', mediaType: 'photo' as const };
}

export default { requestPermissionsAsync, getPermissionsAsync, saveToLibraryAsync, createAssetAsync };
