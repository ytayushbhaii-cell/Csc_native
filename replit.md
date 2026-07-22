# CSC Smart Toolkit — Replit Project

## Overview

An offline-first mobile toolkit for CSC Centers, Cyber Cafes, Photo Studios, and Offices.
All processing happens 100% on-device — no internet, no cloud, no API calls.

### Stack
- **Framework:** React Native CLI 0.81.5 (migrated from Expo managed workflow)
- **Navigation:** React Navigation v7 (Stack navigator, 100+ screens)
- **UI:** react-native-reanimated, react-native-vector-icons, react-native-linear-gradient
- **AI / ML:** TensorFlow.js (CPU backend), ONNX Runtime React Native
- **PDF:** pdf-lib (pure-JS, offline)
- **OCR:** Tesseract.js (offline WASM)
- **State:** React Context (AppContext, ThemeContext, DrawerContext, SettingsContext)
- **Package manager:** pnpm (workspace monorepo)

### Monorepo layout
```
Offline-Smart-Toolkit/
  artifacts/
    mobile/       ← React Native CLI app (main deliverable)
    api-server/   ← Express + Drizzle ORM backend (optional)
```

## How to run (web preview — Replit)

Workflow: **Start application**
```
cd Offline-Smart-Toolkit/artifacts/mobile && npx webpack serve --config webpack.config.js
```
Bundles the app with react-native-web and serves on port 5000. The **CSC Smart Toolkit Home Screen** renders in the Replit preview pane with all icons, navigation, and tool grids.

### Web build — what works
- Full Home/Dashboard screen with Overview stats and Quick Access grid
- All navigation via React Navigation v7 Stack
- react-native-vector-icons (fonts injected via `shims/loadIconFonts.web.ts`)
- expo-modules-core shimmed (`shims/expo-modules-core.ts`) — bypasses TS source babel can't parse
- All expo-* packages shimmed for webpack (see shim map below)

### Web build — limitations (web-only, not on-device)
- Native ONNX / TensorFlow inference shows loading spinners (wasm not wired for web)
- File save/export uses web download fallback (no device filesystem)
- Camera (QR scanner) requires HTTPS + browser permissions

## Metro Bundler (for device/emulator)

```bash
cd Offline-Smart-Toolkit/artifacts/mobile
npx react-native start          # Metro on port 8081
npx react-native run-android    # Build & install on connected device
```

## APK Build

```bash
cd Offline-Smart-Toolkit/artifacts/mobile/android
./gradlew assembleDebug         # Debug APK
./gradlew assembleRelease       # Release APK
```

Output: `android/app/build/outputs/apk/`

## App Configuration
| Field | Value |
|---|---|
| App Name | CSC Smart Toolkit |
| Package Name | com.cscsmarttoolkit.app |
| Version | 1.0.0 |
| Min SDK | Android 7.0+ (API 24) |
| Target SDK | Android 15 (API 35) |

## Phase 1 Migration — Expo → React Native CLI ✅

### What was done
- **Entry point:** `index.js` uses `AppRegistry.registerComponent` (pure RN CLI)
- **Navigation:** `App.tsx` → `NavigationContainer` → `AppNavigator.tsx` (flat Stack, 100+ screens)
- **Expo shims:** All `expo-*` JS APIs shimmed via `shims/` + Metro `resolveRequest` redirects
- **Android project:** Full `android/` folder with Gradle, Kotlin, permissions, fonts
- **MainApplication.kt:** Pure `DefaultReactNativeHost` — no Expo module wrapper
- **Autolinking:** All Expo packages blocked in `react-native.config.js` (JS handled by shims)
- **tsconfig.json:** Standalone (no `expo/tsconfig.base` dependency)
- **babel.config.js:** `@react-native/babel-preset` (no Expo Babel preset)
- **metro.config.js:** `@react-native/metro-config` with shim redirects, pdf-lib CJS fix, ORT WASM fix

### Expo shim map (Metro → shims/)
| Import | Shimmed to |
|---|---|
| `expo-router` | React Navigation (useRouter, Link, Redirect, Stack) |
| `@expo/vector-icons` | react-native-vector-icons |
| `expo-linear-gradient` | react-native-linear-gradient |
| `expo-status-bar` | React Native StatusBar |
| `expo-clipboard` | @react-native-clipboard/clipboard |
| `expo-haptics` | react-native-haptic-feedback |
| `expo-splash-screen` | No-op (native splash via styles.xml) |
| `expo-font` | No-op (fonts in assets/fonts/) |
| `expo-constants` | Inline constants |
| `expo-linking` | React Native Linking |

## Feature modules (129 screens)

| Module | Route prefix | Screens |
|---|---|---|
| Photo Tools | `/photo-tools` | 25 |
| Document Tools | `/document-tools` | 26 (Aadhaar, PAN, Voter, DL, Passport, PDF) |
| QR Tools | `/qr-tools` | 2 |
| Barcode Tools | `/barcode-tools` | 2 |
| Signature & Stamp | `/signature-tools`, `/stamp-maker` | 5 |
| ID Card Generator | `/id-card-tools` | 4 |
| Print Layout | `/print-tools` | 5 |
| Utility Tools | `/utility-tools` | 3 |
| Settings | `/settings` | 6 |
| Dashboard / Tabs | `/dashboard` etc. | 8 |

## Key architecture notes

- **Expo shims:** Every `expo-*` import is redirected by Metro to `shims/` — screen files need no changes
- **Route mapping:** `navigation/routes.ts` maps Expo-router style paths to React Navigation screen names
- **Metro config:** `resolveRequest` handles shims, pdf-lib CJS, ORT WASM asset loading
- **Autolinking:** All Expo packages disabled in `react-native.config.js` — native RN packages used instead
- **Offline guarantee:** No external fetch calls; all AI models bundled in `assets/models/`
- **Fonts:** Inter family in `android/app/src/main/assets/fonts/`

## User preferences

- Everything must work 100% offline (no API, no internet, no cloud)
- Android only
- Preserve all existing UI — no redesigns
- Material Design aesthetic, light + dark theme support
- Package name: `com.cscsmarttoolkit.app`
