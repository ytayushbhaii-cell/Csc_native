# CSC Smart Toolkit — Mobile App

## Overview
A 100% offline, Expo/React Native mobile application for CSC (Common Service Centre) operators, Cyber Cafes, and Photo Studios. All document processing runs on-device — no internet, no cloud, no API calls.

## How to Run (Web Preview)
```
cd Offline-Smart-Toolkit/artifacts/mobile && npx webpack serve --config webpack.config.js
```
The workflow "Start application" handles this. The app runs at http://localhost:5000 via react-native-web.

> **Note**: This project was migrated from Expo Router to React Native CLI + webpack (Phase 1).
> Navigation is handled by `navigation/AppNavigator.tsx` (React Navigation stack), with an
> expo-router shim in `shims/expo-router.tsx` so existing screen files need no changes.

## Workflow: Expo Prebuild (Bare Workflow) — Android

The project has been migrated to **Expo Prebuild / Bare Workflow**. The `android/` directory is now committed and owned by the project. Do NOT delete it.

### To rebuild native files after app.json plugin changes
```bash
cd Offline-Smart-Toolkit/artifacts/mobile
echo "y" | npx expo prebuild --platform android --clean --no-install
```

### To build APK with EAS (recommended — uses EAS cloud builders)
```bash
# Requires EXPO_TOKEN secret set in Replit Secrets, and an Expo account
# with the project configured (eas.json already configured)
cd Offline-Smart-Toolkit/artifacts/mobile
EXPO_TOKEN=$EXPO_TOKEN npx eas-cli build --platform android --profile preview --non-interactive
```
The `preview` profile builds a signed APK (internal distribution).  
AI models (BiRefNet ~44 MB, U2Net ~4.4 MB) are NOT bundled in the APK — they download from the internet on first use inside the app.

### To build AAB (production / Play Store)
```bash
eas build --platform android --profile production
```
> Requires: `eas-cli` installed (`npm i -g eas-cli`) and an Expo account logged in.
> Production builds use `buildType: "app-bundle"` (AAB) for Play Store.

### To run on a connected Android device (requires local Android SDK)
```bash
cd Offline-Smart-Toolkit/artifacts/mobile
pnpm android   # runs expo run:android
```

## Stack
- **Framework**: Expo SDK 54 + React Native 0.81 (web via Metro bundler)
- **Navigation**: Expo Router v6 (file-based routing)
- **PDF**: pdf-lib (offline PDF generation, merge, split, rotate, protect)
- **OCR**: tesseract.js v7 (web), architecture stub for native
- **PDF Rendering**: pdfjs-dist (web) for PDF → Image conversion
- **Image Processing**: expo-image-manipulator
- **State**: React Context (ThemeContext, AppContext, SettingsContext, DrawerContext)
- **Storage**: AsyncStorage for favorites/theme/settings/search-history/usage; expo-sqlite for tool history DB

## Part 10 — Search, History & Analytics Modules (added)
- **Search screen** (`app/(tabs)/search.tsx`) — full-page search across all tools/categories, persisted search history, instant results
- **History screen** (`app/(tabs)/history.tsx`) — processing history from SQLite (QR/Barcode/Signature/Stamp); web shows empty state with note
- **Most Used Tools screen** (`app/(tabs)/most-used.tsx`) — top-10 ranked tool usage with animated rank badges; reset option
- **SearchService** (`lib/features/search/SearchService.ts`) — AsyncStorage search history (max 12 items, deduped)
- **UsageService** (`lib/features/usage/UsageService.ts`) — tool usage counts via AsyncStorage; `recordToolUsage`, `getTopTools`
- **AppContext** — replaced DUMMY_RECENT with real AsyncStorage data; added `addRecentFile`, `recordUsage`, `topToolIds`
- **SearchModal** — now persists search history and records tool usage on selection
- **AppDrawer** — expanded with Search, Recent Files, Most Used, History nav items (with section dividers)

