---
name: Phase 6 device validation
description: Native Phase 6 storage and raster behavior still requires Android hardware validation.
---

Native public-folder export behavior cannot be proven by the web workflow alone. Android 13+ permission results, scoped-storage behavior, system sharing, and actual print raster output must be tested on an emulator or physical device before claiming production-ready native parity.

**Why:** The imported project’s Android Gradle setup could not reach compilation in this environment, and React Native has no Canvas API for the native print raster path.

**How to apply:** Treat the web bundle and TypeScript checks as regression coverage, but keep Android permission/storage/share and native PNG/JPG/WEBP acceptance as explicit device-test work.