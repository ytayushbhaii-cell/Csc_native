#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  CSC Smart Toolkit — Android Build Script
#  Phase 8: Production APK & AAB builder
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="$SCRIPT_DIR/android"

# ── Colour helpers ─────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Check prerequisites ────────────────────────────────────────────────────
info "Checking prerequisites…"

command -v java   >/dev/null 2>&1 || error "Java not found. Install JDK 17."
command -v node   >/dev/null 2>&1 || error "Node.js not found."
command -v pnpm   >/dev/null 2>&1 || error "pnpm not found. Run: npm install -g pnpm"

JAVA_VER=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
[[ "$JAVA_VER" -ge 17 ]] || error "Java 17+ required (found $JAVA_VER)."
success "Java $JAVA_VER"

ANDROID_SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
[[ -n "$ANDROID_SDK" ]] || error "Android SDK is not set. Set ANDROID_HOME or ANDROID_SDK_ROOT."
[[ -d "$ANDROID_SDK" ]]  || error "Android SDK=$ANDROID_SDK does not exist."
success "Android SDK: $ANDROID_SDK"

# ── Create local.properties if missing ────────────────────────────────────
if [[ ! -f "$ANDROID_DIR/local.properties" ]]; then
    info "Creating android/local.properties…"
    echo "sdk.dir=$ANDROID_SDK" > "$ANDROID_DIR/local.properties"
    success "local.properties created"
fi

# ── Install JS dependencies ────────────────────────────────────────────────
info "Installing JS dependencies (pnpm)…"
cd "$SCRIPT_DIR"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
success "Dependencies installed"

# ── Parse arguments ────────────────────────────────────────────────────────
BUILD_TYPE="${1:-all}"   # debug | release | bundle | all
CLEAN="${2:-false}"

if [[ "$CLEAN" == "clean" ]]; then
    info "Cleaning build artifacts…"
    cd "$ANDROID_DIR" && ./gradlew clean
    success "Clean done"
fi

cd "$ANDROID_DIR"

# ── Build functions ────────────────────────────────────────────────────────
build_debug_apk() {
    info "Building Debug APK…"
    ./gradlew assembleDebug --stacktrace 2>&1 | tail -20
    APK_PATH="app/build/outputs/apk/debug/app-arm64-v8a-debug.apk"
    [[ -f "$APK_PATH" ]] || APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    success "Debug APK: android/$APK_PATH"
    echo "  Size: $(du -sh "$APK_PATH" 2>/dev/null | cut -f1)"
}

build_release_apk() {
    [[ -f "key.properties" ]] || warn "key.properties not found — using debug keystore for release (NOT for production upload)."
    info "Building Release APK…"
    ./gradlew assembleRelease --stacktrace 2>&1 | tail -20
    APK_PATH="app/build/outputs/apk/release/app-arm64-v8a-release.apk"
    [[ -f "$APK_PATH" ]] || APK_PATH="app/build/outputs/apk/release/app-release.apk"
    success "Release APK: android/$APK_PATH"
    echo "  Size: $(du -sh "$APK_PATH" 2>/dev/null | cut -f1)"
}

build_release_aab() {
    [[ -f "key.properties" ]] || warn "key.properties not found — using debug keystore for release AAB (NOT for Play Store upload)."
    info "Building Release AAB (Android App Bundle)…"
    ./gradlew bundleRelease --stacktrace 2>&1 | tail -20
    AAB_PATH="app/build/outputs/bundle/release/app-release.aab"
    success "Release AAB: android/$AAB_PATH"
    echo "  Size: $(du -sh "$AAB_PATH" 2>/dev/null | cut -f1)"
    echo ""
    success "✅ Play Store upload ready: android/$AAB_PATH"
}

# ── Execute builds ─────────────────────────────────────────────────────────
case "$BUILD_TYPE" in
    debug)   build_debug_apk ;;
    release) build_release_apk ;;
    bundle)  build_release_aab ;;
    all)
        build_debug_apk
        build_release_apk
        build_release_aab
        ;;
    *)
        echo "Usage: $0 [debug|release|bundle|all] [clean]"
        echo "  debug   — debug APK only"
        echo "  release — release APK only"
        echo "  bundle  — release AAB only (Play Store)"
        echo "  all     — all three (default)"
        echo ""
        echo "Add 'clean' as second argument to run Gradle clean first."
        exit 1
        ;;
esac

echo ""
success "Phase 8 build complete 🎉"
