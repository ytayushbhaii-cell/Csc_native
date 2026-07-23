// Offline usage tracking backed by the React Native CLI SQLite bridge.
import { executeSql, querySql } from '@/lib/phase6/LocalSqlite';

export interface UtilityUsageEntry {
  id: number;
  toolId: string;
  toolName: string;
  usedAt: number;
}

let initialized: Promise<void> | null = null;

async function init(): Promise<void> {
  if (!initialized) {
    initialized = executeSql(`
      CREATE TABLE IF NOT EXISTS utility_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        used_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_utility_usage_tool ON utility_usage(tool_id, used_at DESC);
    `);
  }
  await initialized;
}

export async function initUtilitiesDb(): Promise<void> {
  await init();
}

export async function recordToolUsage(toolId: string, toolName: string): Promise<void> {
  await init();
  await executeSql(
    'INSERT INTO utility_usage (tool_id, tool_name, used_at) VALUES (?, ?, ?)',
    [toolId, toolName, Date.now()],
  );
}

export async function getRecentUsage(limit = 10): Promise<UtilityUsageEntry[]> {
  await init();
  const rows = await querySql<{ id: number; tool_id: string; tool_name: string; used_at: number }>(
    'SELECT id, tool_id, tool_name, used_at FROM utility_usage ORDER BY used_at DESC LIMIT ?',
    [limit],
  );
  return rows.map((row) => ({
    id: row.id,
    toolId: row.tool_id,
    toolName: row.tool_name,
    usedAt: row.used_at,
  }));
}

export async function getToolUsageCount(toolId: string): Promise<number> {
  await init();
  const rows = await querySql<{ count: number }>(
    'SELECT COUNT(*) as count FROM utility_usage WHERE tool_id = ?',
    [toolId],
  );
  return rows[0]?.count ?? 0;
}

export async function clearUsageHistory(): Promise<void> {
  await init();
  await executeSql('DELETE FROM utility_usage');
}