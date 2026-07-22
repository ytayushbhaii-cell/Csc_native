/**
 * Web shim for expo-modules-core.
 *
 * expo-modules-core ships only TypeScript source (main: "src/index.ts") with
 * syntax that babel-loader cannot parse on web. This shim provides all the
 * exports that the CSC Smart Toolkit and its Expo dependencies need at runtime
 * on web without hitting native bindings.
 */

// no native imports needed on web

// ── EventSubscription ────────────────────────────────────────────────────────
export interface EventSubscription {
  remove(): void;
}

// ── EventEmitter ─────────────────────────────────────────────────────────────
export class EventEmitter<TEventsMap extends Record<string, any> = Record<string, any>> {
  private _listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  addListener<K extends keyof TEventsMap>(
    eventName: K,
    listener: (...args: any[]) => void
  ): EventSubscription {
    const key = String(eventName);
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key)!.add(listener);
    return { remove: () => this.removeListener(eventName, listener) };
  }

  removeListener<K extends keyof TEventsMap>(
    eventName: K,
    listener: (...args: any[]) => void
  ): void {
    this._listeners.get(String(eventName))?.delete(listener);
  }

  removeAllListeners<K extends keyof TEventsMap>(eventName?: K): void {
    if (eventName !== undefined) {
      this._listeners.delete(String(eventName));
    } else {
      this._listeners.clear();
    }
  }

  emit<K extends keyof TEventsMap>(eventName: K, ...args: any[]): void {
    this._listeners.get(String(eventName))?.forEach(fn => fn(...args));
  }

  listenerCount<K extends keyof TEventsMap>(eventName: K): number {
    return this._listeners.get(String(eventName))?.size ?? 0;
  }
}

// ── LegacyEventEmitter ───────────────────────────────────────────────────────
export class LegacyEventEmitter extends EventEmitter {}

// ── NativeModule ─────────────────────────────────────────────────────────────
export class NativeModule<TEventsMap extends Record<string, any> = Record<string, any>>
  extends EventEmitter<TEventsMap> {}

// ── SharedObject / SharedRef ──────────────────────────────────────────────────
export class SharedObject {}
export class SharedRef {}

// ── NativeModulesProxy ───────────────────────────────────────────────────────
export const NativeModulesProxy: Record<string, any> = {};

// ── Platform ─────────────────────────────────────────────────────────────────
export const Platform = {
  OS: 'web' as const,
  Version: '0',
  select: <T>(specifics: { web?: T; default?: T; [key: string]: T | undefined }) =>
    specifics['web'] ?? specifics['default'] as T,
};

// ── requireNativeModule / requireOptionalNativeModule ─────────────────────────
export function requireOptionalNativeModule<T = any>(moduleName: string): T | null {
  // No native modules on web
  return null;
}

export function requireNativeModule<T = any>(moduleName: string): T {
  // On web, return an empty stub that won't crash
  return {} as T;
}

// ── requireNativeViewManager ──────────────────────────────────────────────────
export function requireNativeViewManager(viewName: string): any {
  return null;
}

// ── registerWebModule ─────────────────────────────────────────────────────────
export function registerWebModule<T extends new (...args: any[]) => any>(
  moduleImplementation: T,
  moduleName?: string
): T {
  return moduleImplementation;
}

// ── Errors ────────────────────────────────────────────────────────────────────
export class CodedError extends Error {
  code: string;
  info?: any;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'CodedError';
  }
}

export class UnavailabilityError extends CodedError {
  constructor(moduleName: string, propertyName: string) {
    super(
      'ERR_UNAVAILABLE',
      `The method or property ${moduleName}.${propertyName} is not available on web.`
    );
    this.name = 'UnavailabilityError';
  }
}

// ── uuid ──────────────────────────────────────────────────────────────────────
export const uuid = {
  v4: (): string => {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};

// ── Snapshot-friendly ref (used by expo-image) ────────────────────────────────
export function createSnapshotFriendlyRef<T>() {
  // On web, just use a plain React ref-compatible object
  return { current: null as T | null };
}

// ── createPermissionHook (used by expo-camera, expo-media-library) ────────────
export function createPermissionHook(
  _queryFn: () => Promise<any>,
  _requestFn: () => Promise<any>
) {
  return function usePermissionHook() {
    const stub = { status: 'granted', granted: true, canAskAgain: false, expires: 'never' as const };
    return [stub, async () => stub, async () => stub] as const;
  };
}

// ── Permissions ───────────────────────────────────────────────────────────────
export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
} as const;

export function usePermissions(
  _fn: any,
  _options?: any
): [any, () => Promise<any>] {
  const stub = { status: PermissionStatus.GRANTED, granted: true };
  return [stub, async () => stub];
}

// ── Refs ──────────────────────────────────────────────────────────────────────
export function useReleasingSharedObject<T>(_factory: () => T, _deps: any[]): T {
  return null as any;
}

// ── reload ────────────────────────────────────────────────────────────────────
export function reloadAppAsync(_reason?: string): Promise<void> {
  if (typeof window !== 'undefined') window.location.reload();
  return Promise.resolve();
}

// ── TypedArrays ───────────────────────────────────────────────────────────────
export type TypedArray =
  | Int8Array | Uint8Array | Uint8ClampedArray
  | Int16Array | Uint16Array
  | Int32Array | Uint32Array
  | Float32Array | Float64Array
  | BigInt64Array | BigUint64Array;
