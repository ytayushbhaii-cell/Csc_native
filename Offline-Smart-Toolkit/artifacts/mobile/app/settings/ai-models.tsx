/**
 * AI Models Manager — download, check status, and delete all AI models
 * from one place without needing to open each tool.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@/lib/native/icons';
import { StatusBar } from '@/lib/native/status-bar';
import { useRouter } from '@/lib/native/router';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';
import {
  modelDownloadService,
  ModelDownloadCancelledError,
} from '@/lib/ai/services/ModelDownloadService';
import type { DownloadProgress } from '@/lib/ai/services/ModelDownloadService';

// ─── Model definitions ────────────────────────────────────────────────────────

interface ModelDef {
  id: string;
  name: string;
  description: string;
  sizeBytes: number;
  badge: string;
  badgeColor: string;
  iconColor: string;
  downloadUrl: string;
}

function resolveUrl(envKey: string, webUrl: string, fallback: string): string {
  try {
    const env = process.env as Record<string, string | undefined> | undefined;
    const v = env?.[envKey];
    if (v && v.trim()) return v.trim();
  } catch {}
  if (Platform.OS === 'web') return webUrl || fallback;
  return webUrl || fallback;
}

const MODELS: ModelDef[] = [
  {
    id:          'birefnet',
    name:        'BiRefNet',
    description: 'Best quality — precise hair & fine-edge removal',
    sizeBytes:   44 * 1024 * 1024,
    badge:       'Primary · 44 MB',
    badgeColor:  '#6366F1',
    iconColor:   '#6366F1',
    downloadUrl: resolveUrl(
      'CSC_BIREFNET_MODEL_URL',
      'https://huggingface.co/ZhengPeng7/BiRefNet/resolve/main/onnx/birefnet-q.onnx',
      '/models/birefnet-q.onnx',
    ),
  },
  {
    id:          'u2net',
    name:        'U2Net',
    description: 'Compact 4.4 MB — fast fallback, always available',
    sizeBytes:   4.4 * 1024 * 1024,
    badge:       'Fallback · 4.4 MB',
    badgeColor:  '#10B981',
    iconColor:   '#10B981',
    downloadUrl: resolveUrl(
      'CSC_U2NET_MODEL_URL',
      'https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx',
      '/models/u2netp.onnx',
    ),
  },
  {
    id:          'rmbg2',
    name:        'RMBG-2.0',
    description: 'High-quality InSPyReNet — great for complex backgrounds',
    sizeBytes:   176 * 1024 * 1024,
    badge:       'Recommended · 176 MB',
    badgeColor:  '#F59E0B',
    iconColor:   '#F59E0B',
    downloadUrl: resolveUrl(
      'CSC_RMBG2_MODEL_URL',
      'https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model.onnx',
      '/models/rmbg-2.0.onnx',
    ),
  },
  {
    id:          'ben2',
    name:        'BEN2',
    description: 'Hair & fur refinement — best for curly / fly-away hair',
    sizeBytes:   222 * 1024 * 1024,
    badge:       'Quality Upgrade · 222 MB',
    badgeColor:  '#8B5CF6',
    iconColor:   '#8B5CF6',
    downloadUrl: resolveUrl(
      'CSC_BEN2_MODEL_URL',
      'https://huggingface.co/PramaLLC/BEN2/resolve/main/BEN2_Base.onnx',
      '/models/ben2.onnx',
    ),
  },
  {
    id:          'isnet',
    name:        'IS-Net',
    description: 'Best accuracy for complex scenes & fine details',
    sizeBytes:   178 * 1024 * 1024,
    badge:       'Pro · 178 MB',
    badgeColor:  '#EF4444',
    iconColor:   '#EF4444',
    downloadUrl: resolveUrl(
      'CSC_ISNET_MODEL_URL',
      'https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx',
      '/models/isnet-general.onnx',
    ),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(b: number): string {
  if (b >= 1024 * 1024 * 1024) return `${(b / 1024 ** 3).toFixed(1)} GB`;
  if (b >= 1024 * 1024)        return `${(b / 1024 ** 2).toFixed(1)} MB`;
  if (b >= 1024)               return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}
function fmtSpeed(mbps: number)  { return mbps < 0.01 ? '—' : `${mbps.toFixed(1)} MB/s`; }
function fmtETA(sec: number) {
  if (sec <= 0 || !isFinite(sec)) return '';
  if (sec < 60) return `${Math.ceil(sec)}s remaining`;
  return `${Math.floor(sec / 60)}m ${Math.ceil(sec % 60)}s remaining`;
}

/** True if this URL can be fetched from the internet (not a local relative path). */
function isExternalUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('http://');
}

