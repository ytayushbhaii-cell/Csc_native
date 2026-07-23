import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeMeta } from '@/hooks/useColors';

interface ThemeContextType {
  themeId:      string;
  isDark:       boolean;
  setThemeById: (id: string) => Promise<void>;
  toggleTheme:  () => void;   // kept for backward compat — toggles light ↔ dark
}

const ThemeContext = createContext<ThemeContextType>({
  themeId:      'light',
  isDark:       false,
  setThemeById: async () => {},
  toggleTheme:  () => {},
});

const THEME_KEY = '@csc_toolkit_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Light is the explicit product default; do not silently follow device mode.
  const [themeId, setThemeId] = useState<string>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((value) => {
      if (value !== null) setThemeId(getThemeMeta(value).id);
    });
  }, []);

  const setThemeById = async (id: string) => {
    const normalizedId = getThemeMeta(id).id;
    setThemeId(normalizedId);
    await AsyncStorage.setItem(THEME_KEY, normalizedId);
  };

  // Backward compat: toggle between light ↔ dark only
  const toggleTheme = () => {
    const next = themeId === 'light' ? 'dark' : 'light';
    setThemeId(next);
    AsyncStorage.setItem(THEME_KEY, next);
  };

  const isDark = getThemeMeta(themeId).isDark;

  return (
    <ThemeContext.Provider value={{ themeId, isDark, setThemeById, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
