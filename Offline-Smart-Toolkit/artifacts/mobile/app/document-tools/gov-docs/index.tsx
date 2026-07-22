/**
 * Government Document Tools Hub — Phase 4
 * Hub for government certificate and document processing tools.
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

const COLOR = '#F59E0B';

interface GovTool {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
  description: string;
  status: 'ready' | 'coming-soon';
}

const GOV_TOOLS: GovTool[] = [
  { id: 'income-cert',    name: 'Income Certificate',     nameHi: 'आय प्रमाण पत्र',     icon: 'file-certificate-outline', description: 'Process income certificate documents',         status: 'ready' },
  { id: 'caste-cert',     name: 'Caste Certificate',      nameHi: 'जाति प्रमाण पत्र',   icon: 'file-document-outline',    description: 'Process caste certificate documents',          status: 'ready' },
  { id: 'domicile-cert',  name: 'Domicile Certificate',   nameHi: 'निवास प्रमाण पत्र',  icon: 'home-city-outline',        description: 'Process domicile/residence certificates',     status: 'ready' },
  { id: 'ration-card',    name: 'Ration Card',            nameHi: 'राशन कार्ड',          icon: 'card-text-outline',        description: 'Process ration card documents',               status: 'ready' },
  { id: 'birth-cert',     name: 'Birth Certificate',      nameHi: 'जन्म प्रमाण पत्र',   icon: 'baby-face-outline',        description: 'Process birth certificate documents',         status: 'ready' },
  { id: 'death-cert',     name: 'Death Certificate',      nameHi: 'मृत्यु प्रमाण पत्र', icon: 'file-check-outline',       description: 'Process death certificate documents',         status: 'ready' },
  { id: 'marriage-cert',  name: 'Marriage Certificate',   nameHi: 'विवाह प्रमाण पत्र',  icon: 'heart-outline',            description: 'Process marriage certificate documents',      status: 'ready' },
  { id: 'property-doc',   name: 'Property Document',      nameHi: 'संपत्ति दस्तावेज़',   icon: 'office-building-outline',  description: 'Process property ownership documents',        status: 'ready' },
  { id: 'pension-doc',    name: 'Pension Document',       nameHi: 'पेंशन दस्तावेज़',    icon: 'account-clock-outline',    description: 'Process pension-related documents',           status: 'ready' },
  { id: 'land-record',    name: 'Land Record',            nameHi: 'भूमि अभिलेख',        icon: 'map-outline',              description: 'Process land record documents',               status: 'ready' },
  { id: 'noc-doc',        name: 'NOC Certificate',        nameHi: 'NOC प्रमाण पत्र',    icon: 'stamp',                    description: 'No Objection Certificate processing',         status: 'ready' },
  { id: 'police-clearance', name: 'Police Clearance',     nameHi: 'पुलिस क्लियरेंस',    icon: 'shield-check-outline',     description: 'Process police clearance documents',         status: 'ready' },
];

function GovToolCard({ tool, onPress }: { tool: GovTool; onPress: () => void }) {
  const colors = useColors();
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
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function GovDocToolsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');

  const topPadding = Platform.OS === 'web' ? 30 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = GOV_TOOLS.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.nameHi.includes(query)
  );

  const handlePress = (tool: GovTool) => {
    // Government doc tools use the document scanner for now
    router.push('/document-tools/pdf/document-scanner' as any);
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
            Government Documents
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Offline document processing
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: COLOR + '18' }]}>
          <Text style={[styles.badgeText, { color: COLOR, fontFamily: 'Inter_600SemiBold' }]}>
            {GOV_TOOLS.length} Tools
          </Text>
        </View>
      </View>

      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: COLOR + '10', borderBottomColor: COLOR + '20' }]}>
        <MaterialCommunityIcons name="shield-lock-outline" size={14} color={COLOR} />
        <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          100% offline · No data leaves your device · All processing on-device
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <MaterialCommunityIcons name="magnify" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
          placeholder="Search government document tools..."
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
        renderItem={({ item }) => <GovToolCard tool={item} onPress={() => handlePress(item)} />}
        ListHeaderComponent={
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Select a document type to scan, process, and export
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
  emptyText: { textAlign: 'center', fontSize: 14, marginTop: 40 },
});
