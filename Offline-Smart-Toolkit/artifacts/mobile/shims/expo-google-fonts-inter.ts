/**
 * @expo-google-fonts/inter shim.
 *
 * In RN CLI mode fonts are loaded via android/app/src/main/assets/fonts/.
 * This shim makes useFonts() return [true, null] immediately so no
 * async font loading gate blocks the app.
 *
 * The actual Inter font files must be placed in:
 *   android/app/src/main/assets/fonts/Inter_400Regular.ttf
 *   android/app/src/main/assets/fonts/Inter_500Medium.ttf
 *   android/app/src/main/assets/fonts/Inter_600SemiBold.ttf
 *   android/app/src/main/assets/fonts/Inter_700Bold.ttf
 */

// Placeholder font objects (not actually used by RN CLI — files in assets/fonts/ are used)
export const Inter_100Thin       = {};
export const Inter_200ExtraLight = {};
export const Inter_300Light      = {};
export const Inter_400Regular    = {};
export const Inter_500Medium     = {};
export const Inter_600SemiBold   = {};
export const Inter_700Bold       = {};
export const Inter_800ExtraBold  = {};
export const Inter_900Black      = {};

/** Always returns loaded=true; fonts are available via native assets/fonts. */
export function useFonts(_fontMap?: Record<string, unknown>): [boolean, null] {
  return [true, null];
}
