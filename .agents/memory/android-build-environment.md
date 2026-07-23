---
name: Android build environment
description: Android Gradle verification requires an Android SDK in addition to Java.
---

The workspace can resolve and compile the React Native Gradle plugins with JDK 17, but the container may not include an Android SDK or `ANDROID_HOME`; Gradle then stops before app Kotlin compilation with “SDK location not found.”

**Why:** Phase 6 verification reached Gradle configuration successfully, but the missing SDK prevented the final Android compile in this environment.

**How to apply:** Check `ANDROID_HOME`/`ANDROID_SDK_ROOT` and `sdk.dir` before diagnosing native source errors; use an Android-equipped environment for the final compile and emulator/device validation.