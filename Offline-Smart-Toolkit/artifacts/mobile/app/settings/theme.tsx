import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { ALL_THEMES, getThemeColors, type ThemeMeta } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';
import { setTheme } from '@/lib/features/settings/SettingsService';

const TOOL_COLOR = '#6366F1';

export default function ThemeSettingsScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { themeId, isDark, setThemeById } = useTheme();

  const [selected, setSelected] = useState<string>(themeId);
  const [saved, setSaved]       = useState(false);
  const [busy, setBusy]         = useState(false);

  const topPadding    = Platform.OS === 'web' ? 30 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    setSelected(themeId);
  }, [themeId]);

  // Theme cards apply immediately so users can preview the whole app live.
  const handleThemeSelect = async (id: string) => {
    setSelected(id);
    try {
      await setTheme(id);
      await setThemeById(id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      Alert.alert('Error', 'Could not save theme preference.');
    }
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await setTheme(selected);
      await setThemeById(selected);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      Alert.alert('Error', 'Could not save theme preference.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    void handleThemeSelect('light');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, {
        paddingTop: topPadding + 10,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.headerIcon, { backgroundColor: TOOL_COLOR + '18' }]}>
          <MaterialCommunityIcons name="palette-outline" size={18} color={TOOL_COLOR} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
          Theme
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: TOOL_COLOR, borderRadius: colors.radius }]}>
          <MaterialCommunityIcons name="palette-outline" size={34} color="#FFFFFF" />
          <Text style={[styles.heroTitle, { fontFamily: 'Inter_700Bold' }]}>Appearance</Text>
          <Text style={[styles.heroSub, { fontFamily: 'Inter_400Regular' }]}>
            {ALL_THEMES.length} themes available — pick your favourite
          </Text>
        </View>

        <Text style={[styles.sectionLabel, {
          color: colors.mutedForeground,
          fontFamily: 'Inter_600SemiBold',
        }]}>
          SELECT THEME
        </Text>

        {/* Theme cards — 2-column grid */}
        <View style={styles.grid}>
          {ALL_THEMES.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={selected === theme.id}
              isActive={themeId === theme.id}
               onPress={() => void handleThemeSelect(theme.id)}
            />
          ))}
        </View>

        {/* Success banner */}
        {saved && (
          <View style={[styles.successBanner, {
            backgroundColor: '#10B981' + '18',
            borderRadius: colors.radius,
          }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color="#10B981" />
            <Text style={[styles.successText, {
              color: '#10B981',
              fontFamily: 'Inter_600SemiBold',
            }]}>
              Theme saved successfully!
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: colors.border, borderRadius: colors.radius }]}
            onPress={handleReset}
          >
            <MaterialCommunityIcons name="refresh" size={17} color={colors.mutedForeground} />
            <Text style={[styles.resetText, {
              color: colors.mutedForeground,
              fontFamily: 'Inter_600SemiBold',
            }]}>
              Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, {
              backgroundColor: TOOL_COLOR,
              borderRadius: colors.radius,
              opacity: busy ? 0.7 : 1,
            }]}
            onPress={handleSave}
            disabled={busy}
          >
            <MaterialCommunityIcons name="content-save-outline" size={17} color="#FFF" />
            <Text style={[styles.saveBtnText, { fontFamily: 'Inter_700Bold' }]}>
              {busy ? 'Applying…' : 'Apply Theme'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Theme info note */}
        <View style={[styles.infoRow, {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        }]}>
          <MaterialCommunityIcons name="information-outline" size={15} color={colors.mutedForeground} />
          <Text style={[styles.infoText, {
            color: colors.mutedForeground,
            fontFamily: 'Inter_400Regular',
          }]}>
            Theme applies instantly across the entire app. Your choice is saved locally on the device.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Theme Card Component ───────────────────────────────────────────────────────
