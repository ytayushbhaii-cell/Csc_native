---
name: React Native slider Android compatibility
description: Legacy slider releases request the removed react-native Maven artifact on modern React Native.
---

React Native 0.81 publishes its Android runtime as `com.facebook.react:react-android`, while some `@react-native-community/slider` 5.x Android scripts still request `com.facebook.react:react-native:+`. Resolve that legacy coordinate to the pinned `react-android` version at the root Gradle level rather than editing `node_modules`.

**Why:** The slider is correctly autolinked, but its old Maven coordinate can stop release dependency resolution before app compilation.

**How to apply:** Keep the substitution in the root Android build and pass the React Native version explicitly from CI so APK and AAB builds resolve the same runtime.