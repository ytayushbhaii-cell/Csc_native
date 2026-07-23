/**
 * ModelDownloadService — Native platform implementation.
 *
 * Storage: the React Native file-system adapter (`cacheDirectory/ai-models/`)
 *  • Persists between app launches
 *  • Works offline after download
 *
 * Download: FileSystem.createDownloadResumable with progress callback.
 *  • Resume support: when a download is interrupted, the resumable snapshot
 *    is saved to a `.partial.json` sidecar file. On the next call to
 *    downloadModel() the snapshot is loaded and the download continues from
 *    the byte offset where it stopped — no need to restart from 0%.
 *  • On cancellation the snapshot is saved (not discarded) so the next
 *    attempt can continue seamlessly.
 *
 * ORT integration: getModelData() returns a file URI string that
 * onnxruntime-react-native InferenceSession.create() accepts directly.
 */

import type {
  IModelDownloadService,
  DownloadProgressCallback,
  ModelCacheInfo,
} from './ModelDownloadServiceTypes';
import {
  ModelDownloadCancelledError,
  ModelIntegrityError,
  ModelDownloadError,
} from './ModelDownloadServiceTypes';

// The platform adapter is dynamically imported to keep this native-only
// implementation out of the browser bundle.
async function getFS() {
  const fs = await import('expo-file-system') as any;
  return fs;
}

function safeModelId(modelId: string): string {
  if (!/^[a-z0-9_-]+$/i.test(modelId)) {
    throw new ModelDownloadError(`Invalid model identifier: ${modelId}`);
  }
  return modelId;
}

function metaPath(cacheDir: string, modelId: string): string {
  return `${cacheDir}ai-models/${safeModelId(modelId)}.meta.json`;
}

function modelPath(cacheDir: string, modelId: string): string {
  return `${cacheDir}ai-models/${safeModelId(modelId)}.onnx`;
}

/** Sidecar file that stores the DownloadResumable snapshot for interrupted downloads. */
function partialPath(cacheDir: string, modelId: string): string {
  return `${cacheDir}ai-models/${safeModelId(modelId)}.partial.json`;
}

class NativeModelDownloadService implements IModelDownloadService {
  private _cacheDir: string | null = null;

  private async ensureDir(): Promise<string> {
    if (this._cacheDir) return this._cacheDir;
    const fs  = await getFS();
    const dir = `${fs.cacheDirectory}ai-models/`;
    const info = await fs.getInfoAsync(dir);
    if (!info.exists) {
      await fs.makeDirectoryAsync(dir, { intermediates: true });
    }
    this._cacheDir = fs.cacheDirectory;
    return fs.cacheDirectory;
  }