function ThemeCard({
  theme,
  isSelected,
  isActive,
  onPress,
}: {
  theme:      ThemeMeta;
  isSelected: boolean;
  isActive:   boolean;
  onPress:    () => void;
}) {
  const colors     = useColors();
  const tc         = getThemeColors(theme.id);
  const borderClr  = isSelected ? TOOL_COLOR : colors.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.themeCard, {
        backgroundColor: colors.card,
        borderColor:     borderClr,
        borderWidth:     isSelected ? 2 : 1,
        borderRadius:    colors.radius,
      }]}
    >
      {/* Mini preview */}
      <View style={[styles.preview, {
        backgroundColor:              tc.background,
        borderTopLeftRadius:          colors.radius - 2,
        borderTopRightRadius:         colors.radius - 2,
      }]}>
        {/* Top bar */}
        <View style={[styles.previewBar, { backgroundColor: tc.primary }]} />
        {/* Content rows */}
        <View style={styles.previewBody}>
          <View style={[styles.previewRow, { backgroundColor: tc.card, borderRadius: 3 }]} />
          <View style={[styles.previewRowShort, { backgroundColor: tc.card, borderRadius: 3 }]} />
          <View style={styles.previewChips}>
            <View style={[styles.previewChip, { backgroundColor: tc.primary + '40' }]} />
            <View style={[styles.previewChip, { backgroundColor: tc.muted, width: 20 }]} />
          </View>
        </View>
        {/* Bottom nav dots */}
        <View style={[styles.previewNav, { backgroundColor: tc.card }]}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.previewDot,
                { backgroundColor: i === 0 ? tc.primary : tc.mutedForeground + '60' },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Label row */}
      <View style={styles.cardInfo}>
        <View style={[styles.cardIconBox, { backgroundColor: theme.swatches[0] + '20' }]}>
          <MaterialCommunityIcons name={theme.icon as any} size={16} color={theme.swatches[0]} />
        </View>
        <View style={styles.cardText}>
          <Text style={[styles.cardName, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            {theme.name}
          </Text>
          {isActive && (
            <Text style={[styles.activeBadge, { color: theme.swatches[0], fontFamily: 'Inter_600SemiBold' }]}>
              Active
            </Text>
          )}
        </View>
        {isSelected && (
          <MaterialCommunityIcons name="check-circle" size={20} color={TOOL_COLOR} />
        )}
      </View>

      {/* Color swatches */}
      <View style={[styles.swatchRow, { borderTopColor: colors.border }]}>
        {theme.swatches.map((color, i) => (
          <View
            key={i}
            style={[styles.swatch, { backgroundColor: color, borderColor: colors.border }]}
          />
        ))}
        <Text style={[styles.swatchLabel, {
          color: colors.mutedForeground,
          fontFamily: 'Inter_400Regular',
        }]}>
          {theme.isDark ? '🌙 Dark' : '☀️ Light'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, gap: 10,
  },
  iconBtn:     { padding: 8, borderRadius: 8 },
  headerIcon:  { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18 },

  scroll: { padding: 16, gap: 14 },

  hero: {
    padding: 24, alignItems: 'center', gap: 6, marginBottom: 2,
  },
  heroTitle: { fontSize: 20, color: '#FFF' },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.82)', textAlign: 'center' },

  sectionLabel: { fontSize: 11, letterSpacing: 0.8 },

  // 2-column grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Each card ~half width
  themeCard: {
    width: '47.5%',
    overflow: 'hidden',
  },

  // Mini preview area
  preview: {
    height: 96,
    overflow: 'hidden',
  },
  previewBar: { height: 16, width: '100%' },
  previewBody: { flex: 1, padding: 6, gap: 4 },
  previewRow: { height: 10, width: '100%' },
  previewRowShort: { height: 10, width: '70%' },
  previewChips: { flexDirection: 'row', gap: 4, marginTop: 2 },
  previewChip: { height: 8, width: 28, borderRadius: 4 },
  previewNav: {
    height: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  previewDot: { width: 14, height: 3, borderRadius: 2 },

  // Card info below preview
  cardInfo: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, padding: 10,
  },
  cardIconBox: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText:    { flex: 1 },
  cardName:    { fontSize: 13 },
  activeBadge: { fontSize: 10, marginTop: 1 },

  // Swatch strip
  swatchRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, paddingHorizontal: 10, paddingBottom: 10,
    borderTopWidth: 1, paddingTop: 8,
  },
  swatch: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 1,
  },
  swatchLabel: { fontSize: 10, marginLeft: 2 },

  // Success banner
  successBanner: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, padding: 12,
  },
  successText: { fontSize: 14 },

  // Action buttons
  actions: { flexDirection: 'row', gap: 10 },
  resetBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, padding: 14, borderWidth: 1,
  },
  resetText: { fontSize: 14 },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, padding: 14,
  },
  saveBtnText: { fontSize: 15, color: '#FFF' },

  // Info note
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 8, padding: 12, borderWidth: 1,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
});
