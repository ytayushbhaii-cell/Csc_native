/**
 * Metro configuration for React Native / Expo (bare workflow).
 * Provides:
 *  - Monorepo watchFolders + nodeModulesPaths support
 *  - Shim redirection for expo-* packages → /shims/
 *  - pdf-lib CJS fix
 *  - ONNX / WASM asset extensions
 */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const fs   = require('fs');

const projectRoot   = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// ── Shim map: package name → shim file path ─────────────────────────────────
const SHIMS = {
  'expo':                     path.join(projectRoot, 'shims/expo.ts'),
  'expo-router':              path.join(projectRoot, 'shims/expo-router.tsx'),
  '@expo/vector-icons':       path.join(projectRoot, 'shims/expo-vector-icons.ts'),
  'expo-status-bar':          path.join(projectRoot, 'shims/expo-status-bar.tsx'),
  'expo-linear-gradient':     path.join(projectRoot, 'shims/expo-linear-gradient.ts'),
  'expo-splash-screen':       path.join(projectRoot, 'shims/expo-splash-screen.ts'),
  'expo-font':                path.join(projectRoot, 'shims/expo-font.ts'),
  'expo-haptics':             path.join(projectRoot, 'shims/expo-haptics.ts'),
  'expo-clipboard':           path.join(projectRoot, 'shims/expo-clipboard.ts'),
  'expo-linking':             path.join(projectRoot, 'shims/expo-linking.ts'),
  'expo-constants':           path.join(projectRoot, 'shims/expo-constants.ts'),
  '@expo-google-fonts/inter': path.join(projectRoot, 'shims/expo-google-fonts-inter.ts'),
};

const defaults = getDefaultConfig(projectRoot);

// ── watchFolders ─────────────────────────────────────────────────────────────
const watchFolders = [...(defaults.watchFolders ?? [])];
if (fs.existsSync(workspaceRoot)) watchFolders.push(workspaceRoot);

// ── nodeModulesPaths ──────────────────────────────────────────────────────────
const nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
].filter(fs.existsSync);

// ── resolveRequest ────────────────────────────────────────────────────────────
function resolveRequest(context, moduleName, platform) {
  // 1. Expo shims
  if (SHIMS[moduleName]) {
    return { filePath: SHIMS[moduleName], type: 'sourceFile' };
  }

  // 2. pdf-lib → CJS build
  if (moduleName === 'pdf-lib') {
    try {
      const pkgJson = require.resolve('pdf-lib/package.json', {
        paths: [projectRoot, workspaceRoot],
      });
      return { filePath: path.join(path.dirname(pkgJson), 'cjs', 'index.js'), type: 'sourceFile' };
    } catch { /* fall through */ }
  }

  // 3. onnxruntime-web → wasm-only bundle (avoids .jsep.mjs crash)
  if (moduleName === 'onnxruntime-web') {
    try {
      const ortPkg = require.resolve('onnxruntime-web/package.json', {
        paths: [projectRoot, workspaceRoot],
      });
      return { filePath: path.join(path.dirname(ortPkg), 'dist', 'ort.wasm.min.js'), type: 'sourceFile' };
    } catch { /* fall through */ }
  }

  return context.resolveRequest(context, moduleName, platform);
}

const config = {
  watchFolders,
  resolver: {
    nodeModulesPaths,
    resolverMainFields: ['react-native', 'main', 'browser', 'module'],
    resolveRequest,
    assetExts: [
      ...(defaults.resolver?.assetExts ?? []),
      'onnx',
      'wasm',
    ],
  },
};

module.exports = mergeConfig(defaults, config);