/** Returns false for relative paths — those files must be bundled locally. */
function isDownloadable(url: string): boolean {
  return isExternalUrl(url);
}

/** Extract a clean, human-friendly error from a raw download error message. */
function friendlyError(raw: string | null): string {
  if (!raw) return 'Download failed.';
  if (raw.includes('404') || raw.includes('not found') || raw.includes('Not Found'))
    return 'Model not publicly available at this source.';
  if (raw.includes('network') || raw.includes('fetch') || raw.includes('Failed to fetch'))
    return 'Network error — check your connection and try again.';
  if (raw.includes('integrity') || raw.includes('bytes'))
    return 'File verification failed — download may have been interrupted.';
  // Strip any URL-like segments from the message
  return raw.replace(/https?:\/\/\S+/g, '').replace(/\/models\/\S+/g, '').trim() || 'Download failed.';
}

/** Filename hint extracted from a local model path, e.g. "/models/rmbg-2.0.onnx" → "rmbg-2.0.onnx" */
function localFilename(url: string): string {
  return url.split('/').pop() ?? url;
}

// ─── Per-model state ──────────────────────────────────────────────────────────

type ModelStatus = 'checking' | 'cached' | 'missing' | 'downloading' | 'deleting' | 'error';

interface ModelState {
  status: ModelStatus;
  progress: DownloadProgress | null;
  error: string | null;
  cachedBytes: number | null;
}

