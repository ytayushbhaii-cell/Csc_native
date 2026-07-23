/**
 * expo-media-library — web stub.
 * Gallery save is a native-only feature; screens guard it with Platform.OS checks.
 */
export async function requestPermissionsAsync() {
  return { status: 'denied' as const, granted: false, canAskAgain: false };
}

export async function getPermissionsAsync() {
  return requestPermissionsAsync();
}

export async function saveToLibraryAsync(_uri: string): Promise<void> {
  // No-op on web.
}

export async function createAssetAsync(_uri: string) {
  return { uri: _uri, id: _uri, filename: '', mediaType: 'photo' as const };
}

export default { requestPermissionsAsync, getPermissionsAsync, saveToLibraryAsync, createAssetAsync };
