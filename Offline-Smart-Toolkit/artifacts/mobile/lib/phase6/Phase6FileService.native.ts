import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FileTransferResult, LocalFile, OutputFolder } from './types';

const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
  pdf: 'application/pdf', zip: 'application/zip',
};
const CUSTOM_TREE_KEY = '@csc_phase6_custom_tree_uri';
const { Phase6Native } = NativeModules as {
  Phase6Native?: {
    pickDirectory(): Promise<string | null>;
    saveFileToTree(sourcePath: string, treeUri: string, fileName: string): Promise<string>;
    listTreeFiles(treeUri: string): Promise<LocalFile[]>;
    deleteTreeFile(uri: string): Promise<void>;
    renameTreeFile(uri: string, newName: string): Promise<void>;
    copyTreeFile(uri: string, treeUri: string, destinationName: string): Promise<string>;
  };
};

function mimeFor(fileName: string): string {
  return MIME[fileName.toLowerCase().split('.').pop() ?? ''] ?? 'application/octet-stream';
}
function cleanUri(uri: string): string { return uri.replace(/^file:\/\//, ''); }
function pathFor(folder: OutputFolder): string {
  if (folder === 'pictures') return RNFS.PicturesDirectoryPath;
  if (folder === 'documents') return `${RNFS.ExternalStorageDirectoryPath}/Documents`;
  return RNFS.DownloadDirectoryPath;
}
function uniquePath(directory: string, fileName: string): string {
  return `${directory}/${fileName.replace(/[\\/:*?"<>|]/g, '_')}`;
}

export async function ensurePhase6Directories(): Promise<void> {
  await Promise.all([
    RNFS.mkdir(RNFS.DownloadDirectoryPath),
    RNFS.mkdir(RNFS.PicturesDirectoryPath),
    RNFS.mkdir(`${RNFS.ExternalStorageDirectoryPath}/Documents`),
  ]);
}

export async function requestPhase6Permissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const permissions = [
    ...(Number(Platform.Version) >= 33
      ? [PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES, PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO]
      : [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE]),
  ];
  const result = await PermissionsAndroid.requestMultiple(permissions);
  return permissions.every((permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED);
}

export async function saveFile(sourceUri: string, fileName: string, folder: OutputFolder = 'downloads'): Promise<FileTransferResult> {
  if (folder !== 'custom' && !(await requestPhase6Permissions())) {
    throw new Error('Storage permission was denied. Allow media/storage access to save this file.');
  }
  const source = cleanUri(sourceUri);
  let uri: string;
  let size: number;
  if (folder === 'custom') {
    const treeUri = await AsyncStorage.getItem(CUSTOM_TREE_KEY);
    if (!treeUri || !Phase6Native) {
      throw new Error('Choose a custom output folder before saving files there.');
    }
    uri = await Phase6Native.saveFileToTree(source, treeUri, fileName);
    size = Number((await RNFS.stat(source)).size);
  } else {
    await ensurePhase6Directories();
    const destination = uniquePath(pathFor(folder), fileName);
    if (source !== destination) await RNFS.copyFile(source, destination);
    const stat = await RNFS.stat(destination);
    uri = `file://${destination}`;
    size = Number(stat.size);
  }
  await recordRecentFile(fileName, folder);
  return { uri, fileName, folder, size };
}

async function recordRecentFile(fileName: string, folder: OutputFolder): Promise<void> {
  try {
    const key = '@csc_recent_files';
    const raw = await AsyncStorage.getItem(key);
    const current = raw ? JSON.parse(raw) : [];
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName,
      toolUsed: `Export · ${folder}`,
      date: new Date().toISOString(),
      status: 'Completed',
    };
    await AsyncStorage.setItem(key, JSON.stringify([entry, ...current.filter((item: any) => item.fileName !== fileName)].slice(0, 50)));
  } catch {
    // File save succeeded; recent-file indexing must not hide that result.
  }
}

export async function shareFiles(uris: string[], fileNames?: string[]): Promise<void> {
  const urls = uris.map((uri) => uri.startsWith('file://') ? uri : `file://${uri}`);
  await Share.open({
    urls,
    url: urls[0],
    type: mimeFor(fileNames?.[0] ?? urls[0] ?? ''),
    filename: fileNames?.[0],
    failOnCancel: false,
    showAppsToView: true,
  });
}

function directoryForPath(path: string): string {
  return path.includes('/Documents/') || path.endsWith('/Documents')
    ? `${RNFS.ExternalStorageDirectoryPath}/Documents`
    : path.endsWith('/Pictures') ? RNFS.PicturesDirectoryPath : RNFS.DownloadDirectoryPath;
}

export async function listFiles(directory = RNFS.DownloadDirectoryPath): Promise<LocalFile[]> {
  const entries = await RNFS.readDir(directory);
  return entries.map((entry) => ({
    name: entry.name,
    path: entry.path,
    uri: `file://${entry.path}`,
    size: Number(entry.size),
    modifiedAt: entry.mtime ? Number(entry.mtime) : 0,
    mimeType: mimeFor(entry.name),
    isDirectory: entry.isDirectory(),
  }));
}
export async function listFilesInFolder(folder: OutputFolder): Promise<LocalFile[]> {
  if (folder === 'custom') {
    const treeUri = await AsyncStorage.getItem(CUSTOM_TREE_KEY);
    if (!treeUri || !Phase6Native) return [];
    return Phase6Native.listTreeFiles(treeUri);
  }
  return listFiles(pathFor(folder));
}
export async function deleteFile(path: string): Promise<void> {
  if (path.startsWith('content://')) {
    if (!Phase6Native) throw new Error('Custom folder support is unavailable.');
    await Phase6Native.deleteTreeFile(path);
    return;
  }
  await RNFS.unlink(cleanUri(path));
}
export async function renameFile(path: string, newName: string): Promise<void> {
  if (path.startsWith('content://')) {
    if (!Phase6Native) throw new Error('Custom folder support is unavailable.');
    await Phase6Native.renameTreeFile(path, newName);
    return;
  }
  const source = cleanUri(path);
  await RNFS.moveFile(source, uniquePath(directoryForPath(source.substring(0, source.lastIndexOf('/'))), newName));
}
export async function copyFile(path: string, destinationName: string): Promise<void> {
  if (path.startsWith('content://')) {
    const treeUri = await AsyncStorage.getItem(CUSTOM_TREE_KEY);
    if (!treeUri || !Phase6Native) throw new Error('Choose a custom output folder before copying files.');
    await Phase6Native.copyTreeFile(path, treeUri, destinationName);
    return;
  }
  const source = cleanUri(path);
  await RNFS.copyFile(source, uniquePath(directoryForPath(source.substring(0, source.lastIndexOf('/'))), destinationName));
}
export async function moveFile(path: string, destinationName: string): Promise<void> {
  await renameFile(path, destinationName);
}
export async function getFileInfo(path: string): Promise<LocalFile | null> {
  if (path.startsWith('content://')) {
    const treeUri = await AsyncStorage.getItem(CUSTOM_TREE_KEY);
    if (!treeUri || !Phase6Native) return null;
    return (await Phase6Native.listTreeFiles(treeUri)).find((entry) => entry.path === path) ?? null;
  }
  try {
    const stat = await RNFS.stat(cleanUri(path));
    const name = cleanUri(path).split('/').pop() ?? '';
    return { name, path: cleanUri(path), uri: `file://${cleanUri(path)}`, size: Number(stat.size), modifiedAt: stat.mtime ? Number(stat.mtime) : 0, mimeType: mimeFor(name), isDirectory: stat.isDirectory() };
  } catch { return null; }
}
export async function openFile(path: string): Promise<void> {
  await Share.open({ url: path.startsWith('file://') ? path : `file://${path}`, type: mimeFor(path), failOnCancel: false, showAppsToView: true });
}
export async function pickOutputFolder(): Promise<string | null> {
  if (!Phase6Native) return null;
  const treeUri = await Phase6Native.pickDirectory();
  if (treeUri) await AsyncStorage.setItem(CUSTOM_TREE_KEY, treeUri);
  return treeUri;
}
export async function readFileAsBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri.split(',')[1] ?? '';
  return RNFS.readFile(cleanUri(uri), 'base64');
}
export async function writeBase64File(base64: string, fileName: string): Promise<string> {
  const directory = (RNFS as any).CachesDirectoryPath ?? RNFS.DocumentDirectoryPath;
  const destination = uniquePath(directory, fileName);
  await RNFS.writeFile(destination, base64, 'base64');
  return `file://${destination}`;
}