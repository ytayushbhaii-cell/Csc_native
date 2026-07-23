export * from './types';
export declare function initPhase6History(): Promise<void>;
export declare function addPhase6History(entry: Omit<import('./types').Phase6HistoryEntry, 'id' | 'createdAt'>): Promise<import('./types').Phase6HistoryEntry>;
export declare function getPhase6History(kind?: import('./types').Phase6HistoryKind, search?: string): Promise<import('./types').Phase6HistoryEntry[]>;
export declare function deletePhase6History(id: string): Promise<void>;
export declare function clearPhase6History(kind?: import('./types').Phase6HistoryKind): Promise<void>;