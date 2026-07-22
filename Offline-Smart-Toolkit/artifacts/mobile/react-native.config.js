/**
 * React Native CLI configuration.
 * - Points the CLI at the android/ source directory.
 * - Disables autolinking for all Expo packages: their JS APIs are handled by
 *   Metro shims (shims/*.ts), so native autolinking is not needed or wanted.
 */
module.exports = {
  project: {
    android: {
      sourceDir: './android',
    },
  },
  assets: [
    './android/app/src/main/assets/fonts/',
  ],
  dependencies: {
    // ── Expo core ────────────────────────────────────────────────────────────
    'expo':                    { platforms: { android: null, ios: null } },
    'expo-modules-core':       { platforms: { android: null, ios: null } },

    // ── Expo modules (JS shimmed via Metro) ──────────────────────────────────
    'expo-blur':               { platforms: { android: null, ios: null } },
    'expo-camera':             { platforms: { android: null, ios: null } },
    'expo-clipboard':          { platforms: { android: null, ios: null } },
    'expo-constants':          { platforms: { android: null, ios: null } },
    'expo-document-picker':    { platforms: { android: null, ios: null } },
    'expo-file-system':        { platforms: { android: null, ios: null } },
    'expo-font':               { platforms: { android: null, ios: null } },
    'expo-image':              { platforms: { android: null, ios: null } },
    'expo-image-manipulator':  { platforms: { android: null, ios: null } },
    'expo-image-picker':       { platforms: { android: null, ios: null } },
    'expo-media-library':      { platforms: { android: null, ios: null } },
    'expo-sharing':            { platforms: { android: null, ios: null } },
    'expo-splash-screen':      { platforms: { android: null, ios: null } },
    'expo-sqlite':             { platforms: { android: null, ios: null } },
    'expo-system-ui':          { platforms: { android: null, ios: null } },
    'expo-web-browser':        { platforms: { android: null, ios: null } },
    '@expo/metro-config':      { platforms: { android: null, ios: null } },
  },
};
