import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
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
  const systemColorScheme = useColorScheme();
  const [themeId, setThemeId] = useState<string>(
    systemColorScheme === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((value) => {
      if (value !== null) setThemeId(value);
    });
  }, []);

  const setThemeById = async (id: string) => {
    setThemeId(id);
    await AsyncStorage.setItem(THEME_KEY, id);
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
