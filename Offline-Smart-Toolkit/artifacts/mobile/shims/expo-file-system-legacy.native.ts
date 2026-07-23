/**
 * expo-file-system/legacy — native shim using react-native-fs.
 *
 * The legacy subpath of expo-file-system exports cacheDirectory,
 * documentDirectory, EncodingType, writeAsStringAsync, etc.
 * This shim provides the same surface via react-native-fs so no Expo native
 * module is needed on Android.
 */
import RNFS from 'react-native-fs';

export const cacheDirectory: string    = `file://${RNFS.CachesDirectoryPath}/`;
export const documentDirectory: string = `file://${RNFS.DocumentDirectoryPath}/`;

export const EncodingType = {
  Base64: 'base64' as const,
  UTF8:   'utf8'   as const,
};

function stripScheme(uri: string): string {
  return uri.replace(/^file:\/\//, '');
}

export async function writeAsStringAsync(
  fileUri: string,
  contents: string,
  options?: { encoding?: string },
): Promise<void> {
  const enc = options?.encoding === EncodingType.Base64 ? 'base64' : 'utf8';
  await RNFS.writeFile(stripScheme(fileUri), contents, enc);
}

export async function readAsStringAsync(
  fileUri: string,
  options?: { encoding?: string },
): Promise<string> {
  const enc = options?.encoding === EncodingType.Base64 ? 'base64' : 'utf8';
  return RNFS.readFile(stripScheme(fileUri), enc);
}

export async function deleteAsync(
  fileUri: string,
  options?: { idempotent?: boolean },
): Promise<void> {
  try { await RNFS.unlink(stripScheme(fileUri)); }
  catch (e) { if (!options?.idempotent) throw e; }
}

export async function getInfoAsync(fileUri: string) {
  try {
    const stat = await RNFS.stat(stripScheme(fileUri));
    return { exists: true, isDirectory: stat.isDirectory(), uri: fileUri, size: stat.size };
  } catch {
    return { exists: false, isDirectory: false, uri: fileUri };
  }
}

export async function makeDirectoryAsync(
  fileUri: string,
  _opts?: { intermediates?: boolean },
): Promise<void> {
  await RNFS.mkdir(stripScheme(fileUri));
}

export async function copyAsync(opts: { from: string; to: string }): Promise<void> {
  await RNFS.copyFile(stripScheme(opts.from), stripScheme(opts.to));
}

export async function moveAsync(opts: { from: string; to: string }): Promise<void> {
  await RNFS.moveFile(stripScheme(opts.from), stripScheme(opts.to));
}

export async function downloadAsync(uri: string, fileUri: string) {
  await RNFS.downloadFile({ fromUrl: uri, toFile: stripScheme(fileUri) }).promise;
  return { uri: fileUri, status: 200, headers: {} };
}
