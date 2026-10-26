# AIT Mobile Wallet (`apps/mobile`)

The mobile client of the AIT Wallet for **iOS** and **Android**, built upon the [MOSIP Inji Wallet framework](https://github.com/mosip/inji-wallet) (React Native).

---

## 📱 Overview

The mobile wallet is the primary touchpoint for AIT students, faculty, and staff. It securely manages:
- **Keys & Cryptography**: Native Hardware Keystore (Android KeyStore / iOS Secure Enclave).
- **Credential Storage**: Encrypted local database (SQLCipher / MMKV).
- **Credential Issuance**: OIDC4VCI protocol connecting to AIT Inji Certify.
- **Proximity Sharing**: Offline Verifiable Presentation via BLE (Tuvali) and dynamic offline/online QR codes.
- **Online Verification**: OIDC4VP protocol via web/app redirect or camera scan.

---

## 🛠️ Prerequisites

Before developing the mobile wallet, ensure your development workstation meets these requirements:

### General
- **Node.js**: `v18.x` or `v20.x` LTS
- **Package Manager**: `npm` or `yarn`
- **Watchman**: Recommended for macOS (`brew install watchman`)

### iOS Development (macOS only)
- **Xcode**: 15.0+
- **CocoaPods**: `sudo gem install cocoapods` or `brew install cocoapods`
- Apple Developer Account (for device testing and distribution)

### Android Development
- **Android Studio**: Iguana / Jellyfish or latest
- **JDK**: Java 17 (Eclipse Temurin / OpenJDK 17)
- **Android SDK**: API level 33 & 34 with Android NDK installed

---

## ⚙️ Configuration & Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Configure the server endpoints:
   - `MIMOTO_HOST`: Mimoto backend service URL (default `http://localhost:8099`).
   - `CERTIFY_BASE_URL`: Inji Certify issuance URL.
   - `IDP_AUTH_URL`: Keycloak or university authentication endpoint.

---

## 🚀 Running the App: 2 Development Methods

### 📦 Method 1: Local Installation (Native Host)
Use this method if you have Node.js, JDK 17, and Android Studio or Xcode installed on your host:

```bash
# 1. Install dependencies
npm install

# 2. For iOS: CocoaPods installation (macOS only)
cd ios && pod install && cd ..

# 3. Start Metro bundler in one terminal
npm start

# 4. Launch on Android emulator or connected device (in another terminal)
npm run android:mosip

# 5. Launch on iOS simulator (macOS only)
npm run ios
```

---

### 🐳 Method 2: Dockerized Development (Headless Container)
Use this method to develop on Android **without installing Node.js, Java, or Android SDK on your host**. Only your local Android Emulator and `adb` run on the host:

```bash
# 1. Compile the APK inside Docker
npm run docker:build:android
# (Or: ./scripts/docker-build-apk.sh)

# 2. Forward ports on host to your local Android Emulator
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8099 tcp:8099
adb reverse tcp:8443 tcp:8443

# 3. Install the APK to the running host emulator
adb install -r android/app/build/outputs/apk/residentapp/debug/Inji_universal.apk

# 4. Start Dockerized Metro bundler for live code updates
npm run docker:metro
```

---

## 📦 Inji Mobile Architecture Alignment

When adopting or customizing Inji Mobile:
- **`src/screens/`**: Custom AIT-branded screens (Onboarding, Home, Wallet Card List, QR Scanner, Settings).
- **`src/components/`**: Reusable atomic UI elements compliant with AIT Branding (`packages/branding`).
- **`src/services/`**: Integration with Mimoto, Inji Certify, biometric authentication, and BLE (Tuvali).
- **`src/types/`**: TypeScript typings for standard claims (National ID and University Transcript).

---

## 🔄 Transition Strategy (Inji Mobile vs Alternative)

As specified in project directives:
1. We **start with the Inji mobile framework**.
2. If dependencies, native module conflicts, or campus ecosystem mismatches arise, we evaluate alternatives (e.g. Flutter or clean React Native OpenID4VC SDK) while preserving the global standard definitions and use case specifications in this repository.