## Project Structure
```
Offline-Smart-Toolkit/
├── artifacts/
│   └── mobile/                     # Main Expo app
│       ├── app/
│       │   ├── (tabs)/             # Dashboard, Tools, Favorites, Recent, Settings
│       │   ├── document-tools/     # All 43 document & ID tools
│       │   │   ├── aadhaar/        # 11 tools
│       │   │   ├── pan/            # 5 tools
│       │   │   ├── voter/          # 4 tools
│       │   │   ├── driving-license/ # 4 tools
│       │   │   ├── passport/       # 4 tools
│       │   │   └── pdf/            # 15 tools
│       │   ├── photo-tools/        # Photo editing tools (24 tools)
│       │   └── id-card-tools/      # ID Card Generator (4 tools)
│       │       ├── index.tsx       # Hub — card type selector
│       │       ├── student.tsx     # Student ID (front + back, 5 templates)
│       │       ├── employee.tsx    # Employee ID (front + back)
│       │       ├── visitor.tsx     # Visitor Pass (single side)
│       │       └── custom.tsx      # Fully customisable card
│       ├── components/
│       │   ├── document-tools/     # DocUploadWidget, DocResultActions, PrintLayoutPicker
│       │   ├── photo-tools/        # ToolScreenLayout, StatusBanner, etc.
│       │   └── id-card/            # IDCardStudent, IDCardEmployee, IDCardVisitor, IDCardCustom, TemplateSelector, PhotoPicker
│       ├── lib/
│       │   ├── features/documents/ # All document services
│       │   │   ├── aadhaar/        # aadhaarService.ts
│       │   │   ├── pan/            # panService.ts
│       │   │   ├── voter/          # voterService.ts
│       │   │   ├── driving_license/ # dlService.ts
│       │   │   ├── passport/       # passportService.ts
│       │   │   ├── pdf/            # pdfService.ts, pdfToImageService.ts (.web.ts)
│       │   │   ├── ocr/            # ocrService.ts (tesseract.js v7 on web)
│       │   │   ├── printUtils.ts   # ID card sheet PDF generation
│       │   │   └── tools.ts        # All tool metadata registry
│       │   ├── features/id-card/   # ID Card module
│       │   │   ├── types.ts        # StudentIDData, EmployeeIDData, VisitorIDData, CustomIDData
│       │   │   ├── templates.ts    # 5 templates (Modern/Corporate/School/Minimal/Premium)
│       │   │   ├── tools.ts        # ID_CARD_TOOLS registry
│       │   │   ├── db.ts           # AsyncStorage CRUD for saved cards
│       │   │   └── ExportService.ts # PNG/JPG/PDF export (web + native)
│       │   └── ai/                 # TF.js, ONNX runtime, AI services
│       └── context/                # ThemeContext, AppContext, DrawerContext
├── lib/                            # Shared workspace libraries
│   ├── api-client-react/
│   ├── api-zod/
│   └── db/
└── pnpm-workspace.yaml
```

## Metro Config Notes
- `resolveRequest` override forces `pdf-lib` → CJS build to prevent tslib ESM crash
- `.web.ts` extensions used for browser-incompatible native modules
- `resolverMainFields: ['react-native', 'main', 'browser', 'module']`

## BiRefNet Background Removal Pipeline
The background remover uses BiRefNet ONNX (`public/models/birefnet-q.onnx`) with a full professional post-processing pipeline:

1. **Decode** — Canvas API for zero-quality-loss RGBA (supports JPG, PNG, JPEG, WebP)
2. **Resize** — Bilinear resize to 1024×1024 for model input
3. **Inference** — BiRefNet ONNX with ImageNet normalization (mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]); smart sigmoid detection handles logit outputs
4. **Upsample** — Bilinear upsample of alpha mask back to original resolution
5. **SAM2 refinement** — Trimap generation (erosion 1.5%, dilation 2.5%) + gradient-weighted boundary propagation (4 iterations)
6. **Quad-pass guided filter** — r=20→8→3→1 for global structure + hair strand detail
7. **Edge polish** — Adaptive feathering (≥3px) + sub-pixel anti-aliasing + S-curve (1.1)
8. **Halo removal** — Color decontamination (searchR=20, strength=0.92) + soft alpha erosion
9. **Composite** — Transparent PNG output at original resolution

