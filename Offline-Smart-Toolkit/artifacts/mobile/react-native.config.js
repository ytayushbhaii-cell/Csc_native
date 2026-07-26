/**
 * React Native CLI configuration.
 * - Points the CLI at the android/ source directory.
 * - Keeps the React Native CLI project self-contained. Optional legacy modules
 *   are not autolinked; their behavior is provided by local RN adapters.
 *
 * NOTE: Package names with '/' (deep imports like 'expo-file-system/legacy')
 * are NOT valid autolinking keys and have been excluded to prevent
 * react-native config parse errors.
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
    // NOTE: 'expo-file-system/legacy' removed — slash in key is invalid for
    // autolinking and caused react-native config parse warnings.
  },
};
