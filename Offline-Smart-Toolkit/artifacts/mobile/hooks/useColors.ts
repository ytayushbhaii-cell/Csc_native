import { useTheme } from '@/context/ThemeContext';

// ── Theme color palette type ──────────────────────────────────────────────────
export interface ThemeColors {
  background:        string;
  card:              string;
  border:            string;
  foreground:        string;
  primary:           string;
  primaryForeground: string;
  muted:             string;
  mutedForeground:   string;
  accent:            string;
  accentForeground:  string;
  radius:            number;
}

export type Colors = ThemeColors;

// ── Theme metadata (used in settings screen) ──────────────────────────────────
export interface ThemeMeta {
  id:          string;
  name:        string;
  nameHi:      string;
  icon:        string;
  description: string;
  isDark:      boolean;
  /** Two swatch colors shown in the picker: [primary, background] */
  swatches:    [string, string];
}

// ── All theme definitions ─────────────────────────────────────────────────────

const THEMES: Record<string, ThemeColors> = {
  // 1. Clean Light (default)
  light: {
    background:        '#FFFFFF',
    card:              '#F8FAFC',
    border:            '#E2E8F0',
    foreground:        '#0F172A',
    primary:           '#1D4ED8',
    primaryForeground: '#FFFFFF',
    muted:             '#F1F5F9',
    mutedForeground:   '#64748B',
    accent:            '#EFF6FF',
    accentForeground:  '#1D4ED8',
    radius:            12,
  },

  // 2. Midnight Dark
  dark: {
    background:        '#0F172A',
    card:              '#1E293B',
    border:            '#334155',
    foreground:        '#F8FAFC',
    primary:           '#3B82F6',
    primaryForeground: '#FFFFFF',
    muted:             '#1E293B',
    mutedForeground:   '#94A3B8',
    accent:            '#172554',
    accentForeground:  '#93C5FD',
    radius:            12,
  },

  // 3. Forest Green (dark)
  forest: {
    background:        '#071A10',
    card:              '#0F2D1A',
    border:            '#1A4228',
    foreground:        '#ECFDF5',
    primary:           '#22C55E',
    primaryForeground: '#FFFFFF',
    muted:             '#0F2D1A',
    mutedForeground:   '#6EE7B7',
    accent:            '#052E16',
    accentForeground:  '#4ADE80',
    radius:            12,
  },

  // 4. Golden Sunset (warm light)
  sunset: {
    background:        '#FFFBF5',
    card:              '#FEF3E2',
    border:            '#FDE68A',
    foreground:        '#1C1000',
    primary:           '#D97706',
    primaryForeground: '#FFFFFF',
    muted:             '#FFF8EC',
    mutedForeground:   '#92400E',
    accent:            '#FFFBEB',
    accentForeground:  '#B45309',
    radius:            12,
  },

  // 5. Deep Ocean (dark teal)
  ocean: {
    background:        '#020B18',
    card:              '#071929',
    border:            '#0C2B45',
    foreground:        '#E0F2FE',
    primary:           '#0EA5E9',
    primaryForeground: '#FFFFFF',
    muted:             '#071929',
    mutedForeground:   '#7DD3FC',
    accent:            '#021020',
    accentForeground:  '#38BDF8',
    radius:            12,
  },

  // 6. Purple Night (dark violet)
  purple: {
    background:        '#0E0720',
    card:              '#180E2E',
    border:            '#2D1B4E',
    foreground:        '#EDE9FE',
    primary:           '#8B5CF6',
    primaryForeground: '#FFFFFF',
    muted:             '#180E2E',
    mutedForeground:   '#C4B5FD',
    accent:            '#1E0A3C',
    accentForeground:  '#A78BFA',
    radius:            12,
  },

  // 7. Rose Blush (soft light)
  rose: {
    background:        '#FFF7FA',
    card:              '#FFFFFF',
    border:            '#FBCFE8',
    foreground:        '#4A102A',
    primary:           '#DB2777',
    primaryForeground: '#FFFFFF',
    muted:             '#FCE7F3',
    mutedForeground:   '#9D174D',
    accent:            '#FDF2F8',
    accentForeground:  '#BE185D',
    radius:            12,
  },

  // 8. Slate Professional (dark neutral)
  slate: {
    background:        '#111827',
    card:              '#1F2937',
    border:            '#374151',
    foreground:        '#F9FAFB',
    primary:           '#94A3B8',
    primaryForeground: '#0F172A',
    muted:             '#1F2937',
    mutedForeground:   '#CBD5E1',
    accent:            '#273449',
    accentForeground:  '#E2E8F0',
    radius:            12,
  },

  // 9. High Contrast (accessibility focused)
  contrast: {
    background:        '#FFFFFF',
    card:              '#FFFFFF',
    border:            '#111827',
    foreground:        '#000000',
    primary:           '#111827',
    primaryForeground: '#FFFFFF',
    muted:             '#F3F4F6',
    mutedForeground:   '#374151',
    accent:            '#FEF08A',
    accentForeground:  '#000000',
    radius:            8,
  },

  // 10. Mint Fresh (calm light)
  mint: {
    background:        '#F3FFFB',
    card:              '#FFFFFF',
    border:            '#A7F3D0',
    foreground:        '#052E2B',
    primary:           '#0F766E',
    primaryForeground: '#FFFFFF',
    muted:             '#ECFDF5',
    mutedForeground:   '#0F766E',
    accent:            '#CCFBF1',
    accentForeground:  '#115E59',
    radius:            12,
  },
};

