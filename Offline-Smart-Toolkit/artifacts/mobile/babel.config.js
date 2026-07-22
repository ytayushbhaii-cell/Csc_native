module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    // Module alias: @/ → project root
    [
      'module-resolver',
      {
        root: ['.'],
        extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.jsx', '.js', '.json'],
        alias: {
          '@': '.',
        },
      },
    ],
    // Reanimated must be last
    'react-native-reanimated/plugin',
  ],
};