function initState(): ModelState {
  return { status: 'checking', progress: null, error: null, cachedBytes: null };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AiModelsScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { isDark } = useTheme();

  const topPadding    = Platform.OS === 'web' ? 30 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const [states, setStates] = useState<Record<string, ModelState>>(
    () => Object.fromEntries(MODELS.map(m => [m.id, initState()]))
  );

  // one AbortController per model
  const abortRefs = useRef<Record<string, AbortController>>({});

  // ── Check cache on mount ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const m of MODELS) {
        if (cancelled) break;
        try {
          const cached = await modelDownloadService.isModelCached(m.id);
          if (cancelled) break;
          if (cached) {
            const info = await modelDownloadService.getCacheInfo(m.id);
            setStates(prev => ({
              ...prev,
              [m.id]: { status: 'cached', progress: null, error: null, cachedBytes: info?.sizeBytes ?? null },
            }));
          } else {
            setStates(prev => ({
              ...prev,
              [m.id]: { status: 'missing', progress: null, error: null, cachedBytes: null },
            }));
          }
        } catch {
          if (!cancelled)
            setStates(prev => ({
              ...prev,
              [m.id]: { status: 'missing', progress: null, error: null, cachedBytes: null },
            }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Download one model ──────────────────────────────────────────────────
  const downloadModel = useCallback(async (m: ModelDef) => {
    if (!isDownloadable(m.downloadUrl)) {
      setStates(prev => ({
        ...prev,
        [m.id]: { ...prev[m.id], status: 'error', error: 'No download URL configured for this model.' },
      }));
      return;
    }

    const ac = new AbortController();
    abortRefs.current[m.id] = ac;

    setStates(prev => ({
      ...prev,
      [m.id]: { status: 'downloading', progress: null, error: null, cachedBytes: null },
    }));

    try {
      await modelDownloadService.downloadModel(
        m.id,
        m.downloadUrl,
        m.sizeBytes,
        (p) => {
          if (!ac.signal.aborted)
            setStates(prev => ({ ...prev, [m.id]: { ...prev[m.id], progress: p } }));
        },
        ac.signal,
      );
      const info = await modelDownloadService.getCacheInfo(m.id);
      setStates(prev => ({
        ...prev,
        [m.id]: { status: 'cached', progress: null, error: null, cachedBytes: info?.sizeBytes ?? null },
      }));
    } catch (e: any) {
      if (e instanceof ModelDownloadCancelledError || ac.signal.aborted) {
        setStates(prev => ({
          ...prev,
          [m.id]: { status: 'missing', progress: null, error: 'Download cancelled.', cachedBytes: null },
        }));
      } else {
        setStates(prev => ({
          ...prev,
          [m.id]: { status: 'error', progress: null, error: friendlyError(e?.message ?? null), cachedBytes: null },
        }));
      }
    }
  }, []);

  // ── Download ALL missing ────────────────────────────────────────────────
  const downloadAll = useCallback(async () => {
    for (const m of MODELS) {
      const s = states[m.id];
      if (s.status === 'cached' || s.status === 'downloading') continue;
      if (!isDownloadable(m.downloadUrl)) continue;
      await downloadModel(m);
    }
  }, [states, downloadModel]);

  // ── Cancel one ─────────────────────────────────────────────────────────
  const cancelDownload = useCallback((id: string) => {
    abortRefs.current[id]?.abort();
  }, []);

  // ── Delete one ─────────────────────────────────────────────────────────
  const deleteModel = useCallback(async (id: string) => {
    setStates(prev => ({
      ...prev,
      [id]: { ...prev[id], status: 'deleting' },
    }));
    try {
      await modelDownloadService.deleteModel(id);
    } catch {}
    setStates(prev => ({
      ...prev,
      [id]: { status: 'missing', progress: null, error: null, cachedBytes: null },
    }));
  }, []);

  // ── Summary bar counts (only downloadable models count as "missing") ────
  const cachedCount    = MODELS.filter(m => states[m.id]?.status === 'cached').length;
  const missingCount   = MODELS.filter(m => isDownloadable(m.downloadUrl) && (states[m.id]?.status === 'missing' || states[m.id]?.status === 'error')).length;
  const downloadingNow = MODELS.some(m => states[m.id]?.status === 'downloading');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, {
        paddingTop: topPadding + 10,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            AI Models
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {cachedCount}/{MODELS.length} downloaded
          </Text>
        </View>
        {missingCount > 0 && !downloadingNow && (
          <TouchableOpacity
            onPress={downloadAll}
            style={[styles.downloadAllBtn, { backgroundColor: '#6366F1' }]}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="download-multiple" size={16} color="#fff" />
            <Text style={[styles.downloadAllText, { fontFamily: 'Inter_700Bold' }]}>
              Download All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: '#6366F10D', borderColor: '#6366F130' }]}>
        <MaterialCommunityIcons name="information-outline" size={16} color="#6366F1" />
        <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          Models are stored on your device and work 100% offline. Download once, use forever.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding + 20, gap: 12, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {MODELS.map(m => (
          <ModelCard
            key={m.id}
            model={m}
            state={states[m.id] ?? initState()}
            colors={colors}
            onDownload={() => downloadModel(m)}
            onCancel={() => cancelDownload(m.id)}
            onDelete={() => deleteModel(m.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── ModelCard ────────────────────────────────────────────────────────────────

interface CardProps {
  model: ModelDef;
  state: ModelState;
  colors: ReturnType<typeof useColors>;
  onDownload: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

function ModelCard({ model: m, state: s, colors, onDownload, onCancel, onDelete }: CardProps) {
  const pct = s.progress?.percentage ?? 0;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (s.status === 'cached') {
      Animated.spring(checkAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
    } else {
      checkAnim.setValue(0);
    }
  }, [s.status]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top row */}
      <View style={styles.cardTop}>
        {/* Icon */}
        <View style={[styles.modelIcon, { backgroundColor: m.iconColor + '18' }]}>
          <MaterialCommunityIcons name="brain" size={22} color={m.iconColor} />
        </View>

        {/* Name + desc */}
        <View style={styles.modelMeta}>
          <View style={styles.modelNameRow}>
            <Text style={[styles.modelName, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              {m.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: m.badgeColor + '1A' }]}>
              <Text style={[styles.badgeText, { color: m.badgeColor, fontFamily: 'Inter_600SemiBold' }]}>
                {m.badge}
              </Text>
            </View>
          </View>
          <Text style={[styles.modelDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {m.description}
          </Text>
        </View>
      </View>

      {/* Status / action area */}
      {s.status === 'checking' && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={colors.mutedForeground} />
          <Text style={[styles.statusText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Checking…
          </Text>
        </View>
      )}

      {(s.status === 'missing' || s.status === 'error') && (
        <View style={styles.actionArea}>
          {/* Local-only: file must be placed manually */}
          {!isDownloadable(m.downloadUrl) ? (
            <View style={[styles.unavailRow, { backgroundColor: colors.border + '50', borderRadius: 8 }]}>
              <MaterialCommunityIcons name="folder-arrow-down-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.unavailText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Not available online.{'\n'}
                <Text style={{ fontFamily: 'Inter_600SemiBold' }}>
                  Place {localFilename(m.downloadUrl)} in{' '}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular' }}>
                  public/models/ folder to enable.
                </Text>
              </Text>
            </View>
          ) : (
            /* External URL — show error (clean) + retry button */
            <>
              {s.error && (
                <View style={[styles.errorRow, { backgroundColor: '#EF444410', borderRadius: 7 }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#EF4444" />
                  <Text style={[styles.errorText, { color: '#EF4444', fontFamily: 'Inter_400Regular', flex: 1 }]}>
                    {s.error}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: m.iconColor }]}
                onPress={onDownload}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="download-outline" size={16} color="#fff" />
                <Text style={[styles.actionBtnText, { fontFamily: 'Inter_700Bold' }]}>
                  {s.status === 'error' ? 'Retry' : 'Download'} · {fmtBytes(m.sizeBytes)}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {s.status === 'downloading' && (
        <View style={styles.downloadArea}>
          {/* Progress bar */}
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: m.iconColor }]} />
          </View>
          {/* Stats */}
          <View style={styles.statsRow}>
            <Text style={[styles.pctText, { color: m.iconColor, fontFamily: 'Inter_700Bold' }]}>
              {Math.round(pct)}%
            </Text>
            {s.progress && (
              <>
                <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {fmtBytes(s.progress.bytesDownloaded)} / {fmtBytes(s.progress.totalBytes)}
                </Text>
                <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginLeft: 'auto' as any }]}>
                  {fmtSpeed(s.progress.speedMBps)}
                </Text>
              </>
            )}
          </View>
          {s.progress && !!s.progress.etaSeconds && (
            <Text style={[styles.etaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {fmtETA(s.progress.etaSeconds)}
            </Text>
          )}
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {s.status === 'cached' && (
        <Animated.View
          style={[styles.cachedRow, { opacity: checkAnim, transform: [{ scale: checkAnim }] }]}
        >
          <View style={[styles.cachedPill, { backgroundColor: '#22C55E14', borderColor: '#22C55E30' }]}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#22C55E" />
            <Text style={[styles.cachedText, { color: '#22C55E', fontFamily: 'Inter_600SemiBold' }]}>
              Downloaded{s.cachedBytes ? ` · ${fmtBytes(s.cachedBytes)}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDelete}
            style={[styles.deleteBtn, { borderColor: colors.border }]}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="delete-outline" size={15} color="#EF4444" />
            <Text style={[styles.deleteText, { color: '#EF4444', fontFamily: 'Inter_500Medium' }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {s.status === 'deleting' && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#EF4444" />
          <Text style={[styles.statusText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Deleting…
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:       { flex: 1 },
  header:       {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingBottom: 12,
    borderBottomWidth: 1, gap: 4,
  },
  backBtn:      { padding: 8, borderRadius: 8 },
  headerText:   { flex: 1 },
  headerTitle:  { fontSize: 18 },
  headerSub:    { fontSize: 12, marginTop: 1 },
  downloadAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  downloadAllText: { color: '#fff', fontSize: 13 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    margin: 16, marginBottom: 0, padding: 10,
    borderRadius: 8, borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },

  // Card
  card: {
    borderRadius: 14, borderWidth: 1,
    padding: 14, gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modelIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modelMeta: { flex: 1, gap: 4 },
  modelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  modelName:  { fontSize: 15 },
  badge:      { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  badgeText:  { fontSize: 10, letterSpacing: 0.2 },
  modelDesc:  { fontSize: 12, lineHeight: 17 },

  // Status
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  statusText: { fontSize: 13 },

  // Action
  actionArea: { gap: 8 },
  errorRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 7, padding: 8 },
  errorText:  { fontSize: 12, lineHeight: 17 },
  unavailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  unavailText:{ flex: 1, fontSize: 12, lineHeight: 18 },
  actionBtn:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 14 },

  // Downloading
  downloadArea: { gap: 6 },
  track:        { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill:         { height: '100%', borderRadius: 3 },
  statsRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pctText:      { fontSize: 20 },
  statText:     { fontSize: 12 },
  etaText:      { fontSize: 11 },
  cancelBtn:    { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 14 },
  cancelText:   { fontSize: 12 },

  // Cached
  cachedRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cachedPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1,
  },
  cachedText: { fontSize: 12 },
  deleteBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1,
  },
  deleteText: { fontSize: 12 },
});
