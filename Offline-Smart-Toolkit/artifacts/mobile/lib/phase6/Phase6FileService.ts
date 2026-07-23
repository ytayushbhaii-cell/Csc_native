// TypeScript fallback for Metro's .native.ts/.web.ts platform resolution.
export * from './types';
export declare function ensurePhase6Directories(): Promise<void>;
export declare function requestPhase6Permissions(): Promise<boolean>;
export declare function saveFile(sourceUri: string, fileName: string, folder?: import('./types').OutputFolder): Promise<import('./types').FileTransferResult>;
export declare function shareFiles(uris: string[], fileNames?: string[]): Promise<void>;
export declare function listFiles(directory?: string): Promise<import('./types').LocalFile[]>;
export declare function listFilesInFolder(folder: import('./types').OutputFolder): Promise<import('./types').LocalFile[]>;
export declare function deleteFile(path: string): Promise<void>;
export declare function renameFile(path: string, newName: string): Promise<void>;
export declare function copyFile(path: string, destinationName: string): Promise<void>;
export declare function moveFile(path: string, destinationName: string): Promise<void>;
export declare function getFileInfo(path: string): Promise<import('./types').LocalFile | null>;
export declare function openFile(path: string): Promise<void>;
export declare function pickOutputFolder(): Promise<string | null>;
export declare function readFileAsBase64(uri: string): Promise<string>;
export declare function writeBase64File(base64: string, fileName: string): Promise<string>;