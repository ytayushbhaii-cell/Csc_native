/**
 * expo-font shim — no-op for RN CLI.
 * Fonts are loaded via android/app/src/main/assets/fonts/ instead.
 */

export function useFonts(_fontMap?: Record<string, unknown>): [boolean, null] {
  return [true, null];
}

export async function loadAsync(_fontMap: Record<string, unknown>): Promise<void> {
  // no-op — fonts available via native assets
}

export function isLoaded(_fontFamily: string): boolean {
  return true;
}

export function isLoading(_fontFamily: string): boolean {
  return false;
}

export function unloadAsync(_fontFamily: string): Promise<void> {
  return Promise.resolve();
}
