import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FileTransferResult, LocalFile, OutputFolder } from './types';

const FILES_KEY = '@csc_phase6_files';

function mimeFor(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  return ext === 'pdf' ? 'application/pdf'
    : ext === 'zip' ? 'application/zip'
    : ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : 'image/jpeg';
}

export async function ensurePhase6Directories(): Promise<void> {}
export async function requestPhase6Permissions(): Promise<boolean> { return true; }

export async function saveFile(
  sourceUri: string,
  fileName: string,
  folder: OutputFolder = 'downloads',
): Promise<FileTransferResult> {
  if (typeof document === 'undefined') return { uri: sourceUri, fileName, folder };
  const anchor = document.createElement('a');
  anchor.href = sourceUri;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  const files = await listFiles();
  const next: LocalFile = {
    name: fileName,
    path: sourceUri,
    uri: sourceUri,
    size: 0,
    modifiedAt: Date.now(),
    mimeType: mimeFor(fileName),
    isDirectory: false,
  };
  await AsyncStorage.setItem(FILES_KEY, JSON.stringify([next, ...files.filter((f) => f.name !== fileName)].slice(0, 200)));
  await recordRecentFile(fileName, folder);
  return { uri: sourceUri, fileName, folder };
}

async function recordRecentFile(fileName: string, folder: OutputFolder): Promise<void> {
  const key = '@csc_recent_files';
  const raw = await AsyncStorage.getItem(key);
  const current = raw ? JSON.parse(raw) : [];
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fileName,
    toolUsed: `Download · ${folder}`,
    date: new Date().toISOString(),
    status: 'Completed',
  };
  await AsyncStorage.setItem(key, JSON.stringify([entry, ...current.filter((item: any) => item.fileName !== fileName)].slice(0, 50)));
}

export async function shareFiles(uris: string[], fileNames?: string[]): Promise<void> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    await (navigator as any).share({ title: fileNames?.[0] ?? 'CSC Smart Toolkit', url: uris[0] });
    return;
  }
  if (uris[0]) await saveFile(uris[0], fileNames?.[0] ?? 'export', 'downloads');
}

export async function listFiles(): Promise<LocalFile[]> {
  try {
    const raw = await AsyncStorage.getItem(FILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export async function listFilesInFolder(_folder: OutputFolder): Promise<LocalFile[]> {
  return listFiles();
}
export async function deleteFile(path: string): Promise<void> {
  const files = await listFiles();
  await AsyncStorage.setItem(FILES_KEY, JSON.stringify(files.filter((f) => f.path !== path)));
}
export async function renameFile(path: string, newName: string): Promise<void> {
  const files = await listFiles();
  await AsyncStorage.setItem(FILES_KEY, JSON.stringify(files.map((f) => f.path === path ? { ...f, name: newName } : f)));
}
export async function copyFile(path: string, destinationName: string): Promise<void> {
  const files = await listFiles();
  const source = files.find((f) => f.path === path);
  if (source) await AsyncStorage.setItem(FILES_KEY, JSON.stringify([{ ...source, name: destinationName }, ...files]));
}
export async function moveFile(path: string, destinationName: string): Promise<void> {
  await renameFile(path, destinationName);
}
export async function getFileInfo(path: string): Promise<LocalFile | null> {
  return (await listFiles()).find((f) => f.path === path) ?? null;
}
export async function openFile(path: string): Promise<void> {
  if (typeof window !== 'undefined') window.open(path, '_blank');
}
export async function pickOutputFolder(): Promise<string | null> { return null; }
export async function readFileAsBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri.split(',')[1] ?? '';
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(blob);
  });
}
export async function writeBase64File(base64: string, fileName: string): Promise<string> {
  return `data:${mimeFor(fileName)};base64,${base64}`;
}