# CSC Smart Toolkit

A professional offline-first mobile toolkit built with React Native CLI + react-native-web.  
94+ tools — all on-device, no cloud, no internet required after setup.

## How to run (web preview)

```bash
cd Offline-Smart-Toolkit/artifacts/mobile && pnpm exec webpack serve --config webpack.config.js
```

The **Start application** workflow runs this automatically. App is served at port 5000.

## Stack

| Layer | Tech |
|---|---|
| UI framework | React Native CLI 0.81 + react-native-web |
| Bundler (web preview) | Webpack 5 |
| Navigation | React Navigation 7 (Stack) |
| AI inference | ONNX Runtime Web (WASM) + onnxruntime-react-native |
| AI post-processing | Pure TypeScript — zero native deps |
| Fonts | Inter (Google Fonts) |
| Icons | MaterialCommunityIcons via react-native-vector-icons |

## Project layout

```
Offline-Smart-Toolkit/         pnpm workspace root
├── artifacts/mobile/          React Native app (main app)
│   ├── App.tsx                Entry point
│   ├── navigation/            AppNavigator + routes
│   ├── app/                   Screen files (Expo-style flat layout)
│   ├── components/            Shared UI components
│   ├── lib/                   Business logic & services
│   │   ├── ai/                AI pipeline (ONNX, alphaMatte, BEN2…)
│   │   └── photoTools/        Photo tool utilities
│   └── public/                Static assets served by webpack
│       └── models/            ONNX model files (large — not bundled in APK)
└── artifacts/api-server/      Express API server (optional companion)
```

## Background Remover AI pipeline

The Background Remover Tool uses a professional multi-stage AI pipeline:

**Primary (high-end ≥6 GB RAM):** BiRefNet → BEN2 Hair Refinement → PyMatting Guided Filter → Alpha Matte  
**Mid-end (4–6 GB):** BiRefNet → PyMatting Guided Filter → Alpha Matte  
**Low-end (<4 GB):** RMBG-2.0 → U2Net fallback → Alpha Matte  

All pipeline stages:
1. EXIF orientation correction
2. Full-resolution image decode (Canvas API)
3. Image analysis & intelligent model routing (DeviceCapability + ImageRouter)
4. Low-light auto-enhancement on inference copy
5. Multi-model ONNX inference (BiRefNet → RMBG-2.0 → U2Net → IS-Net priority)
6. BEN2 boundary refinement (when available + device has ≥6 GB RAM)
7. Professional alpha matting — hole fill → SAM2 trimap → quad-pass guided filter → hair pass
8. Halo removal & color decontamination
9. Composite at original resolution → lossless PNG

**Model files required (downloaded once, stored offline forever):**
- `birefnet-q.onnx` — ~44 MB (BiRefNet quantized, primary)
- `u2netp.onnx` — ~4.4 MB (U2Net, compact fallback)
- `rmbg-2.0.onnx` — ~90 MB (optional, mid-quality fallback)
- `ben2.onnx` — ~180 MB (optional, hair refinement)
- `isnet-general.onnx` — ~176 MB (optional, complex scenes)

Models are downloaded via `ModelDownloadGate` with real-time progress, resume support, and integrity verification. On web: stored in IndexedDB. On native Android: stored in `expo-file-system` cache directory.

## Android build

Requires Android SDK + JDK. Not available in this Replit environment.
To build: `cd Offline-Smart-Toolkit/artifacts/mobile/android && ./gradlew assembleRelease`

## User preferences

- Preserve existing UI/UX when upgrading features — do not redesign screens.
- Keep APK size minimal — ONNX models are downloaded on-demand, never bundled.
- 100% offline operation after setup — no cloud, no API dependencies.
