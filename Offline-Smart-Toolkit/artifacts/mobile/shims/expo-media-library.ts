/**
 * expo-media-library web stub.
 * Gallery save is a native-only feature; screens guard it with
 * Platform.OS !== 'web', but webpack still needs the module to resolve.
 */
export async function requestPermissionsAsync() {
  return { status: 'denied' as const };
}

export async function saveToLibraryAsync(_uri: string): Promise<void> {
  // No-op on web.
}

export default { requestPermissionsAsync, saveToLibraryAsync };
