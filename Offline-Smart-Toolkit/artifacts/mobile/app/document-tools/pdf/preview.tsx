import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, Image, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ToolScreenLayout } from '@/components/photo-tools/ToolScreenLayout';
import { StatusBanner } from '@/components/photo-tools/StatusBanner';
import { DocUploadWidget } from '@/components/document-tools/DocUploadWidget';
import type { DocPickResult } from '@/components/document-tools/DocUploadWidget';
import { getPdfInfo } from '@/lib/features/documents/pdf/pdfService';
import { pdfPageToImages } from '@/lib/features/documents/pdf/pdfToImageService';
import type { PdfInfo, PdfToImageResult } from '@/lib/features/documents/types';

const COLOR = '#EF4444';

export default function PdfPreviewScreen() {
  const colors = useColors();
  const [file, setFile] = useState<DocPickResult | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);
  const [pages, setPages] = useState<PdfToImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setPdfInfo(null);
    setPages([]);
    setError(null);
  };

  const handleFilePicked = async (picked: DocPickResult) => {
    setFile(picked);
    setPdfInfo(null);
    setPages([]);
    setError(null);
    setLoading(true);
    try {
      const [info, renderedPages] = await Promise.all([
        getPdfInfo(picked.uri, picked.size),
        pdfPageToImages(picked.uri, undefined, 'jpeg', 2.0),
      ]);
      setPdfInfo(info);
      if (renderedPages[0]?.isStub) {
        setError(renderedPages[0].stubMessage ?? 'PDF rendering failed.');
      } else {
        setPages(renderedPages);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolScreenLayout
      title="PDF Preview"
      subtitle="View all pages of a PDF document"
      iconName="file-eye-outline"
      color={COLOR}
      onReset={reset}
    >
      {error && <StatusBanner type="error" message={error} />}

      <DocUploadWidget
        file={file}
        onPicked={handleFilePicked}
        onError={setError}
        color={COLOR}
        accept="pdf"
        label="Open PDF"
      />

      {loading && (
        <View style={[styles.loadingBox, { backgroundColor: COLOR + '10', borderColor: COLOR + '30', borderRadius: colors.radius }]}>
          <ActivityIndicator color={COLOR} size="small" />
          <Text style={[styles.loadingText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
            Rendering pages…
          </Text>
        </View>
      )}

      {pdfInfo && !loading && (
        <View style={[styles.infoRow, { backgroundColor: COLOR + '12', borderColor: COLOR + '30', borderRadius: colors.radius }]}>
          <MaterialCommunityIcons name="file-pdf-box" size={15} color={COLOR} />
          <Text style={[styles.infoText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
            {pdfInfo.pageCount} page{pdfInfo.pageCount !== 1 ? 's' : ''}
            {pdfInfo.title && pdfInfo.title !== '—' ? ` · ${pdfInfo.title}` : ''}
            {pdfInfo.encrypted ? ' · 🔒 Encrypted' : ''}
          </Text>
        </View>
      )}

      {pages.length > 0 && (
        <View style={styles.pagesContainer}>
          <View style={[styles.pagesHeader, { borderBottomColor: colors.border }]}>
            <MaterialCommunityIcons name="file-eye-outline" size={15} color={COLOR} />
            <Text style={[styles.pagesHeaderText, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              {pages.length} page{pages.length !== 1 ? 's' : ''} loaded
            </Text>
          </View>

          {pages.map((page) => (
            <View
              key={page.pageNumber}
              style={[styles.pageCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              {/* Page number badge */}
              <View style={[styles.pageBadge, { backgroundColor: COLOR + '14' }]}>
                <Text style={[styles.pageBadgeText, { color: COLOR, fontFamily: 'Inter_700Bold' }]}>
                  Page {page.pageNumber}
                </Text>
                {page.width > 0 && (
                  <Text style={[styles.pageDims, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {page.width} × {page.height}
                  </Text>
                )}
              </View>

              {/* Page image */}
              <Image
                source={{ uri: page.uri }}
                style={[styles.pageImage, { borderBottomLeftRadius: colors.radius - 2, borderBottomRightRadius: colors.radius - 2 }]}
                resizeMode="contain"
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: colors.border, borderRadius: colors.radius - 2 }]}
            onPress={reset}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="refresh" size={16} color={colors.foreground} />
            <Text style={[styles.resetBtnText, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              Open Another PDF
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!file && !loading && (
        <View style={[styles.howCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.howTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            About PDF Preview
          </Text>
          {[
            { icon: 'file-pdf-box',       text: 'Upload any PDF document' },
            { icon: 'image-multiple',     text: 'All pages are rendered as high-quality images' },
            { icon: 'eye-outline',        text: 'Scroll through every page offline' },
            { icon: 'information-outline',text: 'File metadata shown: page count, title, encryption status' },
          ].map((step) => (
            <View key={step.text} style={styles.howRow}>
              <MaterialCommunityIcons name={step.icon as any} size={16} color={COLOR} />
              <Text style={[styles.howText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
                {step.text}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderWidth: 1,
  },
  loadingText: { fontSize: 13 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderWidth: 1,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
  pagesContainer: { gap: 12 },
  pagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  pagesHeaderText: { fontSize: 13 },
  pageCard: { borderWidth: 1, overflow: 'hidden' },
  pageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pageBadgeText: { fontSize: 12 },
  pageDims: { fontSize: 11 },
  pageImage: {
    width: '100%',
    height: 360,
    backgroundColor: '#00000006',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderWidth: 1,
    marginTop: 4,
  },
  resetBtnText: { fontSize: 13 },
  howCard: { borderWidth: 1, padding: 16, gap: 12 },
  howTitle: { fontSize: 14, marginBottom: 2 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  howText: { fontSize: 12, flex: 1, lineHeight: 18 },
});
