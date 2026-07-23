# CSC Smart Toolkit — Offline-Smart-Toolkit

## Project Overview

A React Native offline toolkit app ("CSC Smart Toolkit") with 94+ tools for photo editing, document processing, QR codes, signatures, ID cards, and more. The app runs on Android natively and in the browser via react-native-web + webpack.

## Stack

- **Mobile**: React Native CLI (0.81.5) + React 19
- **Web preview**: react-native-web + webpack 5 (`webpack serve`)
- **AI / ML**: ONNX Runtime Web (`onnxruntime-web`) for background removal models
- **Package manager**: pnpm workspaces (`Offline-Smart-Toolkit/`)
- **Navigation**: React Navigation v7 (Stack)

## How to run

```bash
# Install dependencies (pnpm workspace root)
cd Offline-Smart-Toolkit && pnpm install

# Start the webpack dev server (web preview)
cd Offline-Smart-Toolkit/artifacts/mobile && pnpm exec webpack serve --config webpack.config.js
```

The dev server listens on port 5000.

## Background Remover AI Pipeline

The Background Remove tool (`app/photo-tools/background-remove.tsx`) uses a multi-model ONNX pipeline:

**High-end devices (≥6 GB RAM):**
BiRefNet → BEN2 Hair Refinement → PyMatting Quad-pass Guided Filter → Alpha Matte Refinement

**Mid-range devices (≥4 GB RAM):**
BiRefNet → PyMatting Guided Filter → Alpha Matte Refinement

**Low-end devices (<4 GB RAM):**
U2Net-Portrait → PyMatting Guided Filter → Alpha Matte Refinement

**Fallback (RMBG-2.0):** Used when BiRefNet unavailable or device has insufficient RAM.

### Key AI files
- `lib/ai/services/SegmentationService.ts` — main pipeline orchestration
- `lib/ai/services/onnxBackend.ts` — ONNX model loading + inference
- `lib/ai/services/BEN2Backend.ts` — BEN2 hair refinement pass
- `lib/ai/services/ImageRouter.ts` — device-aware model routing
- `lib/ai/services/DeviceCapability.ts` — RAM/GPU/SIMD detection
- `lib/ai/processors/alphaMatte.ts` — PyMatting-equivalent guided filter + post-processing
- `lib/ai/processors/guidedFilter.ts` — Quad-pass guided filter (PyMatting equivalent)
- `lib/ai/ModelRegistry.ts` — model status registry

### Model download system
- `lib/ai/services/ModelDownloadService.web.ts` — IndexedDB storage (web)
- `lib/ai/services/ModelDownloadService.native.ts` — expo-file-system storage (Android)
- `components/photo-tools/ModelDownloadGate.tsx` — download UI with %, speed, ETA, retry

### Post-processing (all platforms)
- Alpha matte hole fill → SAM2-style trimap → Quad-pass guided filter → Hair refinement pass → Edge feathering → Halo removal

### Export formats
- Transparent PNG (default), JPG (white background), WEBP
- Custom background color (hex input)
- High-resolution export preserving original image dimensions

## User Preferences

- Preserve existing UI/UX — do not redesign screens, change colors, icons, layouts, or animations.
- Upgrade AI engines and add functional features only.
- Zero critical errors required before shipping.
- 100% offline after AI model download.
