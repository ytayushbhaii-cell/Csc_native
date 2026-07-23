/**
 * webpack config for CSC Smart Toolkit — react-native-web preview.
 *
 * Bundles the React Native app for the browser so the actual UI renders
 * in the Replit preview pane. react-native APIs are handled by react-native-web.
 * Expo APIs are either shimmed (expo-router) or use their own web implementations.
 */
const path              = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack           = require('webpack');

const projectRoot = __dirname; // Offline-Smart-Toolkit/artifacts/mobile/

// ── Packages that ship ESM / TS and must be compiled by babel-loader ─────────
// NOTE: With pnpm the physical path is node_modules/.pnpm/<pkg>@ver/node_modules/<pkg>/...
// A simple "starts-with" regex on the first node_modules segment doesn't work.
// We use a function that checks every node_modules/<pkg>/ segment in the path.
const TRANSFORM_PACKAGES_LIST = [
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
  'react-native-vector-icons',
  '@react-navigation',
  '@react-native-async-storage',
  '@react-native-clipboard',
  '@react-native-community',
  // Expo packages that ship TypeScript source or ESM that needs transpilation
  'expo',
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
];

/**
 * Returns true (exclude) when a file is in node_modules AND is NOT one of the
 * packages above.  Works with pnpm's virtual-store layout where paths look like:
 *   …/node_modules/.pnpm/react-native@0.81.5/node_modules/react-native/…
 */
function transformExclude(filepath) {
  if (!filepath.includes('node_modules')) return false; // project source → always transform
  // Check every node_modules/<segment> in the path
  for (const pkg of TRANSFORM_PACKAGES_LIST) {
    // Handles both scoped (@react-navigation/…) and unscoped (react-native/…)
    if (filepath.includes(`/node_modules/${pkg}/`) || filepath.includes(`\\node_modules\\${pkg}\\`)) {
      return false; // in an allowed package → transform
    }
  }
  return true; // in an unrecognised node_modules package → skip
}

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

      // ── All other expo packages → shims (Metro handles these via resolveRequest;
      //    webpack needs explicit aliases for each one) ───────────────────────
      'expo-linear-gradient': path.join(projectRoot, 'shims/expo-linear-gradient'),
      'expo-status-bar':      path.join(projectRoot, 'shims/expo-status-bar'),
      '@expo/vector-icons':   path.join(projectRoot, 'shims/expo-vector-icons'),
      'expo-constants':       path.join(projectRoot, 'shims/expo-constants'),
      'expo-font':            path.join(projectRoot, 'shims/expo-font'),
      'expo-clipboard':       path.join(projectRoot, 'shims/expo-clipboard'),
      'expo-haptics':         path.join(projectRoot, 'shims/expo-haptics'),
      'expo-linking':         path.join(projectRoot, 'shims/expo-linking'),
      'expo-splash-screen':   path.join(projectRoot, 'shims/expo-splash-screen'),
      // expo-file-system/legacy — legacy sub-path with cacheDirectory/documentDirectory constants
      // needed by signature bg-remove; stubs them to null on web (file I/O only runs on native)
      'expo-file-system/legacy': path.join(projectRoot, 'shims/expo-file-system-legacy'),
      // These packages use expo-modules-core native bindings; replace with web stubs
      'expo-image-picker':        path.join(projectRoot, 'shims/expo-image-picker'),
      // expo-camera — native camera bridge; scanners fall back to "not available" UI on web
      'expo-camera':              path.join(projectRoot, 'shims/expo-camera'),
      // expo-sharing — native share sheet; screens use Web Share API / download fallback on web
      'expo-sharing':             path.join(projectRoot, 'shims/expo-sharing'),
      // expo-media-library — native gallery; guarded by Platform.OS !== 'web' in screens
      'expo-media-library':       path.join(projectRoot, 'shims/expo-media-library'),
      // expo-image-manipulator → Canvas-API web shim (webpack picks .web.ts automatically)
      'expo-image-manipulator':   path.join(projectRoot, 'shims/expo-image-manipulator'),
      // expo-image → standard RN Image (react-native-web maps it to <img>)
      'expo-image':               path.join(projectRoot, 'shims/expo-image'),
      // expo-document-picker → browser file-input shim (webpack picks .web.ts automatically)
      'expo-document-picker':     path.join(projectRoot, 'shims/expo-document-picker'),
      // expo-file-system → no-op web shim (reuse legacy shim — same no-op surface)
      'expo-file-system':         path.join(projectRoot, 'shims/expo-file-system-legacy'),
      // expo-blur ships its own web implementation — no shim needed

      // ── react-native-svg → web build (avoids native bridge code) ──────────
      'react-native-svg': path.join(
        projectRoot,
        'node_modules/react-native-svg/src/ReactNativeSVG.web.ts'
      ),

      // ── expo-modules-core → web shim (ships only TS source babel can't parse) ──
      'expo-modules-core': path.join(projectRoot, 'shims/expo-modules-core'),

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
      // ── ESM "fully specified" fix ─────────────────────────────────────────
      // @react-navigation, @react-native-async-storage etc. ship .mjs files
      // that use relative imports without extensions. webpack 5 strict ESM
      // mode requires fully-specified paths; this rule relaxes it.
      {
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      },

      // ── JavaScript / TypeScript / JSX / TSX ───────────────────────────────
      {
        test: /\.(tsx?|jsx?)$/,
        exclude: transformExclude,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            // IMPORTANT: disable project-level babel.config.js (Metro preset)
            // so it doesn't conflict with the web-specific config below.
            configFile: false,
            babelrc:    false,
            // Babel 7.13+ assumptions — must all agree across every plugin.
            // privateFieldsAsSymbols:true is what @babel/helper-create-class-features
            // expects when loose:true was set by other plugins.
            assumptions: {
              setPublicClassFields:      true,
              privateFieldsAsProperties: true,
              privateFieldsAsSymbols:    true,
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
              // TypeScript — allExtensions:true so babel strips TS syntax from
              // .js files too (e.g. react-native-linear-gradient/index.windows.js
              // uses `import type` in a plain .js file).
              ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
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

    // ── React Native globals ────────────────────────────────────────────────
    // RN source code uses __DEV__, process.env.NODE_ENV, etc. without importing them.
    new webpack.DefinePlugin({
      __DEV__:               JSON.stringify(true),
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env':          JSON.stringify({ NODE_ENV: 'development' }),
      // Prevent "global is not defined" in packages that reference it directly
      global:                'globalThis',
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
