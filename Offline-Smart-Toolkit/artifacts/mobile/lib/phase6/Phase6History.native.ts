import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Phase6HistoryEntry, Phase6HistoryKind } from './types';
// AsyncStorage is intentionally used as the portable local index. File bytes remain
// in the native filesystem; this avoids Expo SQLite and keeps the CLI build stable.
const KEY = '@csc_phase6_history';
let cached: Phase6HistoryEntry[] | null = null;
let readPromise: Promise<Phase6HistoryEntry[]> | null = null;
let writeQueue: Promise<void> = Promise.resolve();
async function read(): Promise<Phase6HistoryEntry[]> {
  if (cached) return cached;
  if (!readPromise) {
    readPromise = AsyncStorage.getItem(KEY).then((raw) => {
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        cached = Array.isArray(parsed) ? parsed : [];
      } catch {
        cached = [];
      }
      return cached;
    }).catch(() => {
      cached = [];
      return cached;
    }).finally(() => {
      readPromise = null;
    });
  }
  return readPromise;
}
function persist(next: Phase6HistoryEntry[]): Promise<void> {
  cached = next;
  writeQueue = writeQueue.then(() => AsyncStorage.setItem(KEY, JSON.stringify(next)));
  return writeQueue;
}
export async function initPhase6History(): Promise<void> {}
export async function addPhase6History(entry: Omit<Phase6HistoryEntry, 'id' | 'createdAt'>): Promise<Phase6HistoryEntry> {
  const created = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: Date.now() };
  await persist([created, ...(await read())].slice(0, 500));
  return created;
}
export async function getPhase6History(kind?: Phase6HistoryKind, search = ''): Promise<Phase6HistoryEntry[]> {
  const query = search.toLowerCase();
  return (await read()).filter((e) => (!kind || e.kind === kind) && (!query || `${e.fileName} ${e.action} ${e.toolId ?? ''}`.toLowerCase().includes(query)));
}
export async function deletePhase6History(id: string): Promise<void> { await persist((await read()).filter((e) => e.id !== id)); }
export async function clearPhase6History(kind?: Phase6HistoryKind): Promise<void> { await persist(kind ? (await read()).filter((e) => e.kind !== kind) : []); }