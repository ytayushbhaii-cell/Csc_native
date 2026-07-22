/**
 * expo-splash-screen shim — no-ops for React Native CLI.
 * The splash screen is handled by react-native-splash-screen via MainActivity.
 */
import SplashScreen from 'react-native-splash-screen';

export async function preventAutoHideAsync(): Promise<boolean> {
  return true;
}

export async function hideAsync(): Promise<boolean> {
  try {
    SplashScreen.hide();
  } catch { /* ignore if not available */ }
  return true;
}

export function setOptions(_options: Record<string, unknown>): void {
  // no-op
}
