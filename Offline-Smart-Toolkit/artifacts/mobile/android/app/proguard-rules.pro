# ═══════════════════════════════════════════════════════════════════════════════
#  CSC Smart Toolkit — ProGuard / R8 rules
#  minifyEnabled=false in release builds, so these rules run only if you
#  enable minification in the future. Kept comprehensive for safety.
# ═══════════════════════════════════════════════════════════════════════════════

# ─── React Native core ────────────────────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.**

# ─── React Native @ReactMethod annotations (JNI reflection) ──────────────────
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
}
-keepclassmembers class * extends com.facebook.react.bridge.ReactContextBaseJavaModule {
    *;
}

# ─── Hermes ──────────────────────────────────────────────────────────────────
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.hermes.intl.** { *; }

# ─── React Native Reanimated ─────────────────────────────────────────────────
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-dontwarn com.swmansion.**

# ─── React Native Screens ────────────────────────────────────────────────────
-keep class com.swmansion.rnscreens.** { *; }

# ─── React Native Safe Area Context ──────────────────────────────────────────
-keep class com.th3rdwave.safeareacontext.** { *; }

# ─── React Native Vision Camera ──────────────────────────────────────────────
-keep class com.mrousavy.camera.** { *; }
-dontwarn com.mrousavy.camera.**

# ─── React Native Document Picker ────────────────────────────────────────────
-keep class io.github.elyx0.reactnativedocumentpicker.** { *; }

# ─── React Native Image Picker ───────────────────────────────────────────────
-keep class com.imagepicker.** { *; }

# ─── React Native Image Resizer ──────────────────────────────────────────────
-keep class com.zoontek.rnimageresizer.** { *; }
-dontwarn com.zoontek.rnimageresizer.**

# ─── React Native Image Editor ───────────────────────────────────────────────
-keep class com.reactnativecommunity.imageeditor.** { *; }
-dontwarn com.reactnativecommunity.imageeditor.**

# ─── React Native PDF Thumbnail ──────────────────────────────────────────────
-keep class com.reactnativepdfpreview.** { *; }
-keep class com.reactnativepdfthumbnail.** { *; }
-dontwarn com.reactnativepdfpreview.**
-dontwarn com.reactnativepdfthumbnail.**

# ─── React Native FS (filesystem) ────────────────────────────────────────────
-keep class com.rnfs.** { *; }

# ─── React Native Share ──────────────────────────────────────────────────────
-keep class cl.json.RNShare.** { *; }
-keep class cl.json.** { *; }

# ─── React Native View Shot ──────────────────────────────────────────────────
-keep class fr.greweb.reactnativeviewshot.** { *; }

# ─── React Native Linear Gradient ────────────────────────────────────────────
-keep class com.BV.LinearGradient.** { *; }

# ─── React Native SVG ────────────────────────────────────────────────────────
-keep class com.horcrux.svg.** { *; }

# ─── React Native Clipboard ──────────────────────────────────────────────────
-keep class com.reactnativecommunity.clipboard.** { *; }

# ─── React Native Haptic Feedback ────────────────────────────────────────────
-keep class com.mkuczera.** { *; }

# ─── React Native Permissions ────────────────────────────────────────────────
-keep class com.zoontek.rnpermissions.** { *; }

# ─── React Native Splash Screen ──────────────────────────────────────────────
-keep class org.devio.rn.splashscreen.** { *; }

# ─── React Native Keyboard Controller ────────────────────────────────────────
-keep class com.reactnativekeyboardcontroller.** { *; }

# ─── React Native Camera Roll ────────────────────────────────────────────────
-keep class com.reactnativecommunity.cameraroll.** { *; }

# ─── React Native Blur ───────────────────────────────────────────────────────
-keep class com.cmcewen.blurview.** { *; }
-dontwarn com.cmcewen.blurview.**

# ─── React Native QR Code SVG ────────────────────────────────────────────────
-keep class com.qrcode.** { *; }
-dontwarn com.qrcode.**

# ─── React Native Slider ─────────────────────────────────────────────────────
-keep class com.reactnativecommunity.slider.** { *; }
-dontwarn com.reactnativecommunity.slider.**

# ─── ONNX Runtime ─────────────────────────────────────────────────────────────
-keep class ai.onnxruntime.** { *; }
-keepclassmembers class ai.onnxruntime.** { *; }
-keepclasseswithmembernames class ai.onnxruntime.** { native <methods>; }
-dontwarn ai.onnxruntime.**

# ─── TensorFlow.js (native CPU backend) ──────────────────────────────────────
-keep class org.tensorflow.** { *; }
-keepclasseswithmembernames class org.tensorflow.** { native <methods>; }
-dontwarn org.tensorflow.**

# ─── ML Kit (text recognition) ───────────────────────────────────────────────
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.mlkit_vision_** { *; }
-dontwarn com.google.mlkit.**

# ─── CSC Smart Toolkit custom native modules ──────────────────────────────────
-keep class com.cscsmarttoolkit.app.** { *; }

# ─── AsyncStorage ────────────────────────────────────────────────────────────
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# ─── React Navigation ────────────────────────────────────────────────────────
-keep class com.reactnavigation.** { *; }

# ─── OkHttp / networking ─────────────────────────────────────────────────────
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ─── Kotlin ──────────────────────────────────────────────────────────────────
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# ─── Coroutines ──────────────────────────────────────────────────────────────
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-dontwarn kotlinx.coroutines.**

# ─── AndroidX ────────────────────────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ─── General Java / Android ──────────────────────────────────────────────────
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ─── Remove debug logging in release ─────────────────────────────────────────
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}
