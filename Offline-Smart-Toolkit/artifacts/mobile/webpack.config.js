/**
 * webpack config for CSC Smart Toolkit — react-native-web preview.
 *
 * Bundles the React Native app for the browser so the actual UI renders
 * in the Replit preview pane. react-native APIs are handled by react-native-web.
 * Expo APIs are either shimmed (expo-router) or use their own web implementations.
 */
const path             = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const projectRoot = __dirname; // Offline-Smart-Toolkit/artifacts/mobile/

// ── Packages that ship ESM / TS and must be compiled by babel-loader ─────────
const TRANSFORM_PACKAGES = [
  'react-native',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-svg',
  'react-native-qrcode-svg',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-linear-gradient',
  'react-native-haptic-feedback',
  'react-native-share',
  '@react-navigation',
  '@react-native-async-storage',
  '@react-native-clipboard',
  '@react-native-community',
  'expo-modules-core',
  'expo-file-system',
  'expo-image-picker',
  'expo-document-picker',
  'expo-clipboard',
  'expo-sharing',
  'expo-camera',
  'expo-image',
  'expo-image-manipulator',
  'expo-status-bar',
  'expo-linear-gradient',
  'expo-splash-screen',
  'expo-font',
  'expo-constants',
  'expo-linking',
  'expo-haptics',
  'expo-blur',
  '@expo/vector-icons',
  '@expo-google-fonts',
  '@unimodules',
].join('|');

const transformExclude = new RegExp(
  `node_modules[\\\\/](?!(${TRANSFORM_PACKAGES})[\\\\/])`
);

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',

  // ── Entry & output ─────────────────────────────────────────────────────────
  entry: path.join(projectRoot, 'index.web.js'),
  output: {
    path:       path.join(projectRoot, 'dist-web'),
    filename:   'bundle.js',
    publicPath: '/',
  },

  // ── Module resolution ──────────────────────────────────────────────────────
  resolve: {
    // Platform extensions — try .web.* variants first (mirrors Metro)
    extensions: [
      '.web.tsx', '.web.ts', '.web.jsx', '.web.js',
      '.tsx', '.ts', '.jsx', '.js', '.json',
    ],

    alias: {
      // ── Core: react-native → react-native-web ─────────────────────────────
      'react-native$': 'react-native-web',

      // ── expo-router MUST use shim (app uses React Navigation) ─────────────
      'expo-router': path.join(projectRoot, 'shims/expo-router'),

      // ── react-native-svg → web build (avoids native bridge code) ──────────
      'react-native-svg': path.join(
        projectRoot,
        'node_modules/react-native-svg/src/ReactNativeSVG.web.ts'
      ),

      // ── react-native-view-shot → no-op stub on web ────────────────────────
      'react-native-view-shot': path.join(
        projectRoot,
        'shims/web/react-native-view-shot.js'
      ),

      // ── Module path alias: @/ → project root (matches tsconfig + Metro) ───
      '@': projectRoot,
    },

    // Prefer browser / module over main for web-compatible builds
    mainFields: ['browser', 'module', 'main'],
  },

  // ── Loaders ────────────────────────────────────────────────────────────────
  module: {
    rules: [
      // ── JavaScript / TypeScript / JSX / TSX ───────────────────────────────
      {
        test: /\.(tsx?|jsx?)$/,
        exclude: transformExclude,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            // Babel 7.13+ assumptions — resolve the "loose mode must match"
            // conflict that arises between preset-env and reanimated/plugin.
            assumptions: {
              setPublicClassFields:       true,
              privateFieldsAsProperties:  true,
              privateFieldsAsSymbols:     false,
            },
            presets: [
              // Target modern Chrome for the web preview
              ['@babel/preset-env', {
                targets: { chrome: '90' },
                useBuiltIns: false,
                modules: false,       // Let webpack handle ES modules
              }],
              // React JSX (automatic runtime — no need to import React)
              ['@babel/preset-react', { runtime: 'automatic' }],
              // TypeScript (v8+ — no allExtensions/isTSX options)
              '@babel/preset-typescript',
            ],
            plugins: [
              // @/ alias — same mapping as Metro config
              ['module-resolver', { root: ['.'], alias: { '@': '.' } }],
              // NOTE: react-native-reanimated/plugin is intentionally omitted.
              // On web, reanimated v3 uses a DOM-based layer that does NOT need
              // the Worklet transform. Including it causes a 'loose mode' clash
              // between preset-env and the plugin's internal class transforms.
            ],
          },
        },
      },

      // ── Static image assets ────────────────────────────────────────────────
      {
        test: /\.(png|jpg|jpeg|gif|webp|bmp)$/,
        type: 'asset/resource',
        generator: { filename: 'assets/images/[hash][ext]' },
      },

      // ── Font files ─────────────────────────────────────────────────────────
      {
        test: /\.(ttf|otf|woff|woff2)$/,
        type: 'asset/resource',
        generator: { filename: 'assets/fonts/[hash][ext]' },
      },

      // ── SVG as URLs (not React components — react-native-svg handles SVG rendering) ─
      {
        test: /\.svg$/,
        type: 'asset/resource',
        generator: { filename: 'assets/svg/[hash][ext]' },
      },

      // ── ONNX models + WASM binaries ────────────────────────────────────────
      {
        test: /\.(onnx|wasm)$/,
        type: 'asset/resource',
        generator: { filename: 'assets/ml/[hash][ext]' },
      },
    ],
  },

  // ── Plugins ────────────────────────────────────────────────────────────────
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(projectRoot, 'public/index.html'),
      title:    'CSC Smart Toolkit',
    }),
  ],

  // ── Dev server ─────────────────────────────────────────────────────────────
  devServer: {
    port:    5000,
    host:    '0.0.0.0',
    hot:     true,
    historyApiFallback: true,
    allowedHosts: 'all',
    headers: { 'Access-Control-Allow-Origin': '*' },
    client: {
      overlay: { errors: true, warnings: false },
    },
  },
};