Key files: `lib/ai/services/onnxBackend.ts`, `lib/ai/services/SegmentationService.ts`, `lib/ai/processors/`

## AI Model Status (Native Android)

| Model | Web (Expo Web) | Native Android |
|-------|---------------|----------------|
| BiRefNet (ONNX) | ✅ Full inference via onnxruntime-web | ⚠️ Falls back to TF.js BodyPix (CPU) |
| RMBG-2.0 (ONNX) | ✅ Full inference via onnxruntime-web | ⚠️ Falls back to TF.js BodyPix (CPU) |
| U2Net (ONNX) | ✅ Full inference via onnxruntime-web | ⚠️ Falls back to TF.js BodyPix (CPU) |

**Why**: `onnxruntime-web` uses WebAssembly (unsupported by Hermes JS engine on Android).
**Path to fix**: Replace `ortLoader.native.ts` stub with `onnxruntime-react-native` InferenceSession — infrastructure already wired in `ModelDownloadService.native.ts`.

## Key Packages (mobile)
- `pdf-lib` — PDF creation/manipulation (CJS build forced via metro config)
- `tesseract.js` — OCR (web only, dynamically imported)
- `pdfjs-dist` — PDF rendering to images (web only, legacy build)
- `@react-native-ml-kit/text-recognition` — Offline OCR on native Android (Google ML Kit, no API key)
- `react-native-pdf-thumbnail` — PDF page rendering to images on native Android (uses Android PdfRenderer)
- `expo-document-picker` — Pick PDF files
- `expo-clipboard` — Copy OCR text to clipboard
- `expo-image-manipulator` — Crop/resize/compress images

## Phase 4 — Document Tools, PDF Tools & OCR (completed)

### OCR System
- **Web**: Tesseract.js v7 (dynamic import) — `lib/features/documents/ocr/ocrService.ts`
- **Native Android**: Google ML Kit text recognition — `lib/features/documents/ocr/ocrService.native.ts`
  - Auto-downloaded ML Kit model, works 100% offline after first build
  - Supports Latin (English), Devanagari (Hindi), Chinese, Japanese, Korean

### PDF to Image
- **Web**: pdfjs-dist (canvas rendering) — `lib/features/documents/pdf/pdfToImageService.web.ts`
- **Native Android**: react-native-pdf-thumbnail (Android PdfRenderer) — `lib/features/documents/pdf/pdfToImageService.native.ts`
  - Metro platform extension selects correct implementation at build time

### PDF Tools Status
| Tool | Status | Notes |
|------|--------|-------|
| Merge PDF | ✅ | pdf-lib, web + native |
| Split PDF | ✅ | pdf-lib, web + native |
| Compress PDF | ✅ | pdf-lib, web + native |
| Rotate PDF | ✅ | pdf-lib, web + native |
| PDF to Image | ✅ | pdfjs (web) + pdf-thumbnail (native) |
| Image to PDF | ✅ | pdf-lib, web + native |
| PDF Preview | ✅ | New screen — renders pages as images |
| Offline OCR | ✅ | Tesseract (web) + ML Kit (native) |
| Search PDF | ✅ | OCR-based full-text search, native unlocked |
| Image to Text | ✅ | Tesseract (web) + ML Kit (native) |
| Document Scanner | ✅ | Camera capture → PDF |
| PDF Info | ✅ | Metadata viewer |
| Delete Pages | ✅ | pdf-lib |
| Extract Pages | ✅ | pdf-lib |
| Password Protect | ✅ | pdf-lib |
| Remove Password | ✅ | pdf-lib |
| Rearrange Pages | ✅ | pdf-lib |
| Multiple Image to PDF | ✅ | `pdf/from-image.tsx` multi-select |

### Document Tools Status
All Aadhaar, PAN, Voter ID, Driving License, Passport, Gov Docs, and CSC Utility hubs: ✅ Complete

## User Preferences
- 100% offline — no API, no cloud, no Firebase, no internet
- All processing on-device
- Support both web preview (Replit) and native (Android/iOS)
