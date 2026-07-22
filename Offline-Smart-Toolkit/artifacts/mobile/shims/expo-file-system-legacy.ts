/**
 * Web stub for expo-file-system/legacy subpath.
 *
 * The legacy API (cacheDirectory, documentDirectory, writeAsStringAsync, etc.)
 * is only meaningful on native platforms. On web all operations that use this
 * module are guarded by Platform.OS checks, so stubs are safe.
 *
 * Metro resolves the real expo-file-system/legacy on native; webpack uses
 * this shim for the web bundle.
 */

export const cacheDirectory: string | null = null;
export const documentDirectory: string | null = null;

export const EncodingType = {
  Base64: 'base64' as const,
  UTF8: 'utf8' as const,
};

export async function writeAsStringAsync(
  _uri: string,
  _data: string,
  _options?: { encoding?: string }
): Promise<void> {
  // no-op on web
}

export async function readAsStringAsync(
  _uri: string,
  _options?: { encoding?: string }
): Promise<string> {
  return '';
}

export async function deleteAsync(
  _uri: string,
  _options?: { idempotent?: boolean }
): Promise<void> {
  // no-op on web
}

export async function getInfoAsync(
  _uri: string
): Promise<{ exists: boolean; isDirectory: boolean; uri: string; size?: number; modificationTime?: number }> {
  return { exists: false, isDirectory: false, uri: _uri };
}

export async function makeDirectoryAsync(
  _uri: string,
  _options?: { intermediates?: boolean }
): Promise<void> {
  // no-op on web
}

export async function copyAsync(_options: { from: string; to: string }): Promise<void> {
  // no-op on web
}

export async function moveAsync(_options: { from: string; to: string }): Promise<void> {
  // no-op on web
}

export async function downloadAsync(
  _uri: string,
  _fileUri: string,
  _options?: Record<string, unknown>
): Promise<{ uri: string; status: number; headers: Record<string, string>; md5?: string }> {
  return { uri: _fileUri, status: 0, headers: {} };
}

export function createDownloadResumable(
  _uri: string,
  _fileUri: string,
  _options?: Record<string, unknown>,
  _callback?: (progress: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void
) {
  return {
    downloadAsync: async () => ({ uri: _fileUri, status: 0, headers: {} }),
    pauseAsync: async () => {},
    resumeAsync: async () => ({ uri: _fileUri, status: 0, headers: {} }),
    savable: () => ({ url: _uri, fileUri: _fileUri }),
  };
}
