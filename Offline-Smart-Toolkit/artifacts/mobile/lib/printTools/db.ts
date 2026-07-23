// Offline print persistence backed by the React Native CLI SQLite bridge.
import { executeSql, querySql } from '@/lib/phase6/LocalSqlite';

export interface PrintHistoryRow {
  id: number;
  tool: string;
  file_name: string;
  export_type: string;
  created_at: string;
}

let initialized: Promise<void> | null = null;

export function initPrintDb(): Promise<void> {
  if (!initialized) {
    initialized = executeSql(`
      CREATE TABLE IF NOT EXISTS print_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool TEXT NOT NULL,
        file_name TEXT NOT NULL,
        export_type TEXT NOT NULL DEFAULT 'PDF',
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      CREATE TABLE IF NOT EXISTS print_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS print_favorites (
        tool_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
    `);
  }
  return initialized;
}

export async function addPrintHistory(tool: string, fileName: string, exportType = 'PDF'): Promise<void> {
  await initPrintDb();
  await executeSql(
    'INSERT INTO print_history (tool, file_name, export_type) VALUES (?, ?, ?)',
    [tool, fileName, exportType],
  );
}

export async function getRecentPrints(limit = 20): Promise<PrintHistoryRow[]> {
  await initPrintDb();
  return querySql<PrintHistoryRow>(
    'SELECT id, tool, file_name, export_type, created_at FROM print_history ORDER BY id DESC LIMIT ?',
    [limit],
  );
}

export async function clearPrintHistory(): Promise<void> {
  await initPrintDb();
  await executeSql('DELETE FROM print_history');
}

export async function saveSetting(key: string, value: string): Promise<void> {
  await initPrintDb();
  await executeSql(
    'INSERT INTO print_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  await initPrintDb();
  const rows = await querySql<{ value: string }>(
    'SELECT value FROM print_settings WHERE key = ?',
    [key],
  );
  return rows[0]?.value ?? defaultValue;
}

export async function addPrintFavorite(toolId: string): Promise<void> {
  await initPrintDb();
  await executeSql('INSERT OR IGNORE INTO print_favorites (tool_id) VALUES (?)', [toolId]);
}

export async function removePrintFavorite(toolId: string): Promise<void> {
  await initPrintDb();
  await executeSql('DELETE FROM print_favorites WHERE tool_id = ?', [toolId]);
}

export async function getPrintFavorites(): Promise<string[]> {
  await initPrintDb();
  const rows = await querySql<{ tool_id: string }>('SELECT tool_id FROM print_favorites');
  return rows.map((row) => row.tool_id);
}