import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Phase6HistoryEntry, Phase6HistoryKind } from './types';
const KEY = '@csc_phase6_history';
async function read(): Promise<Phase6HistoryEntry[]> {
  try { const raw = await AsyncStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
export async function initPhase6History(): Promise<void> {}
export async function addPhase6History(entry: Omit<Phase6HistoryEntry, 'id' | 'createdAt'>): Promise<Phase6HistoryEntry> {
  const created = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: Date.now() };
  await AsyncStorage.setItem(KEY, JSON.stringify([created, ...(await read())].slice(0, 500)));
  return created;
}
export async function getPhase6History(kind?: Phase6HistoryKind, search = ''): Promise<Phase6HistoryEntry[]> {
  const query = search.toLowerCase();
  return (await read()).filter((e) => (!kind || e.kind === kind) && (!query || `${e.fileName} ${e.action} ${e.toolId ?? ''}`.toLowerCase().includes(query)));
}
export async function deletePhase6History(id: string): Promise<void> { await AsyncStorage.setItem(KEY, JSON.stringify((await read()).filter((e) => e.id !== id))); }
export async function clearPhase6History(kind?: Phase6HistoryKind): Promise<void> { await AsyncStorage.setItem(KEY, JSON.stringify(kind ? (await read()).filter((e) => e.kind !== kind) : [])); }