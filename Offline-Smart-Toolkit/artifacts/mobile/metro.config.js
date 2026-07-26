/**
 * Metro configuration for React Native / Expo (bare workflow).
 * Provides:
 *  - Monorepo watchFolders + nodeModulesPaths support
 *  - Native adapter resolution for legacy feature imports
 *  - pdf-lib CJS fix
 *  - ONNX / WASM asset extensions
 */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const fs   = require('fs');

const projectRoot   = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// ── Native adapter map: legacy import name → React Native adapter ────────────
const SHIMS = {
  'expo-router':              path.join(projectRoot, 'lib/native/router'),
  '@expo/vector-icons':       path.join(projectRoot, 'lib/native/icons'),
  'expo-status-bar':          path.join(projectRoot, 'lib/native/status-bar'),
  'expo-linear-gradient':     path.join(projectRoot, 'lib/native/linear-gradient'),
  'expo-splash-screen':       path.join(projectRoot, 'lib/native/splash-screen'),
  'expo-font':                path.join(projectRoot, 'lib/native/font'),
  'expo-haptics':             path.join(projectRoot, 'lib/native/haptics'),
  'expo-clipboard':           path.join(projectRoot, 'lib/native/clipboard'),
  'expo-linking':             path.join(projectRoot, 'lib/native/linking'),
  'expo-constants':           path.join(projectRoot, 'lib/native/constants'),
  '@expo-google-fonts/inter': path.join(projectRoot, 'lib/native/google-fonts-inter'),
  'expo-image-manipulator':   path.join(projectRoot, 'lib/native/image-manipulator'),
  'expo-image':               path.join(projectRoot, 'lib/native/image'),
  'expo-document-picker':     path.join(projectRoot, 'lib/native/document-picker'),
  'expo-file-system':         path.join(projectRoot, 'lib/native/file-system'),
  'expo-file-system/legacy':  path.join(projectRoot, 'lib/native/file-system-legacy'),
  'expo-image-picker':        path.join(projectRoot, 'lib/native/image-picker'),
  'expo-sharing':             path.join(projectRoot, 'lib/native/sharing'),
  'expo-media-library':       path.join(projectRoot, 'lib/native/media-library'),
  'expo-camera':              path.join(projectRoot, 'lib/native/camera'),
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
  // 1. React Native adapters for legacy feature imports
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
