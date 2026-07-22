// Local document storage service using AsyncStorage.
// Tracks recent documents, export history, and tool usage.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredDocument {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
  tool: string;      // e.g. 'PdfMerge', 'AadhaarCrop'
  category: string;  // e.g. 'pdf', 'aadhaar', 'scan'
  tags?: string[];
}

export interface ExportRecord {
  id: string;
  documentId: string;
  exportedAt: number;
  format: 'pdf' | 'png' | 'jpg';
  fileName: string;
}

const DOCS_KEY   = '@doc_storage:documents';
const EXPORT_KEY = '@doc_storage:exports';
const MAX_DOCS   = 50;
const MAX_EXPORTS = 100;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getAllDocuments(): Promise<StoredDocument[]> {
  return readJson<StoredDocument[]>(DOCS_KEY, []);
}

export async function saveDocument(doc: Omit<StoredDocument, 'id' | 'createdAt'>): Promise<StoredDocument> {
  const docs = await getAllDocuments();
  const newDoc: StoredDocument = {
    ...doc,
    id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const updated = [newDoc, ...docs].slice(0, MAX_DOCS);
  await writeJson(DOCS_KEY, updated);
  return newDoc;
}

export async function deleteDocument(id: string): Promise<void> {
  const docs = await getAllDocuments();
  await writeJson(DOCS_KEY, docs.filter((d) => d.id !== id));
}

export async function getRecentDocuments(limit = 10): Promise<StoredDocument[]> {
  const docs = await getAllDocuments();
  return docs.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}

export async function getDocumentsByCategory(category: string): Promise<StoredDocument[]> {
  const docs = await getAllDocuments();
  return docs.filter((d) => d.category === category).sort((a, b) => b.createdAt - a.createdAt);
}

export async function searchDocuments(query: string): Promise<StoredDocument[]> {
  const docs = await getAllDocuments();
  const q = query.toLowerCase();
  return docs.filter((d) => d.name.toLowerCase().includes(q) || d.tool.toLowerCase().includes(q));
}

// ── Exports ───────────────────────────────────────────────────────────────────

export async function getAllExports(): Promise<ExportRecord[]> {
  return readJson<ExportRecord[]>(EXPORT_KEY, []);
}

export async function recordExport(record: Omit<ExportRecord, 'id' | 'exportedAt'>): Promise<ExportRecord> {
  const exports = await getAllExports();
  const newRecord: ExportRecord = {
    ...record,
    id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    exportedAt: Date.now(),
  };
  const updated = [newRecord, ...exports].slice(0, MAX_EXPORTS);
  await writeJson(EXPORT_KEY, updated);
  return newRecord;
}

export async function getRecentExports(limit = 20): Promise<ExportRecord[]> {
  const exports = await getAllExports();
  return exports.sort((a, b) => b.exportedAt - a.exportedAt).slice(0, limit);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([DOCS_KEY, EXPORT_KEY]);
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getStorageStats(): Promise<{
  totalDocuments: number;
  totalExports: number;
  byCategory: Record<string, number>;
}> {
  const [docs, exports] = await Promise.all([getAllDocuments(), getAllExports()]);
  const byCategory: Record<string, number> = {};
  for (const d of docs) {
    byCategory[d.category] = (byCategory[d.category] ?? 0) + 1;
  }
  return {
    totalDocuments: docs.length,
    totalExports: exports.length,
    byCategory,
  };
}
