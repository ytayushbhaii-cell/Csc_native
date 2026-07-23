// Web build of the optional Photo Tools local store. Native Android uses the
// React Native CLI SQLite bridge in db.ts.
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

export async function initPhotoToolsDb(): Promise<void> {}

export async function addRecentFile(_entry: {
  toolId: string;
  toolName: string;
  fileName: string;
  resultUri: string;
  thumbnailUri?: string | null;
}): Promise<void> {}

export async function getRecentFiles(_limit = 20): Promise<PhotoRecentFile[]> {
  return [];
}

export async function clearRecentFiles(): Promise<void> {}

export async function recordToolUsage(_toolId: string): Promise<void> {}

export async function getMostUsedToolIds(_limit = 6): Promise<string[]> {
  return [];
}

export async function getLastOpenedToolId(): Promise<string | null> {
  return null;
}
