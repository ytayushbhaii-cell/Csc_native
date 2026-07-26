/**
 * ModelDownloadGate — gates any AI tool behind model availability.
 *
 * Behaviour:
 *  1. Mounts → immediately checks if required models are cached.
 *  2. If all required models are cached → renders `null` (gate is open).
 *  3. If any model is missing → renders a download card with:
 *       • Download size and required device storage
 *       • Download button
 *       • Real progress: %, MB downloaded / total, speed MB/s, ETA
 *       • "Offline processing is ready" on completion
 *  4. Parent component is responsible for not rendering the tool UI
 *     while `isReady === false`.
 *
 * Usage:
 *   const [modelsReady, setModelsReady] = useState(false);
 *   ...
 *   <ModelDownloadGate
 *     modelIds={['birefnet', 'u2net']}
 *     onReady={() => setModelsReady(true)}
 *     accentColor={color}
 *   />
 *   {modelsReady && <ToolContent />}
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ActivityIndicator, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@/lib/native/icons';
import { useColors } from '@/hooks/useColors';
// Import via platform entrypoint — Metro resolves .web.ts / .native.ts automatically.
// Never import directly from ModelDownloadService.web or .native.
import {
  modelDownloadService,
  ModelDownloadCancelledError,
} from '@/lib/ai/services/ModelDownloadService';
import type { DownloadProgress } from '@/lib/ai/services/ModelDownloadService';

// ─── Model metadata used by the UI ───────────────────────────────────────────

interface ModelSpec {
  id: string;
  name: string;
  description: string;
  /** Expected bytes on disk */
  sizeBytes: number;
  /** Download URL (can be same-origin path or full URL) */
  downloadUrl: string;
}

// ─── Model URL resolver ───────────────────────────────────────────────────────
//
// On Android/iOS the app is a native binary — relative URL paths like
// '/models/birefnet-q.onnx' are meaningless (no web server running).
// All model URLs MUST be absolute HTTPS URLs for native platforms.
//
// Priority (highest → lowest):
//   1. CSC_<ID>_MODEL_URL environment variable (set before the native build)
//   2. Known public default URLs (only available for U2Net-Portrait 4.4 MB)
//   3. Relative path fallback (web preview only)
//
// Configure these in the native build environment when hosting private copies:
//     CSC_BIREFNET_MODEL_URL   — your BiRefNet .onnx HTTPS URL (~44 MB)
//     CSC_RMBG2_MODEL_URL      — your RMBG-2.0 .onnx HTTPS URL (~90 MB)
//     CSC_U2NET_MODEL_URL      — your U2Net .onnx HTTPS URL (~4.4 MB)
//     CSC_ISNET_MODEL_URL      — your IS-Net .onnx HTTPS URL (~176 MB)
//     CSC_BEN2_MODEL_URL       — your BEN2 .onnx HTTPS URL (~180 MB)

function env(key: string): string | null {
  try {
    const v = (process.env as Record<string, string | undefined> | undefined)?.[key];
    return v && v.trim().length > 0 ? v.trim() : null;
  } catch { return null; }
}

/**
 * Resolves a model download URL with platform-aware priority:
 *   1. CSC_*_MODEL_URL env var override (all platforms)
 *   2. webUrl — HuggingFace / CDN URL used on web for models not bundled locally
 *      (birefnet & u2net are served via webpack from public/models/, large optional
 *       models like BEN2 use HuggingFace since no local copy exists)
 *   3. relativeFallback — webpack-served relative path (web, bundled models)
 *   4. nativeDefault — absolute HTTPS URL for native APK builds
 */
function resolveModelUrl(
  envKey: string,
  nativeDefault: string,
  relativeFallback: string,
  webUrl?: string,            // external URL used on web when local file isn't bundled
): string {
  const fromEnv = env(envKey);
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'web') return webUrl || relativeFallback;
  if (nativeDefault) return nativeDefault;
  return relativeFallback;
}

