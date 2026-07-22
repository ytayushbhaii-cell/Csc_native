/**
 * CSC Utility Document Tools Hub — Phase 4
 * Hub for CSC (Common Service Centre) utility document tools.
 */
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';

const COLOR = '#8B5CF6';

interface CscTool {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
  description: string;
  action: 'scan' | 'pdf' | 'ocr' | 'image-to-text';
}

const CSC_TOOLS: CscTool[] = [
  { id: 'service-form',    name: 'Service Form Print',      nameHi: 'सेवा फॉर्म प्रिंट',       icon: 'file-document-edit-outline', description: 'Print CSC service application forms',         action: 'pdf' },
  { id: 'csc-certificate', name: 'CSC Certificate',         nameHi: 'CSC प्रमाण पत्र',          icon: 'certificate-outline',        description: 'Process CSC operator certificates',          action: 'scan' },
  { id: 'document-copy',   name: 'Document Copy',           nameHi: 'दस्तावेज़ प्रतिलिपि',       icon: 'content-copy',               description: 'Create multiple copies of documents',        action: 'pdf' },
  { id: 'kyc-form',        name: 'KYC Form Scan',           nameHi: 'KYC फॉर्म स्कैन',           icon: 'account-check-outline',      description: 'Scan and process KYC documents',            action: 'scan' },
  { id: 'application-print', name: 'Application Print',    nameHi: 'आवेदन प्रिंट',              icon: 'printer-outline',            description: 'Print application forms in A4 format',      action: 'pdf' },
  { id: 'affidavit-doc',   name: 'Affidavit Processing',   nameHi: 'शपथ पत्र प्रसंस्करण',      icon: 'gavel',                      description: 'Scan and process affidavit documents',      action: 'scan' },
  { id: 'bank-form',       name: 'Bank Form',               nameHi: 'बैंक फॉर्म',                icon: 'bank-outline',               description: 'Process bank-related forms and documents',  action: 'scan' },
  { id: 'insurance-doc',   name: 'Insurance Document',     nameHi: 'बीमा दस्तावेज़',            icon: 'shield-half-full',           description: 'Process insurance policy documents',        action: 'scan' },
  { id: 'utility-bill',    name: 'Utility Bill Scan',       nameHi: 'उपयोगिता बिल स्कैन',        icon: 'receipt',                    description: 'Scan electricity, water, gas bills',        action: 'scan' },
  { id: 'school-cert',     name: 'School Certificate',     nameHi: 'स्कूल प्रमाण पत्र',         icon: 'school-outline',             description: 'Process school and education certificates', action: 'scan' },
  { id: 'ocr-extract',     name: 'Extract Document Text',  nameHi: 'दस्तावेज़ टेक्स्ट निकालें', icon: 'text-recognition',           description: 'Extract text from any document image',      action: 'ocr' },
  { id: 'img-to-pdf',      name: 'Image to PDF',           nameHi: 'इमेज से PDF',               icon: 'file-pdf-box',               description: 'Convert document images to PDF',            action: 'pdf' },
];

const ACTION_ROUTES: Record<CscTool['action'], string> = {
  scan:          '/document-tools/pdf/document-scanner',
  pdf:           '/document-tools/pdf/from-image',
  ocr:           '/document-tools/pdf/image-to-text',
  'image-to-text': '/document-tools/pdf/image-to-text',
};

function CscToolCard({ tool, onPress }: { tool: CscTool; onPress: () => void }) {
  const colors = useColors();
  const actionLabel: Record<CscTool['action'], string> = {
    scan: 'Scan',
    pdf: 'PDF',
    ocr: 'OCR',
    'image-to-text': 'OCR',
  };
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: COLOR + '18', borderRadius: colors.radius - 4 }]}>
        <MaterialCommunityIcons name={tool.icon as any} size={24} color={COLOR} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
          {tool.name}
        </Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
          {tool.description}
        </Text>
      </View>
      <View style={[styles.actionBadge, { backgroundColor: COLOR + '18', borderRadius: 6 }]}>
        <Text style={[styles.actionText, { color: COLOR, fontFamily: 'Inter_600SemiBold' }]}>
          {actionLabel[tool.action]}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CscUtilityToolsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');

  const topPadding = Platform.OS === 'web' ? 30 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = CSC_TOOLS.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.nameHi.includes(query)
  );

  const handlePress = (tool: CscTool) => {
    router.push(ACTION_ROUTES[tool.action] as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 10, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            CSC Utility Tools
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Common Service Centre document tools
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: COLOR + '18' }]}>
          <Text style={[styles.badgeText, { color: COLOR, fontFamily: 'Inter_600SemiBold' }]}>
            {CSC_TOOLS.length} Tools
          </Text>
        </View>
      </View>

      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: COLOR + '10', borderBottomColor: COLOR + '20' }]}>
        <MaterialCommunityIcons name="store-outline" size={14} color={COLOR} />
        <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          CSC Smart Toolkit · Offline processing · No internet required
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <MaterialCommunityIcons name="magnify" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
          placeholder="Search CSC utility tools..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <MaterialCommunityIcons name="close" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPadding + 16 }]}
        renderItem={({ item }) => <CscToolCard tool={item} onPress={() => handlePress(item)} />}
        ListHeaderComponent={
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Tools for CSC operators — scan, PDF, extract text from documents
          </Text>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            No tools match "{query}"
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1, gap: 10 },
  iconBtn: { padding: 8, borderRadius: 8 },
  title: { fontSize: 17 },
  subtitle: { fontSize: 12, marginTop: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  infoText: { fontSize: 11, flex: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 4, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  list: { padding: 16, gap: 8 },
  sectionLabel: { fontSize: 12, marginBottom: 8, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, padding: 12, gap: 12 },
  iconBox: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 13, marginBottom: 2 },
  cardDesc: { fontSize: 11 },
  actionBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  actionText: { fontSize: 10 },
  emptyText: { textAlign: 'center', fontSize: 14, marginTop: 40 },
});