  async isModelCached(modelId: string): Promise<boolean> {
    try {
      const fs   = await getFS();
      const base = await this.ensureDir();
      const path = modelPath(base, modelId);
      const info = await fs.getInfoAsync(path);
      return info.exists && (info.size ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async getModelData(modelId: string): Promise<string | null> {
    try {
      const fs   = await getFS();
      const base = await this.ensureDir();
      const path = modelPath(base, modelId);
      const info = await fs.getInfoAsync(path);
      return info.exists ? path : null;
    } catch {
      return null;
    }
  }

  async downloadModel(
    modelId: string,
    url: string,
    expectedBytes: number,
    onProgress?: DownloadProgressCallback,
    signal?: AbortSignal,
  ): Promise<void> {
    if (signal?.aborted) throw new ModelDownloadCancelledError();
    if (!/^https:\/\//i.test(url)) {
      throw new ModelDownloadError('Model downloads require an HTTPS URL.');
    }

    const fs   = await getFS();
    const base = await this.ensureDir();
    const dest = modelPath(base, modelId);
    const snap = partialPath(base, modelId);

    // ── Resume support: load saved snapshot if available ─────────────────────
    let savedSnapshot: string | undefined;
    try {
      const snapInfo = await fs.getInfoAsync(snap);
      if (snapInfo.exists) {
        const raw = await fs.readAsStringAsync(snap);
        // Validate the snapshot is non-empty JSON before using it
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // Snapshot exists AND the partial file must also exist to resume
          const partialInfo = await fs.getInfoAsync(dest);
          if (partialInfo.exists && (partialInfo.size ?? 0) > 0) {
            savedSnapshot = raw;
            console.info(`[NativeDownload] Resuming ${modelId} from ${partialInfo.size} bytes`);
          }
        }
      }
    } catch {
      // If snapshot load fails, start fresh (snapshot file may be corrupt)
      savedSnapshot = undefined;
    }

    // If there is no valid snapshot, ensure no stale partial file exists
    if (!savedSnapshot) {
      const partial = await fs.getInfoAsync(dest);
      if (partial.exists) await fs.deleteAsync(dest, { idempotent: true });
      // Also clean up any stale snapshot sidecar
      const snapInfo = await fs.getInfoAsync(snap);
      if (snapInfo.exists) await fs.deleteAsync(snap, { idempotent: true });
    }

    const startTime = Date.now();

    const downloadResumable = fs.createDownloadResumable(
      url,
      dest,
      {},
      (downloadProgress: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => {
        if (signal?.aborted) return;
        const { totalBytesWritten: dl, totalBytesExpectedToWrite: total } = downloadProgress;
        const elapsedSec = Math.max(0.001, (Date.now() - startTime) / 1000);
        const speedBps   = dl / elapsedSec;
        const remaining  = Math.max(0, total - dl);
        onProgress?.({
          percentage:      total > 0 ? Math.min(100, (dl / total) * 100) : 0,
          bytesDownloaded: dl,
          totalBytes:      total > 0 ? total : expectedBytes,
          speedMBps:       speedBps / (1024 * 1024),
          etaSeconds:      speedBps > 0 ? remaining / speedBps : 0,
        });
      },
      savedSnapshot, // pass snapshot to resume if available
    );

    // Wire abort signal: pause and save snapshot so next attempt can resume
    let wasCancelled = false;
    signal?.addEventListener('abort', () => {
      wasCancelled = true;
      downloadResumable.pauseAsync()
        .then(async (pauseState: { resumeData?: string } | null | undefined) => {
          if (pauseState?.resumeData) {
            // Save snapshot for next resume attempt
            await fs.writeAsStringAsync(snap, pauseState.resumeData).catch(() => {});
            console.info(`[NativeDownload] Paused ${modelId} — snapshot saved for resume`);
          } else {
            // No resume data: fall back to cancel
            await downloadResumable.cancelAsync().catch(() => {});
          }
        })
        .catch(() => {
          downloadResumable.cancelAsync().catch(() => {});
        });
    });

    let result: { uri: string } | null;
    try {
      result = await downloadResumable.downloadAsync();
    } catch (e: any) {
      if (wasCancelled || signal?.aborted || e?.message?.includes('cancelled')) {
        throw new ModelDownloadCancelledError();
      }
      // Download failed mid-way — clean up partial & snapshot so next attempt starts fresh
      await fs.deleteAsync(dest, { idempotent: true }).catch(() => {});
      await fs.deleteAsync(snap, { idempotent: true }).catch(() => {});
      throw new ModelDownloadError(`Download failed for ${modelId}: ${e?.message ?? e}`);
    }

    if (!result) {
      if (signal?.aborted || wasCancelled) throw new ModelDownloadCancelledError();
      throw new ModelDownloadError(`Download returned null for ${modelId}`);
    }

    // ── Download complete: remove snapshot sidecar ────────────────────────────
    await fs.deleteAsync(snap, { idempotent: true }).catch(() => {});

    // Integrity check
    const info = await fs.getInfoAsync(dest);
    const actualBytes = info.size ?? 0;
    if (expectedBytes > 0 && Math.abs(actualBytes - expectedBytes) > expectedBytes * 0.05 + 1024) {
      await fs.deleteAsync(dest, { idempotent: true });
      throw new ModelIntegrityError(expectedBytes, actualBytes);
    }

    // Write metadata
    const meta: ModelCacheInfo = { modelId, sizeBytes: actualBytes, cachedAt: Date.now() };
    await fs.writeAsStringAsync(metaPath(base, modelId), JSON.stringify(meta));

    onProgress?.({
      percentage: 100, bytesDownloaded: actualBytes,
      totalBytes: actualBytes, speedMBps: 0, etaSeconds: 0,
    });
  }

  async deleteModel(modelId: string): Promise<void> {
    try {
      const fs   = await getFS();
      const base = await this.ensureDir();
      await fs.deleteAsync(modelPath(base, modelId), { idempotent: true });
      await fs.deleteAsync(metaPath(base, modelId), { idempotent: true });
      // Also remove any leftover resume snapshot
      await fs.deleteAsync(partialPath(base, modelId), { idempotent: true });
    } catch { /* ignore */ }
  }

  async getCacheInfo(modelId: string): Promise<ModelCacheInfo | null> {
    try {
      const fs   = await getFS();
      const base = await this.ensureDir();
      const info = await fs.getInfoAsync(metaPath(base, modelId));
      if (!info.exists) return null;
      const raw = await fs.readAsStringAsync(metaPath(base, modelId));
      return JSON.parse(raw) as ModelCacheInfo;
    } catch {
      return null;
    }
  }

  async getTotalCachedBytes(): Promise<number> {
    try {
      const fs   = await getFS();
      const base = await this.ensureDir();
      const dir  = `${base}ai-models/`;
      const list = await fs.readDirectoryAsync(dir);
      let total  = 0;
      for (const file of list) {
        if (!file.endsWith('.onnx')) continue;
        const info = await fs.getInfoAsync(`${dir}${file}`);
        total += info.size ?? 0;
      }
      return total;
    } catch {
      return 0;
    }
  }
}

export const modelDownloadService: IModelDownloadService = new NativeModelDownloadService();

// Re-export shared error classes so Metro-resolved imports (e.g. ModelDownloadGate)
// can destructure ModelDownloadCancelledError / ModelDownloadError from this file
// on Android without them being undefined at runtime.
export {
  ModelDownloadCancelledError,
  ModelIntegrityError,
  ModelDownloadError,
} from './ModelDownloadServiceTypes';

export type {
  DownloadProgress,
  DownloadProgressCallback,
  ModelCacheInfo,
  IModelDownloadService,
} from './ModelDownloadServiceTypes';
