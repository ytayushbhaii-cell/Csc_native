import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { DrawerProvider } from '@/context/DrawerContext';
import { AppProvider } from '@/context/AppContext';
import { AppNavigator } from '@/navigation/AppNavigator';
// The navigationRef enables imperative navigation from outside React components
import { navigationRef } from '@/shims/expo-router';
import { initPhase6History } from '@/lib/phase6/Phase6History';

void initPhase6History();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SettingsProvider>
            <DrawerProvider>
              <AppProvider>
                <NavigationContainer ref={navigationRef}>
                  <AppNavigator />
                </NavigationContainer>
              </AppProvider>
            </DrawerProvider>
          </SettingsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
