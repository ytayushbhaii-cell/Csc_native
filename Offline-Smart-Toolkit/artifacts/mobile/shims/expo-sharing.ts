/**
 * expo-sharing web stub.
 * On web, sharing is handled directly by the Web Share API or download
 * fallback inside each screen.  This stub satisfies dynamic imports so
 * the bundle doesn't fail when screens call import('expo-sharing').
 */
export async function isAvailableAsync(): Promise<boolean> {
  return false;
}

export async function shareAsync(
  _url: string,
  _options?: { mimeType?: string; dialogTitle?: string; UTI?: string },
): Promise<void> {
  // No-op on web — callers check isAvailableAsync() first and fall back to
  // a download / Web Share API implementation.
}

export default { isAvailableAsync, shareAsync };
