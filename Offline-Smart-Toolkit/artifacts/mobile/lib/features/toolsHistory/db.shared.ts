import {
  addPhase6History,
  clearPhase6History,
  deletePhase6History,
  getPhase6History,
} from '@/lib/phase6/Phase6History';
import type { Phase6HistoryEntry } from '@/lib/phase6/types';

export type HistoryCategory = 'qr' | 'barcode' | 'signature' | 'stamp' | 'export' | 'download' | 'share' | 'file';

export interface ToolHistoryEntry {
  id: string;
  category: HistoryCategory;
  toolId: string;
  title: string;
  detail: string;
  outputUri: string | null;
  createdAt: number;
}

export async function initToolsHistoryDb(): Promise<void> {}

export async function addHistoryEntry(entry: {
  category: HistoryCategory;
  toolId: string;
  title: string;
  detail: string;
  outputUri?: string | null;
}): Promise<void> {
  await addPhase6History({
    kind: 'tool',
    action: entry.title,
    fileName: entry.title,
    uri: entry.outputUri ?? null,
    mimeType: 'application/octet-stream',
    toolId: entry.toolId,
    metadata: { category: entry.category, detail: entry.detail },
  });
}

export async function getHistory(category: HistoryCategory, limit = 50): Promise<ToolHistoryEntry[]> {
  return (await getPhase6History())
    .filter((entry) => entry.metadata?.category === category || entry.kind === category)
    .slice(0, limit)
    .map(toToolHistoryEntry);
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await deletePhase6History(id);
}

export async function clearHistory(category: HistoryCategory): Promise<void> {
  await clearPhase6History(category === 'qr' || category === 'barcode' || category === 'signature' || category === 'stamp'
    ? 'tool'
    : category);
}

export async function getAllHistory(limit = 100): Promise<ToolHistoryEntry[]> {
  return (await getPhase6History()).slice(0, limit).map(toToolHistoryEntry);
}

function toToolHistoryEntry(entry: Phase6HistoryEntry): ToolHistoryEntry {
  const category = (entry.metadata?.category as HistoryCategory | undefined)
    ?? (entry.kind === 'tool' ? 'file' : entry.kind);
  return {
    id: entry.id,
    category,
    toolId: entry.toolId ?? entry.action,
    title: entry.kind === 'tool' ? entry.action : entry.fileName,
    detail: String(entry.metadata?.detail ?? entry.action),
    outputUri: entry.uri,
    createdAt: entry.createdAt,
  };
}