// These match onnxBackend.ts MODEL_CONFIGS and BEN2Backend.ts.
// The primary model is tried first; fallback models are downloaded alongside.
const MODEL_SPECS: Record<string, ModelSpec> = {
  birefnet: {
    id:          'birefnet',
    name:        'BiRefNet',
    description: 'Primary segmentation — best edge detail',
    sizeBytes:   44 * 1024 * 1024,
    downloadUrl: resolveModelUrl(
      'CSC_BIREFNET_MODEL_URL',
      'https://huggingface.co/ZhengPeng7/BiRefNet/resolve/main/onnx/birefnet-q.onnx',
      '/models/birefnet-q.onnx',
    ),
  },
  ben2: {
    id:          'ben2',
    name:        'BEN2',
    description: 'Hair & fur refinement — cleaner edges on curly/fly-away hair',
    sizeBytes:   222 * 1024 * 1024,
    downloadUrl: resolveModelUrl(
      'CSC_BEN2_MODEL_URL',
      // PramaLLC/BEN2 — Background Erase Network v2 (Apache 2.0)
      'https://huggingface.co/PramaLLC/BEN2/resolve/main/BEN2_Base.onnx',
      '/models/ben2.onnx',
      // On web, HuggingFace URL is used since ben2.onnx is not bundled locally
      'https://huggingface.co/PramaLLC/BEN2/resolve/main/BEN2_Base.onnx',
    ),
  },
  rmbg2: {
    id:          'rmbg2',
    name:        'RMBG-2.0',
    description: 'High-quality fallback for low-memory devices',
    sizeBytes:   176 * 1024 * 1024,
    downloadUrl: resolveModelUrl(
      'CSC_RMBG2_MODEL_URL',
      'https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model.onnx',
      '/models/rmbg-2.0.onnx',
      'https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model.onnx',
    ),
  },
  u2net: {
    id:          'u2net',
    name:        'U2Net',
    description: 'Compact 4.4 MB fallback model',
    sizeBytes:   4.4 * 1024 * 1024,
    downloadUrl: resolveModelUrl(
      'CSC_U2NET_MODEL_URL',
      'https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx',
      '/models/u2netp.onnx',
    ),
  },
  isnet: {
    id:          'isnet',
    name:        'IS-Net',
    description: 'Best accuracy for complex scenes',
    sizeBytes:   178 * 1024 * 1024,
    downloadUrl: resolveModelUrl(
      'CSC_ISNET_MODEL_URL',
      'https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx',
      '/models/isnet-general.onnx',
      'https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx',
    ),
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * On native (Android/iOS) a model can only be downloaded if its URL is an
 * absolute HTTPS/HTTP address — relative paths like '/models/x.onnx' have no
 * server to resolve them.  Returns false for those paths so the gate can skip
 * the model gracefully rather than showing a broken download error.
 */
function isDownloadableOnCurrentPlatform(url: string): boolean {
  if (Platform.OS === 'web') return true; // web can handle relative paths
  return url.startsWith('https://') || url.startsWith('http://');
}

function fmtBytes(b: number): string {
  if (b >= 1024 * 1024 * 1024) return `${(b / (1024 ** 3)).toFixed(1)} GB`;
  if (b >= 1024 * 1024)        return `${(b / (1024 ** 2)).toFixed(1)} MB`;
  if (b >= 1024)               return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

function fmtSpeed(mbps: number): string {
  if (mbps < 0.01) return '—';
  return `${mbps.toFixed(1)} MB/s`;
}

function fmtETA(sec: number): string {
  if (sec <= 0 || !isFinite(sec)) return '—';
  if (sec < 60)  return `${Math.ceil(sec)}s remaining`;
  const m = Math.floor(sec / 60), s = Math.ceil(sec % 60);
  return `${m}m ${s}s remaining`;
}

// ─── ModelDownloadGate ────────────────────────────────────────────────────────

interface Props {
  /** Required model IDs — gate stays closed until all are cached */
  modelIds: string[];
  /**
   * Optional model IDs — attempted after required ones but silently skipped
   * on any error (404, no URL, cancelled). Gate opens regardless.
   */
  optionalModelIds?: string[];
  /** Called once all required models are ready */
  onReady: () => void;
  accentColor?: string;
}

type GateState =
  | 'checking'        // initial check in progress
  | 'ready'           // all models cached — gate open
  | 'needs_download'  // at least one model missing (or failed) — shows download card + any error msg
  | 'downloading'     // download in progress
  | 'success';        // just finished downloading — transitions to ready after animation

interface DownloadState {
  progress: DownloadProgress | null;
  currentIndex: number;
  totalModels: number;
}

export function ModelDownloadGate({ modelIds, optionalModelIds = [], onReady, accentColor = '#6366F1' }: Props) {
  const colors = useColors();

  const [gateState, setGateState] = useState<GateState>('checking');
  const [error, setError]         = useState<string | null>(null);
  const [dlState, setDlState]     = useState<DownloadState>({
    progress: null, currentIndex: 0, totalModels: 0,
  });

  const abortRef = useRef<AbortController | null>(null);
  const successAnim = useRef(new Animated.Value(0)).current;

  // ── Helper: filter to IDs that have a spec + downloadable URL ────────────
  function validFor(ids: string[]) {
    return ids.filter(id => {
      const spec = MODEL_SPECS[id];
      return spec != null && isDownloadableOnCurrentPlatform(spec.downloadUrl);
    });
  }

  // ── Check cache on mount ──────────────────────────────────────────────────
  // Gate opens only when all *required* models are cached.
  // Optional models are ignored for the open/closed decision.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const validRequired = validFor(modelIds);
        if (validRequired.length === 0) {
          if (!cancelled) { setGateState('ready'); onReady(); }
          return;
        }
        const checks = await Promise.all(validRequired.map(id => modelDownloadService.isModelCached(id)));
        if (cancelled) return;
        if (checks.every(Boolean)) { setGateState('ready'); onReady(); }
        else { setGateState('needs_download'); }
      } catch {
        if (!cancelled) setGateState('needs_download');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Animate success banner ────────────────────────────────────────────────
  useEffect(() => {
    if (gateState === 'success') {
      Animated.sequence([
        Animated.timing(successAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(2000),
      ]).start(() => { setGateState('ready'); onReady(); });
    }
  }, [gateState]);

  // ── Download handler ──────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    const validRequired = validFor(modelIds);
    const validOptional = validFor(optionalModelIds);

    // If no required models need downloading, open immediately
    if (validRequired.length === 0) { setGateState('ready'); onReady(); return; }

    setGateState('downloading');
    setError(null);
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    // ── Download required models first — any failure blocks the gate ─────
    let downloadedCount = 0;
    const allIds = [...validRequired, ...validOptional];

    for (const modelId of allIds) {
      if (signal.aborted) break;

      const spec = MODEL_SPECS[modelId];
      if (!spec) continue;

      const isOptional = !validRequired.includes(modelId);

      // Skip if already cached
      const alreadyCached = await modelDownloadService.isModelCached(modelId);
      if (alreadyCached) { downloadedCount++; continue; }

      setDlState({
        progress: null,
        currentIndex: downloadedCount,
        totalModels: allIds.length,
      });

      try {
        await modelDownloadService.downloadModel(
          modelId,
          spec.downloadUrl,
          spec.sizeBytes,
          (p) => { if (!signal.aborted) setDlState(prev => ({ ...prev, progress: p })); },
          signal,
        );
        downloadedCount++;
      } catch (e: any) {
        if (e instanceof ModelDownloadCancelledError || signal.aborted) {
          setGateState('needs_download');
          setError('Download cancelled.');
          return;
        }
        if (isOptional) {
          // Optional model failed (e.g. 404 — file not hosted yet): skip silently.
          console.warn(`[ModelDownloadGate] Optional model ${modelId} skipped: ${e?.message ?? e}`);
          continue;
        }
        // Required model failed — keep gate closed and show actionable error.
        const detail    = e?.message ? `: ${e.message}` : '';
        console.error(`[ModelDownloadGate] Required model ${modelId} failed${detail}`);
        setGateState('needs_download');
        setError(`Could not download the required files${detail}. Check your connection and try again.`);
        return;
      }
    }

    if (signal.aborted) return;

    // Final verification — only required models must be cached to declare success.
    const verifyChecks = await Promise.all(validRequired.map(id => modelDownloadService.isModelCached(id)));
    const uncachedIds  = validRequired.filter((_, i) => !verifyChecks[i]);
    if (uncachedIds.length > 0) {
      setGateState('needs_download');
      setError('File verification failed. The download may have been interrupted. Please try again.');
      return;
    }

    setGateState('success');
  }, [modelIds, optionalModelIds, onReady]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ── Render: checking ─────────────────────────────────────────────────────
  if (gateState === 'checking') {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 12 }]}>
        <ActivityIndicator color={accentColor} size="small" />
        <Text style={[styles.checkingText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          Checking AI model status…
        </Text>
      </View>
    );
  }

  // ── Render: ready / open ──────────────────────────────────────────────────
  if (gateState === 'ready') return null;

  // ── Render: success banner ────────────────────────────────────────────────
  if (gateState === 'success') {
    return (
      <Animated.View
        style={[styles.successCard, { backgroundColor: '#22C55E14', borderColor: '#22C55E30', borderRadius: 12, opacity: successAnim }]}
      >
        <MaterialCommunityIcons name="check-circle" size={22} color="#22C55E" />
        <View style={styles.successTextBlock}>
          <Text style={[styles.successTitle, { color: '#22C55E', fontFamily: 'Inter_700Bold' }]}>
             Offline Processing Ready
          </Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Background removal is now available offline
          </Text>
        </View>
      </Animated.View>
    );
  }

  // ── Shared: model list for needs_download and downloading ─────────────────
  const validRequired = validFor(modelIds);
  const validOptional = validFor(optionalModelIds);
  const allValidIds   = [...validRequired, ...validOptional];
  const totalSize     = allValidIds.reduce((s, id) => s + (MODEL_SPECS[id]?.sizeBytes ?? 0), 0);

  // ── Render: needs_download ────────────────────────────────────────────────
  if (gateState === 'needs_download') {
    const requiredSize = validRequired.reduce((s, id) => s + (MODEL_SPECS[id]?.sizeBytes ?? 0), 0);
    const optionalSize = validOptional.reduce((s, id) => s + (MODEL_SPECS[id]?.sizeBytes ?? 0), 0);

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 12 }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="robot-love-outline" size={24} color={accentColor} />
          <View style={styles.headerText}>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              AI Models Required
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Download once — works fully offline forever
            </Text>
          </View>
        </View>

        {/* Required models */}
        <View style={[styles.modelSection, { borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              Core Pack
            </Text>
            <View style={[styles.badge, { backgroundColor: accentColor + '20' }]}>
              <Text style={[styles.badgeText, { color: accentColor, fontFamily: 'Inter_600SemiBold' }]}>
                Required · {fmtBytes(requiredSize)}
              </Text>
            </View>
          </View>
          {validRequired.map(id => {
            const spec = MODEL_SPECS[id];
            if (!spec) return null;
            return (
              <View key={id} style={styles.modelRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={14} color={accentColor} />
                <View style={styles.modelInfo}>
                  <Text style={[styles.modelName, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                    {spec.name}
                    <Text style={[styles.modelSize, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      {' '}· {fmtBytes(spec.sizeBytes)}
                    </Text>
                  </Text>
                  <Text style={[styles.modelDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {spec.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Optional models (only show if any are downloadable) */}
        {validOptional.length > 0 && (
          <View style={[styles.modelSection, { borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                Quality Upgrade Pack
              </Text>
              <View style={[styles.badge, { backgroundColor: '#22C55E20' }]}>
                <Text style={[styles.badgeText, { color: '#22C55E', fontFamily: 'Inter_600SemiBold' }]}>
                  Recommended · {fmtBytes(optionalSize)}
                </Text>
              </View>
            </View>
            {validOptional.map(id => {
              const spec = MODEL_SPECS[id];
              if (!spec) return null;
              return (
                <View key={id} style={styles.modelRow}>
                  <MaterialCommunityIcons name="star-outline" size={14} color="#22C55E" />
                  <View style={styles.modelInfo}>
                    <Text style={[styles.modelName, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                      {spec.name}
                      <Text style={[styles.modelSize, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                        {' '}· {fmtBytes(spec.sizeBytes)}
                      </Text>
                    </Text>
                    <Text style={[styles.modelDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      {spec.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Total storage */}
        <View style={[styles.storageRow, { backgroundColor: accentColor + '0D', borderRadius: 8 }]}>
          <MaterialCommunityIcons name="sd" size={14} color={accentColor} />
          <Text style={[styles.storageText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Total ~{fmtBytes(totalSize)} device storage required
          </Text>
        </View>

        {error && (
          <Text style={[styles.errorText, { color: '#EF4444', fontFamily: 'Inter_400Regular' }]}>
            {error}
          </Text>
        )}

        {/* Download button */}
        <TouchableOpacity
          style={[styles.downloadBtn, { backgroundColor: accentColor, borderRadius: 8 }]}
          onPress={handleDownload}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="download-outline" size={18} color="#fff" />
          <Text style={[styles.downloadBtnText, { fontFamily: 'Inter_700Bold' }]}>
            Download All Models
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render: downloading ───────────────────────────────────────────────────
  const { progress, currentIndex, totalModels } = dlState;
  const pct = progress?.percentage ?? 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 12 }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <ActivityIndicator color={accentColor} size="small" />
        <View style={styles.headerText}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            Downloading Offline Processing Files
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Preparing offline processing
            {totalModels > 1 ? ` (${currentIndex + 1} of ${totalModels})` : ''}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[styles.progressFill, { width: `${pct}%`, backgroundColor: accentColor }]}
        />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={[styles.statPct, { color: accentColor, fontFamily: 'Inter_700Bold' }]}>
          {Math.round(pct)}%
        </Text>
        {progress && (
          <>
            <Text style={[styles.statBytes, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {fmtBytes(progress.bytesDownloaded)} / {fmtBytes(progress.totalBytes)}
            </Text>
            <Text style={[styles.statSpeed, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {fmtSpeed(progress.speedMBps)}
            </Text>
          </>
        )}
      </View>

      {progress && (
        <Text style={[styles.etaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {fmtETA(progress.etaSeconds)}
        </Text>
      )}

      {/* Cancel */}
      <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.75}>
        <Text style={[styles.cancelText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card:           { padding: 16, borderWidth: 1, gap: 12 },
  checkingText:   { fontSize: 13 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText:     { flex: 1 },
  cardTitle:      { fontSize: 15 },
  cardSub:        { fontSize: 12, marginTop: 2 },
  storageRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  storageText:    { fontSize: 11, flex: 1 },
  errorText:      { fontSize: 12 },
  downloadBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  downloadBtnText:{ color: '#fff', fontSize: 14 },
  progressTrack:  { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 3 },
  statsRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statPct:        { fontSize: 22 },
  statBytes:      { fontSize: 12 },
  statSpeed:      { fontSize: 12, marginLeft: 'auto' as any },
  etaText:        { fontSize: 11 },
  cancelBtn:      { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 16 },
  cancelText:     { fontSize: 12 },
  successCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1 },
  successTextBlock:{ flex: 1 },
  successTitle:   { fontSize: 14 },
  successSub:     { fontSize: 12, marginTop: 2 },
  // Model list styles
  modelSection:   { borderWidth: 1, borderRadius: 8, padding: 10, gap: 8 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle:   { fontSize: 12, letterSpacing: 0.2 },
  badge:          { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeText:      { fontSize: 10, letterSpacing: 0.3 },
  modelRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  modelInfo:      { flex: 1 },
  modelName:      { fontSize: 12 },
  modelSize:      { fontSize: 11 },
  modelDesc:      { fontSize: 11, marginTop: 1 },
});
