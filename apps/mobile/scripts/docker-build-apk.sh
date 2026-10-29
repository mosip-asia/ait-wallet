#!/usr/bin/env bash
# ==============================================================================
# Headless Docker Build Script for AIT Inji Mobile Wallet (Android APK)
# ==============================================================================
# This script compiles the Android debug APK inside an isolated Docker container
# equipped with OpenJDK 17, Node.js 20, Android SDK 34-36, NDK 27, and Gradle.
# No Android SDK or Java installation is required on your host machine.
# ==============================================================================
set -euo pipefail

# Ensure working directory is apps/mobile
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$APP_DIR"

# 1. Ensure environment file exists
if [ ! -f .env ]; then
  echo "📄 Creating .env from .env.example..."
  cp .env.example .env
fi

echo "=========================================================="
echo "🚀 Building AIT Inji Mobile Wallet APK (Headless Docker)"
echo "=========================================================="

# 2. Build or start the containerized Android APK builder
# If user passed custom gradle arguments (e.g. assembleResidentappRelease), forward them
if [ "$#" -gt 0 ]; then
  echo "🔧 Custom Gradle target requested: $*"
  docker compose -f docker-compose.android.yml run --rm android-builder \
    bash -c "npm install && cd android && ./gradlew $*"
else
  echo "🔨 Compiling Residentapp Debug APK..."
  docker compose -f docker-compose.android.yml run --rm android-builder
fi

# 3. Verify output APK artifact
APK_DIR="android/app/build/outputs/apk/residentapp/debug"
APK_PATH=""

if [ -f "$APK_DIR/Inji_universal.apk" ]; then
  APK_PATH="$APK_DIR/Inji_universal.apk"
elif compgen -G "$APK_DIR/*.apk" > /dev/null; then
  APK_PATH="$(ls -1 "$APK_DIR"/*.apk | head -n 1)"
fi

if [ -n "$APK_PATH" ] && [ -f "$APK_PATH" ]; then
  APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
  echo ""
  echo "=========================================================="
  echo "✅ APK Build Succeeded!"
  echo "📦 Location : apps/mobile/$APK_PATH"
  echo "📏 Size     : $APK_SIZE"
  echo "=========================================================="
  echo ""
  echo "📱 Next Steps to Run on Your Host Android Emulator:"
  echo ""

  # Check if adb is installed on host
  if command -v adb >/dev/null 2>&1; then
    # Check if an emulator/device is currently online
    CONNECTED_DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" || true)

    if [ -n "$CONNECTED_DEVICES" ]; then
      echo "  🟢 Connected emulator/device detected via adb!"
      echo ""
      echo "  Run these commands to install and start live dev:"
      echo ""
      echo "  1. Forward ports so the emulator connects to host Docker services:"
      echo "     adb reverse tcp:8081 tcp:8081   # Metro bundler"
      echo "     adb reverse tcp:8099 tcp:8099   # Inji Mimoto BFF"
      echo "     adb reverse tcp:8443 tcp:8443   # Local Mock Issuer"
      echo "     adb reverse tcp:443 tcp:8443    # Local Mock Issuer did:web resolution"
      echo ""
      echo "  2. (Optional: Local Mock Issuer) Push local CA certificate:"
      echo "     adb push ../../tools/local-issuer/state/ca.der /sdcard/Download/"
      echo "     # In Android Emulator: Settings -> Security -> More Security Settings -> Encryption & Credentials -> Install a certificate -> CA certificate"
      echo ""
      echo "  3. Install the APK:"
      echo "     adb install -r $APK_PATH"
      echo ""
      echo "  4. Start Metro bundler container for live code updates:"
      echo "     npm run docker:metro"
    else
      echo "  🟡 No running emulator detected. Start your Android Emulator, then run:"
      echo "     adb reverse tcp:8081 tcp:8081"
      echo "     adb reverse tcp:8099 tcp:8099"
      echo "     adb reverse tcp:8443 tcp:8443"
      echo "     adb install -r $APK_PATH"
      echo "     npm run docker:metro"
    fi
  else
    echo "  1. Start your local Android Emulator."
    echo "  2. Reverse ports:  adb reverse tcp:8081 tcp:8081 && adb reverse tcp:8099 tcp:8099 && adb reverse tcp:8443 tcp:8443"
    echo "  3. Install APK:    adb install -r $APK_PATH"
    echo "  4. Start Metro:    npm run docker:metro"
  fi
  echo ""
else
  echo ""
  echo "❌ Build completed, but output APK was not found at $APK_PATH"
  exit 1
fi

