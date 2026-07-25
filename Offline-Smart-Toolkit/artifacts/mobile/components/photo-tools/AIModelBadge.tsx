/**
 * Offline processing badge for tools that use on-device intelligence.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

type ServiceType = 'segmentation' | 'face' | 'enhancement';

interface Props {
  service: ServiceType;
  /** Override the label when a tool needs a more specific generic label. */
  label?: string;
  /** Show an expanded info card */
  showUpgradeHint?: boolean;
}

export function AIModelBadge({ service, label, showUpgradeHint = false }: Props) {
  const colors = useColors();
  const [expanded, setExpanded] = React.useState(false);

  const activeLabel = label ?? 'Offline AI';
  const dotColor = '#22C55E';

  return (
    <View>
      <TouchableOpacity
        style={[styles.badge, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 8 }]}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.8}
      >
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <MaterialCommunityIcons name="robot-outline" size={13} color={colors.mutedForeground} />
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
          {activeLabel}
        </Text>
        <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'information-outline'} size={13} color={colors.mutedForeground} />
      </TouchableOpacity>

      {expanded && showUpgradeHint && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 8 }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>AI Upgrade Path</Text>
          <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            This tool runs fully offline on your device. Processing stays local and no photos are uploaded.
          </Text>
          <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Processing continues to work offline after setup.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 5, paddingHorizontal: 9, borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  label: { fontSize: 11 },
  card: { borderWidth: 1, padding: 12, gap: 6, marginTop: 4 },
  cardTitle: { fontSize: 13 },
  cardBody: { fontSize: 11, lineHeight: 17 },
});
