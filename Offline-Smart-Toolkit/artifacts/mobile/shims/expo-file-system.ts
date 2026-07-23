/**
 * expo-file-system — native shim using react-native-fs.
 *
 * Replaces expo-file-system with a pure React Native CLI implementation.
 * Provides the same API surface used by pdfService, pdfToImageService,
 * ModelDownloadService, and other services in this project.
 */
import RNFS from 'react-native-fs';

// ── Directory constants (matches expo-file-system) ────────────────────────────
export const cacheDirectory: string    = `file://${RNFS.CachesDirectoryPath}/`;
export const documentDirectory: string = `file://${RNFS.DocumentDirectoryPath}/`;

// ── Encoding types ─────────────────────────────────────────────────────────────
export const EncodingType = {
  Base64: 'base64' as const,
  UTF8:   'utf8'   as const,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function stripFileScheme(uri: string): string {
  return uri.replace(/^file:\/\//, '');
}

// ── File I/O ──────────────────────────────────────────────────────────────────
export async function writeAsStringAsync(
  fileUri: string,
  contents: string,
  options?: { encoding?: string },
): Promise<void> {
  const encoding = options?.encoding === EncodingType.Base64 ? 'base64' : 'utf8';
  const path     = stripFileScheme(fileUri);
  await RNFS.writeFile(path, contents, encoding);
}

export async function readAsStringAsync(
  fileUri: string,
  options?: { encoding?: string },
): Promise<string> {
  const encoding = options?.encoding === EncodingType.Base64 ? 'base64' : 'utf8';
  return RNFS.readFile(stripFileScheme(fileUri), encoding);
}

export async function deleteAsync(
  fileUri: string,
  options?: { idempotent?: boolean },
): Promise<void> {
  try {
    await RNFS.unlink(stripFileScheme(fileUri));
  } catch (e: any) {
    if (!options?.idempotent) throw e;
  }
}

export async function getInfoAsync(
  fileUri: string,
): Promise<{ exists: boolean; isDirectory: boolean; uri: string; size?: number; modificationTime?: number }> {
  try {
    const stat = await RNFS.stat(stripFileScheme(fileUri));
    return {
      exists:           true,
      isDirectory:      stat.isDirectory(),
      uri:              fileUri,
      size:             stat.size,
      modificationTime: Math.floor(new Date(stat.mtime).getTime() / 1000),
    };
  } catch {
    return { exists: false, isDirectory: false, uri: fileUri };
  }
}

export async function makeDirectoryAsync(
  fileUri: string,
  options?: { intermediates?: boolean },
): Promise<void> {
  await RNFS.mkdir(stripFileScheme(fileUri));
}

export async function copyAsync(opts: { from: string; to: string }): Promise<void> {
  await RNFS.copyFile(stripFileScheme(opts.from), stripFileScheme(opts.to));
}

export async function moveAsync(opts: { from: string; to: string }): Promise<void> {
  await RNFS.moveFile(stripFileScheme(opts.from), stripFileScheme(opts.to));
}

// ── Download ──────────────────────────────────────────────────────────────────
export async function downloadAsync(
  uri: string,
  fileUri: string,
  _options?: Record<string, unknown>,
): Promise<{ uri: string; status: number; headers: Record<string, string>; md5?: string }> {
  await RNFS.downloadFile({ fromUrl: uri, toFile: stripFileScheme(fileUri) }).promise;
  return { uri: fileUri, status: 200, headers: {} };
}

export function createDownloadResumable(
  uri: string,
  fileUri: string,
  _options?: Record<string, unknown>,
  progressCallback?: (p: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void,
) {
  let jobId: number | null = null;

  const run = () => {
    const { jobId: jid, promise } = RNFS.downloadFile({
      fromUrl:  uri,
      toFile:   stripFileScheme(fileUri),
      progress: (res) => {
        progressCallback?.({
          totalBytesWritten:          res.bytesWritten,
          totalBytesExpectedToWrite:  res.contentLength,
        });
      },
    });
    jobId = jid;
    return promise.then(() => ({ uri: fileUri, status: 200, headers: {} }));
  };

  return {
    downloadAsync:  () => run(),
    pauseAsync:     async () => { if (jobId !== null) RNFS.stopDownload(jobId); },
    resumeAsync:    () => run(),
    savable:        () => ({ url: uri, fileUri }),
  };
}
