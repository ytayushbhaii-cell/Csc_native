/**
 * Image to Text — Phase 4
 * OCR text extraction from images. Works offline on web (tesseract.js).
 * On native Android, provides clear upgrade path.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, Platform, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useColors } from '@/hooks/useColors';
import { ToolScreenLayout } from '@/components/photo-tools/ToolScreenLayout';
import { StatusBanner } from '@/components/photo-tools/StatusBanner';
import { DocUploadWidget } from '@/components/document-tools/DocUploadWidget';
import type { DocPickResult } from '@/components/document-tools/DocUploadWidget';
import { runOcr } from '@/lib/features/documents/ocr/ocrService';
import type { OcrResult } from '@/lib/features/documents/types';
import { exportFile } from '@/lib/photoTools/exportUtils';

const COLOR = '#EF4444';

const LANGUAGES = [
  { label: 'English',       value: 'eng',     flag: '🇬🇧' },
  { label: 'Hindi',         value: 'hin',     flag: '🇮🇳' },
  { label: 'Eng + Hindi',   value: 'eng+hin', flag: '🌐' },
  { label: 'Gujarati',      value: 'guj',     flag: '🇮🇳' },
  { label: 'Tamil',         value: 'tam',     flag: '🇮🇳' },
  { label: 'Telugu',        value: 'tel',     flag: '🇮🇳' },
  { label: 'Marathi',       value: 'mar',     flag: '🇮🇳' },
  { label: 'Bengali',       value: 'ben',     flag: '🇮🇳' },
];

export default function ImageToTextScreen() {
  const colors = useColors();
  const [file, setFile] = useState<DocPickResult | null>(null);
  const [language, setLanguage] = useState('eng');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setFile(null);
    setOcrResult(null);
    setError(null);
    setCopied(false);
    setProgress(0);
  };

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setOcrResult(null);
    setProgress(0);

    try {
      // Simulate progress for UX
      const timer = setInterval(() => {
        setProgress((p) => Math.min(p + 12, 85));
      }, 300);

      const result = await runOcr(file.uri, language);
      clearInterval(timer);
      setProgress(100);
      setOcrResult(result);
    } catch (e: any) {
      setError(e?.message ?? 'Text extraction failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const copyText = async () => {
    if (!ocrResult?.text) return;
    try {
      await Clipboard.setStringAsync(ocrResult.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const exportAsText = async () => {
    if (!ocrResult?.text) return;
    try {
      const fileName = `text-${Date.now()}.txt`;
      if (Platform.OS === 'web') {
        const blob = new Blob([ocrResult.text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        const FileSystem = await import('expo-file-system');
        const dir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory;
        const fileUri = `${dir}${fileName}`;
        await (FileSystem as any).writeAsStringAsync(fileUri, ocrResult.text, { encoding: 'utf8' as any });
        await exportFile(fileUri, fileName);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Unknown error');
    }
  };

  const wordCount = ocrResult?.text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const charCount = ocrResult?.text?.length ?? 0;

  return (
    <ToolScreenLayout
      title="Image to Text"
      subtitle="Extract text from images with OCR"
      iconName="text-recognition"
      color={COLOR}
      onReset={reset}
    >
      {error && <StatusBanner type="error" message={error} />}

      <DocUploadWidget
        file={file}
        onPicked={setFile}
        onError={setError}
        color={COLOR}
        accept="image"
        label="Upload Image for OCR"
      />

      {file && (
        <View style={styles.section}>
          {/* Language selector */}
          <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            OCR Language
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.langRow}>
              {LANGUAGES.map((lang) => {
                const active = language === lang.value;
                return (
                  <TouchableOpacity
                    key={lang.value}
                    style={[styles.langChip, {
                      borderColor: active ? COLOR : colors.border,
                      backgroundColor: active ? COLOR + '14' : colors.card,
                      borderRadius: colors.radius - 4,
                    }]}
                    onPress={() => setLanguage(lang.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <Text style={[styles.langLabel, {
                      color: active ? COLOR : colors.foreground,
                      fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    }]}>
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Platform notice for native */}
      {file && Platform.OS !== 'web' && (
        <View style={[styles.noticeBox, { backgroundColor: '#F59E0B14', borderColor: '#F59E0B40', borderRadius: colors.radius }]}>
          <MaterialCommunityIcons name="android" size={15} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.noticeTitle, { color: '#F59E0B', fontFamily: 'Inter_600SemiBold' }]}>
              Native OCR
            </Text>
            <Text style={[styles.noticeText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Full offline OCR on Android requires react-native-tesseract-ocr or Google ML Kit integration. The web preview provides complete OCR functionality.
            </Text>
          </View>
        </View>
      )}

      {/* Extract button */}
      {file && !ocrResult && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: COLOR, borderRadius: colors.radius - 2 }]}
          onPress={process}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <MaterialCommunityIcons name="text-recognition" size={18} color="#fff" />
          )}
          <Text style={[styles.btnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
            {processing ? `Extracting… ${progress}%` : 'Extract Text'}
          </Text>
        </TouchableOpacity>
      )}

      {/* OCR Result */}
      {ocrResult && (
        <View style={styles.section}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, {
              backgroundColor: ocrResult.engine === 'tesseract' ? '#22C55E18' : '#F59E0B18',
              borderRadius: 20,
            }]}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={12}
                color={ocrResult.engine === 'tesseract' ? '#22C55E' : '#F59E0B'}
              />
              <Text style={[styles.badgeText, {
                color: ocrResult.engine === 'tesseract' ? '#22C55E' : '#F59E0B',
                fontFamily: 'Inter_600SemiBold',
              }]}>
                {ocrResult.engine === 'tesseract' ? 'Tesseract OCR' : 'Architecture Stub'}
              </Text>
            </View>
            {ocrResult.confidence > 0 && (
              <View style={[styles.badge, { backgroundColor: COLOR + '18', borderRadius: 20 }]}>
                <MaterialCommunityIcons name="percent" size={12} color={COLOR} />
                <Text style={[styles.badgeText, { color: COLOR, fontFamily: 'Inter_600SemiBold' }]}>
                  {Math.round(ocrResult.confidence * 100)}% confidence
                </Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: colors.muted, borderRadius: 20 }]}>
              <Text style={[styles.badgeText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {wordCount} words · {charCount} chars
              </Text>
            </View>
          </View>

          {/* Extracted text */}
          <View style={[styles.textBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.textHeader}>
              <Text style={[styles.textHeaderLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                EXTRACTED TEXT
              </Text>
            </View>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator>
              <Text selectable style={[styles.ocrText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
                {ocrResult.text || '(No text detected in this image)'}
              </Text>
            </ScrollView>
          </View>

          {/* Action buttons */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: copied ? '#22C55E' : COLOR, borderRadius: colors.radius - 2 }]}
            onPress={copyText}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name={copied ? 'check' : 'content-copy'} size={18} color="#fff" />
            <Text style={[styles.btnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.outlineBtn, { borderColor: COLOR, borderRadius: colors.radius - 2 }]}
            onPress={exportAsText}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="file-export-outline" size={18} color={COLOR} />
            <Text style={[styles.btnText, { color: COLOR, fontFamily: 'Inter_600SemiBold' }]}>
              Save as .txt File
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.outlineBtn, { borderColor: colors.border, borderRadius: colors.radius - 2 }]}
            onPress={reset}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="refresh" size={18} color={colors.foreground} />
            <Text style={[styles.btnText, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              Extract from Another Image
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  label: { fontSize: 13 },
  langRow: { flexDirection: 'row', gap: 8 },
  langChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12 },
  langFlag: { fontSize: 14 },
  langLabel: { fontSize: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  outlineBtn: { borderWidth: 1.5, backgroundColor: 'transparent' },
  btnText: { fontSize: 14 },
  noticeBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderWidth: 1 },
  noticeTitle: { fontSize: 12, marginBottom: 2 },
  noticeText: { fontSize: 11, lineHeight: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11 },
  textBox: { borderWidth: 1, overflow: 'hidden' },
  textHeader: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  textHeaderLabel: { fontSize: 10, letterSpacing: 0.8 },
  ocrText: { fontSize: 13, lineHeight: 20, padding: 12 },
});