// ── Theme metadata list (ordered for the picker) ──────────────────────────────
export const ALL_THEMES: ThemeMeta[] = [
  {
    id:          'light',
    name:        'Light',
    nameHi:      'लाइट',
    icon:        'weather-sunny',
    description: 'Clean white background — ideal for bright environments',
    isDark:      false,
    swatches:    ['#1D4ED8', '#FFFFFF'],
  },
  {
    id:          'dark',
    name:        'Dark',
    nameHi:      'डार्क',
    icon:        'weather-night',
    description: 'Dark navy — easy on the eyes in low-light conditions',
    isDark:      true,
    swatches:    ['#3B82F6', '#0F172A'],
  },
  {
    id:          'forest',
    name:        'Forest',
    nameHi:      'फॉरेस्ट',
    icon:        'tree-outline',
    description: 'Deep green tones inspired by nature',
    isDark:      true,
    swatches:    ['#22C55E', '#071A10'],
  },
  {
    id:          'sunset',
    name:        'Sunset',
    nameHi:      'सनसेट',
    icon:        'weather-sunset',
    description: 'Warm golden tones — perfect for a cosy feel',
    isDark:      false,
    swatches:    ['#D97706', '#FFFBF5'],
  },
  {
    id:          'ocean',
    name:        'Ocean',
    nameHi:      'ओशन',
    icon:        'waves',
    description: 'Deep ocean blue — calm and focused',
    isDark:      true,
    swatches:    ['#0EA5E9', '#020B18'],
  },
  {
    id:          'purple',
    name:        'Purple Night',
    nameHi:      'पर्पल नाइट',
    icon:        'star-crescent',
    description: 'Rich violet — striking dark theme for night owls',
    isDark:      true,
    swatches:    ['#8B5CF6', '#0E0720'],
  },
  {
    id:          'rose',
    name:        'Rose Blush',
    nameHi:      'रोज़ ब्लश',
    icon:        'flower-outline',
    description: 'Soft pink accents with a warm, friendly feel',
    isDark:      false,
    swatches:    ['#DB2777', '#FFF7FA'],
  },
  {
    id:          'slate',
    name:        'Slate',
    nameHi:      'स्लेट',
    icon:        'layers-outline',
    description: 'Professional neutral tones for focused work',
    isDark:      true,
    swatches:    ['#94A3B8', '#111827'],
  },
  {
    id:          'contrast',
    name:        'High Contrast',
    nameHi:      'हाई कॉन्ट्रास्ट',
    icon:        'contrast-box',
    description: 'Maximum clarity with strong readable contrast',
    isDark:      false,
    swatches:    ['#111827', '#FFFFFF'],
  },
  {
    id:          'mint',
    name:        'Mint Fresh',
    nameHi:      'मिंट फ्रेश',
    icon:        'leaf',
    description: 'Calm teal and mint tones for a fresh workspace',
    isDark:      false,
    swatches:    ['#0F766E', '#F3FFFB'],
  },
];

export function getThemeColors(themeId: string): ThemeColors {
  return THEMES[themeId] ?? THEMES.light;
}

export function getThemeMeta(themeId: string): ThemeMeta {
  return ALL_THEMES.find((t) => t.id === themeId) ?? ALL_THEMES[0];
}

export function useColors(): Colors {
  const { themeId } = useTheme();
  return getThemeColors(themeId);
}
