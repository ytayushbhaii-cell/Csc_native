# CSC Smart Toolkit — Mobile App

## Overview
A 100% offline React Native CLI mobile application for CSC (Common Service Centre) operators, Cyber Cafes, and Photo Studios. All document processing runs on-device — no internet, no cloud, no API calls.

## How to Run (Web Preview)
```
cd Offline-Smart-Toolkit/artifacts/mobile && pnpm exec webpack serve --config webpack.config.js
```
The workflow "Start application" handles this. The app runs at http://localhost:5000 via react-native-web.

> **Note**: This project was migrated from Expo Router to React Native CLI + webpack (Phase 1).
> Navigation is handled by `navigation/AppNavigator.tsx` (React Navigation stack).
> Local compatibility adapters in `shims/` keep the existing screen imports and UI
> unchanged while routing all runtime work through React Native CLI modules.

---

## Phase 8 — Android Build & Play Store Release

### Prerequisites (on your local machine / CI)
| Tool | Version | How to install |
|------|---------|----------------|
| JDK | 17+ | `brew install --cask temurin` / Android Studio bundled JDK |
| Android SDK | API 36 | Android Studio → SDK Manager |
| Build Tools | 36.0.0 | Android Studio → SDK Manager |
| NDK | 27.1.12297006 | Android Studio → SDK Manager → NDK (Side by side) |
| pnpm | latest | `npm i -g pnpm` |

### Quick Build
```bash
# Install JS dependencies first
cd Offline-Smart-Toolkit/artifacts/mobile
pnpm install

# Build Debug APK + Release APK + Play Store AAB
./build-android.sh all

# Or individually:
./build-android.sh debug    # Debug APK
./build-android.sh release  # Release APK
./build-android.sh bundle   # Release AAB (Play Store upload)
./build-android.sh all clean  # Clean then build all
```

### Manual Gradle commands
```bash
cd Offline-Smart-Toolkit/artifacts/mobile/android

# Debug APK
./gradlew assembleDebug
# → app/build/outputs/apk/debug/app-arm64-v8a-debug.apk

# Release APK
./gradlew assembleRelease
# → app/build/outputs/apk/release/app-arm64-v8a-release.apk

# Play Store AAB
./gradlew bundleRelease
# → app/build/outputs/bundle/release/app-release.aab
```

### Release Signing Setup
The release keystore is already generated: `android/app/release.keystore`
Signing credentials are in: `android/key.properties`

> ⚠️ **IMPORTANT — Security**:
> - `key.properties` and `release.keystore` are in `.gitignore` — do NOT commit them.
> - Back up `release.keystore` securely. Losing it means you cannot update your Play Store app.
> - Current keystore alias: `csc-smart-toolkit` | Validity: 10,000 days

### local.properties (required for builds)
```bash
# Create android/local.properties pointing to your Android SDK:
echo "sdk.dir=$ANDROID_HOME" > Offline-Smart-Toolkit/artifacts/mobile/android/local.properties

# Or copy the template and edit:
cp Offline-Smart-Toolkit/artifacts/mobile/android/local.properties.template \
   Offline-Smart-Toolkit/artifacts/mobile/android/local.properties
```

### Android Configuration Summary
| Setting | Value |
|---------|-------|
| applicationId | `com.cscsmarttoolkit.app` |
| compileSdk | 36 (Android 16) |
| targetSdk | 36 |
| minSdk | 24 (Android 7.0, covers 99%+ devices) |
| versionCode | 8 |
| versionName | 8.0.0 |
| Architecture | arm64-v8a |
| JS engine | Hermes |
| New Architecture | disabled |
| Kotlin | 2.1.20 |
| Gradle | 8.14.3 |
| AGP | 8.11.0 |

### Play Store Checklist
- [x] Release keystore generated (`release.keystore`)
- [x] Separate debug / release signing configs
- [x] Release build does NOT use debug keystore
- [x] `minSdk 24` — covers Android 7.0+
- [x] `targetSdk 36` — Android 16 compliant
- [x] Scoped media permissions (READ_MEDIA_IMAGES/VIDEO — API 33+)
- [x] `READ_MEDIA_VISUAL_USER_SELECTED` for API 34+ partial access
- [x] Legacy storage permissions with `maxSdkVersion` caps
- [x] `allowBackup="false"` (Play Store recommends for sensitive apps)
- [x] FileProvider configured for file sharing intents
- [x] `hardwareAccelerated="true"` + `largeHeap="true"` for AI workloads
- [x] ProGuard rules for ONNX Runtime, TF.js, Reanimated, ML Kit
- [x] ABI splits (arm64-v8a only for Play Store)
- [x] `versionCode` incremented to 8 for Phase 8

### Android React Native CLI

The committed `android/` directory is a standard React Native CLI project. Do NOT
delete or regenerate it with Expo tooling.

### To run on a connected Android device (requires local Android SDK)
```bash
cd Offline-Smart-Toolkit/artifacts/mobile
pnpm android
```

## Stack
- **Framework**: React Native CLI 0.81 (web via webpack/react-native-web)
- **Navigation**: React Navigation v7 (flat stack)
- **PDF**: pdf-lib (offline PDF generation, merge, split, rotate, protect)
- **OCR**: tesseract.js v7 (web), Google ML Kit (native Android)
- **PDF Rendering**: pdfjs-dist (web) for PDF → Image conversion
- **Image Processing**: React Native image editor/resizer adapters
- **State**: React Context (ThemeContext, AppContext, SettingsContext, DrawerContext)
- **Storage**: AsyncStorage and the native Phase 6 SQLite bridge

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
│   └── mobile/                     # Main React Native CLI app
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

| Model | Web (react-native-web) | Native Android |
|-------|---------------|----------------|
| BiRefNet (ONNX) | ✅ Full inference via onnxruntime-web | ⚠️ Falls back to TF.js BodyPix (CPU) |
| RMBG-2.0 (ONNX) | ✅ Full inference via onnxruntime-web | ⚠️ Falls back to TF.js BodyPix (CPU) |
| U2Net (ONNX) | ✅ Full inference via onnxruntime-web | ⚠️ Falls back to TF.js BodyPix (CPU) |

**Why**: the web and native ONNX runtimes use different platform adapters. Native
model execution is routed through `onnxruntime-react-native`; web uses the
WASM-compatible adapter.

## Key Packages (mobile)
- `pdf-lib` — PDF creation/manipulation (CJS build forced via metro config)
- `tesseract.js` — OCR (web only, dynamically imported)
- `pdfjs-dist` — PDF rendering to images (web only, legacy build)
- `@react-native-ml-kit/text-recognition` — Offline OCR on native Android (Google ML Kit, no API key)
- `react-native-pdf-thumbnail` — PDF page rendering to images on native Android (uses Android PdfRenderer)
- `react-native-document-picker` — Pick PDF files
- `@react-native-clipboard/clipboard` — Copy OCR text to clipboard
- `@react-native-community/image-editor` + `react-native-image-resizer` — Crop/resize/compress images

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
