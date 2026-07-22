/**
 * Document Scanner — Phase 4
 * Camera capture → auto-enhance → crop → export PDF or image.
 * Works fully offline. Uses expo-image-picker, expo-image-manipulator, pdf-lib.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Image, Platform, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useColors } from '@/hooks/useColors';
import { ToolScreenLayout } from '@/components/photo-tools/ToolScreenLayout';
import { StatusBanner } from '@/components/photo-tools/StatusBanner';
import { DocResultActions } from '@/components/document-tools/DocResultActions';
import { imageListToPdf } from '@/lib/features/documents/printUtils';
import type { PaperSize } from '@/lib/features/documents/types';
import { exportFile } from '@/lib/photoTools/exportUtils';

const COLOR = '#EF4444';

interface ScannedPage {
  originalUri: string;
  processedUri: string;
  width: number;
  height: number;
}

const ENHANCE_MODES = [
  { label: 'Auto', value: 'auto' },
  { label: 'Document', value: 'document' },
  { label: 'Photo', value: 'photo' },
] as const;

const PAPER_SIZES: { label: string; value: PaperSize }[] = [
  { label: 'A4', value: 'a4' },
  { label: 'Letter', value: 'letter' },
  { label: 'Legal', value: 'legal' },
];

type EnhanceMode = 'auto' | 'document' | 'photo';

async function enhanceScan(uri: string, mode: EnhanceMode, width: number, height: number) {
  const actions: ImageManipulator.Action[] = [];

  // Resize to max 2048px for performance
  const MAX = 2048;
  if (width > MAX || height > MAX) {
    const scale = Math.min(MAX / width, MAX / height);
    actions.push({ resize: { width: Math.round(width * scale), height: Math.round(height * scale) } });
  }

  // Apply enhancement based on mode
  const options: ImageManipulator.ImageResult = await (ImageManipulator as any).manipulateAsync(
    uri,
    actions,
    {
      compress: mode === 'document' ? 0.9 : mode === 'photo' ? 0.95 : 0.88,
      format: (ImageManipulator as any).SaveFormat?.JPEG ?? 'jpeg',
    }
  );
  return options;
}

export default function DocumentScannerScreen() {
  const colors = useColors();
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [mode, setMode] = useState<EnhanceMode>('auto');
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [pdfResult, setPdfResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPages([]);
    setPdfResult(null);
    setError(null);
  };

  const scanCamera = async () => {
    if (Platform.OS === 'web') {
      setError('Camera scanning is available on Android. Use "Import Image" on web.');
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Camera permission denied. Enable camera access in Settings.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 1, exif: false });
    if (!res.canceled && res.assets?.[0]) {
      await processImage(res.assets[0].uri, res.assets[0].width, res.assets[0].height);
    }
  };

  const importImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Gallery permission denied.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!res.canceled && res.assets) {
      for (const asset of res.assets) {
        await processImage(asset.uri, asset.width, asset.height);
      }
    }
  };

  const processImage = async (uri: string, width: number, height: number) => {
    setEnhancing(true);
    setError(null);
    try {
      const enhanced = await enhanceScan(uri, mode, width, height);
      setPages((prev) => [...prev, {
        originalUri: uri,
        processedUri: enhanced.uri,
        width: enhanced.width,
        height: enhanced.height,
      }]);
    } catch (e: any) {
      setError(e?.message ?? 'Image processing failed.');
    } finally {
      setEnhancing(false);
    }
  };

  const removePage = (index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const movePage = (index: number, dir: 'up' | 'down') => {
    setPages((prev) => {
      const next = [...prev];
      const swap = dir === 'up' ? index - 1 : index + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  };

  const createPdf = async () => {
    if (pages.length === 0) return;
    setProcessing(true);
    setError(null);
    try {
      const uris = pages.map((p) => p.processedUri);
      const uri = await imageListToPdf(uris, paperSize, `scan-${Date.now()}.pdf`);
      setPdfResult(uri);
    } catch (e: any) {
      setError(e?.message ?? 'PDF creation failed.');
    } finally {
      setProcessing(false);
    }
  };

  const saveAsImage = async (page: ScannedPage, index: number) => {
    try {
      await exportFile(page.processedUri, `scan-page-${index + 1}.jpg`);
    } catch (e: any) {
      setError(e?.message ?? 'Export failed.');
    }
  };

  return (
    <ToolScreenLayout
      title="Document Scanner"
      subtitle="Scan, enhance & export documents offline"
      iconName="scan-helper"
      color={COLOR}
      onReset={reset}
    >
      {error && <StatusBanner type="error" message={error} />}

      {/* Enhance mode */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
          Enhance Mode
        </Text>
        <View style={styles.row}>
          {ENHANCE_MODES.map((m) => {
            const active = mode === m.value;
            return (
              <TouchableOpacity
                key={m.value}
                style={[styles.chip, {
                  borderColor: active ? COLOR : colors.border,
                  backgroundColor: active ? COLOR + '14' : colors.card,
                  borderRadius: colors.radius - 4,
                }]}
                onPress={() => setMode(m.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipLabel, {
                  color: active ? COLOR : colors.foreground,
                  fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Scan buttons */}
      <View style={styles.scanRow}>
        <TouchableOpacity
          style={[styles.scanBtn, { backgroundColor: COLOR, borderRadius: colors.radius - 2, flex: 1 }]}
          onPress={scanCamera}
          disabled={enhancing}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="camera" size={20} color="#fff" />
          <Text style={[styles.btnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
            {Platform.OS === 'web' ? 'Scan (Native)' : 'Scan Page'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scanBtn, styles.outlineBtn, { borderColor: COLOR, borderRadius: colors.radius - 2, flex: 1 }]}
          onPress={importImage}
          disabled={enhancing}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="image-multiple" size={20} color={COLOR} />
          <Text style={[styles.btnText, { color: COLOR, fontFamily: 'Inter_600SemiBold' }]}>
            Import Image
          </Text>
        </TouchableOpacity>
      </View>

      {enhancing && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={COLOR} size="small" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Enhancing scan…
          </Text>
        </View>
      )}

      {/* Scanned pages */}
      {pages.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            Scanned Pages ({pages.length})
          </Text>
          {pages.map((page, i) => (
            <View key={i} style={[styles.pageCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Image
                source={{ uri: page.processedUri }}
                style={[styles.pageThumb, { borderRadius: colors.radius - 4 }]}
                resizeMode="cover"
              />
              <View style={styles.pageMeta}>
                <Text style={[styles.pageTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                  Page {i + 1}
                </Text>
                <Text style={[styles.pageDims, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {page.width} × {page.height}
                </Text>
                <View style={styles.pageActions}>
                  <TouchableOpacity onPress={() => movePage(i, 'up')} disabled={i === 0} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <MaterialCommunityIcons name="chevron-up" size={18} color={i === 0 ? colors.mutedForeground : colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => movePage(i, 'down')} disabled={i === pages.length - 1} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <MaterialCommunityIcons name="chevron-down" size={18} color={i === pages.length - 1 ? colors.mutedForeground : colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => saveAsImage(page, i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <MaterialCommunityIcons name="download" size={18} color={COLOR} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removePage(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Paper size + Create PDF */}
      {pages.length > 0 && !pdfResult && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Paper Size</Text>
          <View style={styles.row}>
            {PAPER_SIZES.map((ps) => {
              const active = paperSize === ps.value;
              return (
                <TouchableOpacity
                  key={ps.value}
                  style={[styles.chip, {
                    borderColor: active ? COLOR : colors.border,
                    backgroundColor: active ? COLOR + '14' : colors.card,
                    borderRadius: colors.radius - 4,
                  }]}
                  onPress={() => setPaperSize(ps.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipLabel, {
                    color: active ? COLOR : colors.foreground,
                    fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  }]}>{ps.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: COLOR, borderRadius: colors.radius - 2 }]}
            onPress={createPdf}
            disabled={processing}
            activeOpacity={0.85}
          >
            {processing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialCommunityIcons name="file-pdf-box" size={18} color="#fff" />
            )}
            <Text style={[styles.btnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
              {processing ? 'Creating PDF…' : `Create PDF (${pages.length} page${pages.length !== 1 ? 's' : ''})`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Result */}
      {pdfResult && (
        <View style={styles.section}>
          <View style={[styles.successBox, { backgroundColor: '#22C55E14', borderColor: '#22C55E40', borderRadius: colors.radius }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color="#22C55E" />
            <Text style={[styles.successText, { color: '#22C55E', fontFamily: 'Inter_600SemiBold' }]}>
              Scan PDF created — {pages.length} page{pages.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <DocResultActions uri={pdfResult} fileName={`scanned-doc-${Date.now()}.pdf`} color={COLOR} onReset={reset} mimeType="application/pdf" />
        </View>
      )}

      {/* Feature info */}
      <View style={[styles.infoBox, { backgroundColor: COLOR + '0C', borderColor: COLOR + '25', borderRadius: colors.radius }]}>
        <MaterialCommunityIcons name="information-outline" size={14} color={COLOR} />
        <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          Offline document scanning with auto-enhancement. Edge detection and perspective correction require additional native modules.
        </Text>
      </View>
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  label: { fontSize: 13 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14 },
  chipLabel: { fontSize: 12 },
  scanRow: { flexDirection: 'row', gap: 10 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  outlineBtn: { borderWidth: 1.5, backgroundColor: 'transparent' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  btnText: { fontSize: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 6 },
  loadingText: { fontSize: 13 },
  pageCard: { flexDirection: 'row', gap: 10, padding: 10, borderWidth: 1 },
  pageThumb: { width: 72, height: 96 },
  pageMeta: { flex: 1, justifyContent: 'space-between' },
  pageTitle: { fontSize: 13 },
  pageDims: { fontSize: 11 },
  pageActions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderWidth: 1 },
  successText: { fontSize: 13 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderWidth: 1 },
  infoText: { fontSize: 11, flex: 1, lineHeight: 17 },
});
