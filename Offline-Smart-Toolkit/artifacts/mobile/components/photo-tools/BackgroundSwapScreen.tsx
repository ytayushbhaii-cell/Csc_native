/**
 * Background Swap Screen — v5 upgrade.
 *
 * New in v5 (over v4):
 *  • Export format selector — PNG (transparent), JPG, WEBP after result
 *  • Custom background color — hex color input when "Custom" preset is selected
 *  • Processing time display — real elapsed time shown during & after processing
 *  • Export step — dedicated "Exporting…" progress step
 *  • Updated AI pipeline banner — accurately describes the full pipeline:
 *    BiRefNet + PyMatting Guided Filter + BEN2 refinement + Alpha Matte
 *
 * Previous v4 features preserved unchanged:
 *  • ModelDownloadGate — download gate with %, speed, ETA, retry
 *  • Cancel button
 *  • Quality mode selector — Standard / HD
 *  • Interactive before/after slider
 *  • Live model badge
 *  • Multi-model fallback indicator
 *  • All existing colors, icons, layouts, animations
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ToolScreenLayout } from './ToolScreenLayout';
import { StatusBanner } from './StatusBanner';
import { ResultActions } from './ResultActions';
import { ImageUploadWidget } from './ImageUploadWidget';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { ProcessingSteps, makeSteps, updateStep } from './ProcessingSteps';
import { AIModelBadge } from './AIModelBadge';
import { ModelDownloadGate } from './ModelDownloadGate';
import {
  removeBackground,
  type QualityMode,
  type SegmentationStepCallback,
} from '@/lib/photoTools/segmentation';
import { exportFile, guessFileName, convertToFormat } from '@/lib/photoTools/exportUtils';
import { addRecentFile, recordToolUsage } from '@/lib/photoTools/db';
import type { PickedImage, BackgroundPreset } from '@/lib/photoTools/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PresetOption {
  id: BackgroundPreset;
  label: string;
  swatch: string;
}

interface BackgroundSwapScreenProps {
  toolId: string;
  title: string;
  subtitle: string;
  iconName: string;
  color: string;
  presets: PresetOption[];
  defaultPreset: BackgroundPreset;
}

// ─── Processing step definitions ─────────────────────────────────────────────
// IDs match the step callbacks emitted by SegmentationService

const STANDARD_STEPS = [
  { id: 'decode',  label: 'Loading image at original resolution…' },
  { id: 'analyze', label: 'Analyzing subject & routing AI model…' },
  { id: 'detect',  label: 'Detecting Subject (BiRefNet AI)…' },
  { id: 'ben2',    label: 'BEN2 Hair & Edge Refinement…' },
  { id: 'refine',  label: 'PyMatting Alpha Matte Refinement…' },
  { id: 'edges',   label: 'Edge Smoothing & Halo Removal…' },
  { id: 'encode',  label: 'Generating Transparent PNG…' },
];

const HD_STEPS = [
  { id: 'decode',  label: 'Loading image at original resolution…' },
  { id: 'analyze', label: 'Analyzing subject & selecting HD pipeline…' },
  { id: 'detect',  label: 'Running BiRefNet HD (1024×1024)…' },
  { id: 'ben2',    label: 'BEN2 Sub-pixel Hair Refinement…' },
  { id: 'refine',  label: 'PyMatting Quad-pass Guided Filter…' },
  { id: 'edges',   label: 'Alpha Matte + Halo Removal (HD)…' },
  { id: 'encode',  label: 'Generating HD Transparent PNG…' },
];

// ─── Required models for the download gate ────────────────────────────────────
// birefnet: primary high-quality model
// u2net:    compact fallback — always downloaded as a safety net
//
// ben2 and rmbg2 are OPTIONAL — the pipeline handles them gracefully when absent:
//  • BEN2Backend falls back to CPU refinement if ben2.onnx is not cached
//  • RMBG-2.0 is skipped silently if not cached (u2net takes its place)
const REQUIRED_MODEL_IDS = ['birefnet', 'u2net'];

// ─── Export format type ───────────────────────────────────────────────────────
type ExportFormat = 'png' | 'jpg' | 'webp';

// ─── Hex color helpers ────────────────────────────────────────────────────────

function hexToRGB(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
}

function isValidHex(hex: string): boolean {
  return hexToRGB(hex) !== null;
}

function fmtSeconds(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60), rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BackgroundSwapScreen({
  toolId, title, subtitle, iconName, color, presets, defaultPreset,
}: BackgroundSwapScreenProps) {
  const colors = useColors();

  // ── State ─────────────────────────────────────────────────────────────────
  // Gate starts closed on all platforms — ModelDownloadGate checks cache and
  // prompts download if needed (both web and native use ONNX now).
  const [modelsReady, setModelsReady] = useState(false);
  const [image, setImage]   = useState<PickedImage | null>(null);
  const [preset, setPreset] = useState<BackgroundPreset>(defaultPreset);
  const [customHex, setCustomHex] = useState('#FFFFFF');
  const [quality, setQuality] = useState<QualityMode>('standard');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [steps, setSteps]   = useState(makeSteps(STANDARD_STEPS));
  const [error, setError]   = useState<string | null>(null);
  const [result, setResult] = useState<{
    uri: string; width: number; height: number; modelName: string;
  } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [processingMs, setProcessingMs] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsedDisplay, setElapsedDisplay] = useState('');

  // ── Tick elapsed timer during processing ──────────────────────────────────
  useEffect(() => {
    if (processing) {
      startTimeRef.current = Date.now();
      elapsedRef.current = setInterval(() => {
        setElapsedDisplay(fmtSeconds(Date.now() - startTimeRef.current));
      }, 500);
    } else {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
      setElapsedDisplay('');
    }
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, [processing]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setImage(null); setResult(null); setError(null);
    setSteps(makeSteps(quality === 'hd' ? HD_STEPS : STANDARD_STEPS));
    setProgress(0); setCancelling(false); setProcessingMs(null);
    setExportFormat('png');
  }, [quality]);

  const tick = useCallback((id: string, status: 'running' | 'done' | 'error') => {
    setSteps((s) => updateStep(s, id, status));
  }, []);

  // ── Cancel handler ────────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    setCancelling(true);
    abortRef.current?.abort();
  }, []);

  // ── Process ───────────────────────────────────────────────────────────────
  const process = useCallback(async () => {
    if (!image) return;
    const isHD      = quality === 'hd';
    const stepDefs  = isHD ? HD_STEPS : STANDARD_STEPS;

    setProcessing(true);
    setCancelling(false);
    setError(null);
    setSteps(makeSteps(stepDefs));
    setProgress(0);
    setProcessingMs(null);

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    // Step callback wired directly to the AI pipeline for real status
    const stepCb: SegmentationStepCallback = {
      onStep: (id, status) => tick(id, status),
    };

    // Resolve custom color for 'custom' preset
    const customColor = preset === 'custom' ? (hexToRGB(customHex) ?? [255, 255, 255]) : undefined;

    const t0 = Date.now();
    try {
      const out = await removeBackground(
        image.uri,
        preset,
        customColor,
        (pct) => setProgress(pct),
        quality,
        stepCb,
        signal,
      );

      const elapsed = Date.now() - t0;
      setProcessingMs(elapsed);

      // Ensure all steps show done
      for (const s of stepDefs) tick(s.id, 'done');
      setProgress(100);

      const modelName = out.modelName ?? 'ONNX';
      setResult({ ...out, modelName });
      const fileName = guessFileName(toolId, 'png');
      recordToolUsage(toolId).catch(() => {});
      addRecentFile({ toolId, toolName: title, fileName, resultUri: out.uri }).catch(() => {});
    } catch (e: any) {
      const isCancel = e?.name === 'AbortError' || e?.message?.includes('cancelled');
      if (isCancel) {
        setProcessing(false);
        setCancelling(false);
        setSteps(makeSteps(stepDefs));
        setProgress(0);
        return;
      }
      tick('detect', 'error');
      setError(
        e?.message?.includes('fetch') || e?.message?.includes('network')
          ? 'Could not load segmentation model. Download AI models first.'
          : `Processing failed: ${e?.message ?? 'unknown error'}`,
      );
    } finally {
      setProcessing(false);
      setCancelling(false);
    }
  }, [image, preset, customHex, quality, tick, toolId, title]);

  // ── Export with format conversion ─────────────────────────────────────────
  const handleExport = useCallback(async () => {
    if (!result) return;
    setExporting(true);
    try {
      const { uri, ext } = await convertToFormat(result.uri, exportFormat);
      const fileName = guessFileName(toolId, ext);
      await exportFile(uri, fileName);
    } finally {
      setExporting(false);
    }
  }, [result, exportFormat, toolId]);

  const handleHDExport = useCallback(async () => {
    if (!result) return;
    setExporting(true);
    try {
      const { uri, ext } = await convertToFormat(result.uri, exportFormat);
      const fileName = guessFileName(`${toolId}-HD`, ext);
      await exportFile(uri, fileName);
    } finally {
      setExporting(false);
    }
  }, [result, exportFormat, toolId]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ToolScreenLayout title={title} subtitle={subtitle} iconName={iconName} color={color} onReset={reset}>

      {/* ── Model download gate — shown on all platforms until models are cached.
           On native: ONNX models are downloaded to device storage (expo-file-system).
           On web:    models are stored in IndexedDB.
           ModelDownloadGate's isDownloadableOnCurrentPlatform() gracefully skips
           any model whose URL is not absolute HTTPS on native. ── */}
      {!modelsReady && (
        <ModelDownloadGate
          modelIds={REQUIRED_MODEL_IDS}
          onReady={() => setModelsReady(true)}
          accentColor={color}
        />
      )}

      {/* ── Tool content — only shown when models are ready ── */}
      {modelsReady && (
        <>
          {/* AI pipeline info banner */}
          <View style={[styles.infoBanner, { backgroundColor: color + '0D', borderColor: color + '30', borderRadius: colors.radius }]}>
            <MaterialCommunityIcons name="robot-outline" size={16} color={color} />
            <Text style={[styles.infoBannerText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
              BiRefNet → PyMatting Guided Filter → BEN2 Refinement → Alpha Matte · 100% offline
            </Text>
          </View>
          <AIModelBadge service="segmentation" showUpgradeHint />

          {error && <StatusBanner type="error" message={error} />}

          {!result && (
            <ImageUploadWidget
              image={image}
              onPicked={setImage}
              onError={setError}
              color={color}
              label="Upload photo — PNG, JPG, JPEG, WEBP supported"
            />
          )}

          {/* Background preset picker */}
          {!result && presets.length > 1 && (
            <View>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>Background</Text>
              <View style={styles.presetsRow}>
                {presets.map((p) => {
                  const active = preset === p.id;
                  const isCustom = p.id === 'custom';
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setPreset(p.id)}
                      style={[styles.presetChip, {
                        borderColor: active ? color : colors.border,
                        backgroundColor: active ? color + '14' : colors.card,
                        borderRadius: colors.radius - 4,
                      }]}
                      activeOpacity={0.8}
                    >
                      {isCustom ? (
                        <View style={[styles.swatch, {
                          backgroundColor: isValidHex(customHex) ? customHex : '#888',
                          borderColor: colors.border,
                        }]} />
                      ) : (
                        <View style={[styles.swatch, { backgroundColor: p.swatch === 'transparent' ? 'transparent' : p.swatch, borderColor: colors.border }]}>
                          {p.swatch === 'transparent' && <MaterialCommunityIcons name="checkerboard" size={14} color={colors.mutedForeground} />}
                        </View>
                      )}
                      <Text style={[styles.presetLabel, { color: active ? color : colors.foreground, fontFamily: 'Inter_500Medium' }]}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom color hex input — shown only when 'custom' is selected */}
              {preset === 'custom' && (
                <View style={[styles.customColorRow, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius - 4 }]}>
                  <MaterialCommunityIcons name="palette" size={16} color={color} />
                  <Text style={[styles.customColorLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    Hex color:
                  </Text>
                  <TextInput
                    value={customHex}
                    onChangeText={setCustomHex}
                    placeholder="#FFFFFF"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="characters"
                    maxLength={7}
                    style={[styles.customColorInput, {
                      color: colors.foreground,
                      fontFamily: 'Inter_500Medium',
                      borderColor: isValidHex(customHex) ? color : '#EF4444',
                    }]}
                  />
                  {isValidHex(customHex) && (
                    <View style={[styles.colorPreviewDot, { backgroundColor: customHex }]} />
                  )}
                </View>
              )}
            </View>
          )}

          {/* Quality mode selector */}
          {!result && image && (
            <View>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>Quality Mode</Text>
              <View style={styles.qualityRow}>
                {([
                  { id: 'standard' as QualityMode, label: 'Standard', icon: 'lightning-bolt', desc: 'Fast · BiRefNet + PyMatting' },
                  { id: 'hd'       as QualityMode, label: 'HD',        icon: 'shimmer',        desc: 'Slower · + BEN2 Hair Refinement' },
                ] as const).map((q) => {
                  const active = quality === q.id;
                  return (
                    <TouchableOpacity
                      key={q.id}
                      onPress={() => setQuality(q.id)}
                      style={[styles.qualityChip, {
                        borderColor: active ? color : colors.border,
                        backgroundColor: active ? color + '12' : colors.card,
                        borderRadius: colors.radius - 4,
                        flex: 1,
                      }]}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name={q.icon as any} size={18} color={active ? color : colors.mutedForeground} />
                      <View>
                        <Text style={[styles.qualityLabel, { color: active ? color : colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{q.label}</Text>
                        <Text style={[styles.qualityDesc,  { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{q.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Process button */}
          {!result && image && !processing && (
            <TouchableOpacity
              style={[styles.processBtn, { backgroundColor: color, borderRadius: colors.radius - 2 }]}
              onPress={process}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="auto-fix" size={18} color="#fff" />
              <Text style={[styles.processText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                {`Remove Background${quality === 'hd' ? ' (HD)' : ''}`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Processing state: steps + progress + cancel */}
          {processing && (
            <>
              {/* Progress bar + percentage + elapsed time */}
              <View style={[styles.processingHeader, { backgroundColor: color + '0D', borderColor: color + '20', borderRadius: colors.radius - 2 }]}>
                <ActivityIndicator color={color} size="small" />
                <Text style={[styles.processingPct, { color: color, fontFamily: 'Inter_700Bold' }]}>
                  {progress}%
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.processingLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                    {cancelling ? 'Cancelling…' : 'Processing…'}
                  </Text>
                  {elapsedDisplay ? (
                    <Text style={[styles.processingTime, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      {elapsedDisplay} elapsed
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Live step list */}
              <ProcessingSteps steps={steps} accentColor={color} />

              {/* Cancel button */}
              {!cancelling && (
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border, borderRadius: colors.radius - 2 }]}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="close-circle-outline" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.cancelText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                    Cancel Processing
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Result: interactive before/after slider + actions */}
          {result && image && (
            <>
              {/* Model badge */}
              <View style={[styles.modelBadge, { backgroundColor: color + '12', borderColor: color + '30', borderRadius: colors.radius - 4 }]}>
                <MaterialCommunityIcons name="brain" size={13} color={color} />
                <Text style={[styles.modelBadgeText, { color: color, fontFamily: 'Inter_600SemiBold' }]}>
                  {result.modelName}
                </Text>
                {quality === 'hd' && (
                  <>
                    <View style={[styles.badgeDot, { backgroundColor: color + '40' }]} />
                    <MaterialCommunityIcons name="shimmer" size={13} color={color} />
                    <Text style={[styles.modelBadgeText, { color: color, fontFamily: 'Inter_600SemiBold' }]}>HD</Text>
                  </>
                )}
              </View>

              {/* Interactive before/after slider */}
              <BeforeAfterSlider
                beforeUri={image.uri}
                afterUri={result.uri}
                height={320}
                beforeLabel="Original"
                afterLabel="Removed"
                accentColor={color}
              />

              {/* Metadata row */}
              <View style={[styles.metaRow, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius - 4 }]}>
                <MaterialCommunityIcons name="check-circle-outline" size={14} color="#22C55E" />
                <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {result.width}×{result.height}px · Lossless PNG ·{' '}
                  {quality === 'hd' ? 'HD soft-edge matting' : 'Professional soft-edge matting'}
                  {processingMs ? ` · ${fmtSeconds(processingMs)}` : ''}
                </Text>
              </View>

              {/* Export format selector */}
              <View>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>Export Format</Text>
                <View style={styles.presetsRow}>
                  {([
                    { id: 'png'  as ExportFormat, label: 'PNG',  desc: 'Transparent' },
                    { id: 'jpg'  as ExportFormat, label: 'JPG',  desc: 'White bg' },
                    { id: 'webp' as ExportFormat, label: 'WEBP', desc: 'Smallest' },
                  ] as const).map((f) => {
                    const active = exportFormat === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() => setExportFormat(f.id)}
                        style={[styles.presetChip, {
                          borderColor: active ? color : colors.border,
                          backgroundColor: active ? color + '14' : colors.card,
                          borderRadius: colors.radius - 4,
                        }]}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name={f.id === 'png' ? 'image-outline' : f.id === 'jpg' ? 'image' : 'zip-box-outline'}
                          size={14}
                          color={active ? color : colors.mutedForeground}
                        />
                        <View>
                          <Text style={[styles.presetLabel, { color: active ? color : colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                            {f.label}
                          </Text>
                          <Text style={[styles.formatDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                            {f.desc}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Download / Share actions — wired to selected export format */}
              <ResultActions
                uri={result.uri}
                fileName={guessFileName(toolId, exportFormat)}
                color={color}
                onReset={reset}
                onDownload={handleExport}
              />

              {/* HD Export: explicit full-resolution download button */}
              {Platform.OS === 'web' && (
                <TouchableOpacity
                  style={[styles.hdExportBtn, { borderColor: color, borderRadius: colors.radius - 2, opacity: exporting ? 0.6 : 1 }]}
                  onPress={handleHDExport}
                  activeOpacity={0.85}
                  disabled={exporting}
                >
                  {exporting
                    ? <ActivityIndicator size="small" color={color} />
                    : <MaterialCommunityIcons name="download-outline" size={18} color={color} />
                  }
                  <Text style={[styles.hdExportText, { color: color, fontFamily: 'Inter_600SemiBold' }]}>
                    {exporting
                      ? `Exporting ${exportFormat.toUpperCase()}…`
                      : `Download ${exportFormat.toUpperCase()} (${result.width}×${result.height})`
                    }
                  </Text>
                </TouchableOpacity>
              )}

              {/* Process again with different quality/preset */}
              <TouchableOpacity
                style={[styles.reprocessBtn, { borderColor: colors.border, borderRadius: colors.radius - 2 }]}
                onPress={() => { setResult(null); }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="refresh" size={15} color={colors.mutedForeground} />
                <Text style={[styles.reprocessText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                  Try different background or quality
                </Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}
    </ToolScreenLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  infoBanner:       { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderWidth: 1 },
  infoBannerText:   { flex: 1, fontSize: 12, lineHeight: 18 },
  sectionLabel:     { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  presetsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1 },
  swatch:           { width: 16, height: 16, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  presetLabel:      { fontSize: 12 },
  formatDesc:       { fontSize: 10, marginTop: 1 },
  customColorRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderWidth: 1, marginTop: 8 },
  customColorLabel: { fontSize: 12 },
  customColorInput: { flex: 1, fontSize: 14, borderBottomWidth: 1, paddingVertical: 2, paddingHorizontal: 4 },
  colorPreviewDot:  { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#0002' },
  qualityRow:       { flexDirection: 'row', gap: 8 },
  qualityChip:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1.5 },
  qualityLabel:     { fontSize: 13 },
  qualityDesc:      { fontSize: 10, marginTop: 1 },
  processBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  processText:      { fontSize: 14 },
  processingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  processingPct:    { fontSize: 16 },
  processingLabel:  { fontSize: 13 },
  processingTime:   { fontSize: 10, marginTop: 1 },
  cancelBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderWidth: 1, marginTop: 4 },
  cancelText:       { fontSize: 12 },
  modelBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, alignSelf: 'flex-start' },
  modelBadgeText:   { fontSize: 11 },
  badgeDot:         { width: 3, height: 3, borderRadius: 1.5 },
  metaRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderWidth: 1 },
  metaText:         { flex: 1, fontSize: 11 },
  hdExportBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderWidth: 1.5, marginTop: 4 },
  hdExportText:     { fontSize: 13 },
  reprocessBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderWidth: 1, marginTop: 4 },
  reprocessText:    { fontSize: 12 },
});
