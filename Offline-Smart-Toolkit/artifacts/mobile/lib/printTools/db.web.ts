// ────────────────────────────────────────────────────────────────────────────
// Print Tools – SQLite persistence (WEB stub)
// The web preview keeps optional print persistence disabled. Native Android
// uses the React Native CLI SQLite bridge in db.ts.
// ────────────────────────────────────────────────────────────────────────────

export interface PrintHistoryRow {
  id: number;
  tool: string;
  file_name: string;
  export_type: string;
  created_at: string;
}

export async function initPrintDb(): Promise<void> {}

export async function addPrintHistory(
  _tool: string,
  _fileName: string,
  _exportType = 'PDF'
): Promise<void> {}

export async function getRecentPrints(_limit = 20): Promise<PrintHistoryRow[]> {
  return [];
}

export async function clearPrintHistory(): Promise<void> {}

export async function saveSetting(_key: string, _value: string): Promise<void> {}

export async function getSetting(_key: string, defaultValue = ''): Promise<string> {
  return defaultValue;
}

export async function addPrintFavorite(_toolId: string): Promise<void> {}

export async function removePrintFavorite(_toolId: string): Promise<void> {}

export async function getPrintFavorites(): Promise<string[]> {
  return [];
}
