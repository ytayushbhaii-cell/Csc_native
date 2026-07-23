export type Phase6HistoryKind =
  | 'tool'
  | 'export'
  | 'download'
  | 'share'
  | 'file';

export type OutputFolder = 'downloads' | 'pictures' | 'documents' | 'custom';

export interface Phase6HistoryEntry {
  id: string;
  kind: Phase6HistoryKind;
  action: string;
  fileName: string;
  uri: string | null;
  mimeType: string;
  toolId?: string;
  createdAt: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface LocalFile {
  name: string;
  path: string;
  uri: string;
  size: number;
  modifiedAt: number;
  mimeType: string;
  isDirectory: boolean;
}

export interface FileTransferResult {
  uri: string;
  fileName: string;
  folder: OutputFolder;
  size?: number;
}