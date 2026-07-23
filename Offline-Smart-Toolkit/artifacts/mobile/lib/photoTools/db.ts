// Offline Photo Tools persistence backed by the React Native CLI SQLite bridge.
import { executeSql, querySql } from '@/lib/phase6/LocalSqlite';

export interface PhotoRecentFile {
  id: number;
  toolId: string;
  toolName: string;
  fileName: string;
  resultUri: string;
  thumbnailUri: string | null;
  createdAt: number;
}

export interface PhotoToolUsage {
  toolId: string;
  useCount: number;
  lastUsedAt: number;
}

let initialized: Promise<void> | null = null;

async function init(): Promise<void> {
  if (!initialized) {
    initialized = executeSql(`
      CREATE TABLE IF NOT EXISTS photo_recent_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        result_uri TEXT NOT NULL,
        thumbnail_uri TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS photo_tool_usage (
        tool_id TEXT PRIMARY KEY,
        use_count INTEGER NOT NULL DEFAULT 0,
        last_used_at INTEGER NOT NULL
      );
    `);
  }
  await initialized;
}

export async function initPhotoToolsDb(): Promise<void> {
  await init();
}

export async function addRecentFile(entry: {
  toolId: string;
  toolName: string;
  fileName: string;
  resultUri: string;
  thumbnailUri?: string | null;
}): Promise<void> {
  await init();
  await executeSql(
    'INSERT INTO photo_recent_files (tool_id, tool_name, file_name, result_uri, thumbnail_uri, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [entry.toolId, entry.toolName, entry.fileName, entry.resultUri, entry.thumbnailUri ?? null, Date.now()],
  );
}

export async function getRecentFiles(limit = 20): Promise<PhotoRecentFile[]> {
  await init();
  const rows = await querySql<{
    id: number; tool_id: string; tool_name: string; file_name: string;
    result_uri: string; thumbnail_uri: string | null; created_at: number;
  }>(
    'SELECT id, tool_id, tool_name, file_name, result_uri, thumbnail_uri, created_at FROM photo_recent_files ORDER BY created_at DESC LIMIT ?',
    [limit],
  );
  return rows.map((row) => ({
    id: row.id,
    toolId: row.tool_id,
    toolName: row.tool_name,
    fileName: row.file_name,
    resultUri: row.result_uri,
    thumbnailUri: row.thumbnail_uri,
    createdAt: row.created_at,
  }));
}

export async function clearRecentFiles(): Promise<void> {
  await init();
  await executeSql('DELETE FROM photo_recent_files');
}

export async function recordToolUsage(toolId: string): Promise<void> {
  await init();
  await executeSql(
    `INSERT INTO photo_tool_usage (tool_id, use_count, last_used_at) VALUES (?, 1, ?)
     ON CONFLICT(tool_id) DO UPDATE SET use_count = use_count + 1, last_used_at = excluded.last_used_at`,
    [toolId, Date.now()],
  );
}

export async function getMostUsedToolIds(limit = 6): Promise<string[]> {
  await init();
  const rows = await querySql<{ tool_id: string }>(
    'SELECT tool_id FROM photo_tool_usage ORDER BY use_count DESC, last_used_at DESC LIMIT ?',
    [limit],
  );
  return rows.map((row) => row.tool_id);
}

export async function getLastOpenedToolId(): Promise<string | null> {
  await init();
  const rows = await querySql<{ tool_id: string }>(
    'SELECT tool_id FROM photo_tool_usage ORDER BY last_used_at DESC LIMIT 1',
  );
  return rows[0]?.tool_id ?? null;
}