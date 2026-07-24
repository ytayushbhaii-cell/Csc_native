---
name: Android build environment
description: Android Gradle verification requires an Android SDK in addition to Java.
---

The workspace can resolve and compile the React Native Gradle plugins with JDK 17, but the container may not include an Android SDK or `ANDROID_HOME`; Gradle then stops before app Kotlin compilation with “SDK location not found.” React Native 0.81's published Gradle plugin currently requires AGP 8.11 and Gradle 8.13; pnpm workspaces may require an explicit absolute `includeBuild` path for plugin discovery.

**Why:** Verification reached Gradle configuration successfully, but the missing SDK prevented the final Android compile in this environment. The older Gradle 8.10.2 wrapper also failed once the RN plugin loaded because AGP required at least 8.13.

**How to apply:** Check `ANDROID_HOME`/`ANDROID_SDK_ROOT` and `sdk.dir` before diagnosing native source errors; use an Android-equipped environment for the final compile and emulator/device validation. Keep npm/Codemagic paths and pnpm workspace fallbacks separate in Gradle scripts.