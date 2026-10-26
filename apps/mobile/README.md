# AIT Mobile Wallet (`apps/mobile`)

The mobile client of the AIT Wallet for **iOS** and **Android**, built upon the [MOSIP Inji Wallet framework](https://github.com/mosip/inji-wallet) (React Native).

---

## 📱 Overview

The mobile wallet is the primary touchpoint for AIT students, faculty, and staff. It securely manages:
- **Keys & Cryptography**: Native Hardware Keystore (Android KeyStore / iOS Secure Enclave).
- **Credential Storage**: Encrypted local database (SQLCipher / MMKV).
- **Credential Issuance**: OIDC4VCI protocol connecting to Inji Certify or local mock issuer via BFF.
- **Proximity Sharing**: Offline Verifiable Presentation via BLE (Tuvali) and dynamic offline/online QR codes.
- **Online Verification**: OIDC4VP protocol via web/app redirect or camera scan.

For upstream MOSIP Inji documentation, refer [here](https://docs.mosip.io/inji/inji-wallet/overview).

## Setup PreRequisites

Be sure to have the following build tools installed before proceeding:

- [React Native 0.74.5](https://reactnative.dev/docs/0.74/getting-started)
  - Hermes Engine enabled
- [Expo 51.0.0](https://docs.expo.dev/get-started/installation/)
- [node v18.17.1](https://nodejs.org/en/blog/release/v18.17.1)
- [npm 8.19.3](https://www.npmjs.com/package/npm/v/8.19.3)

### Android

- [Java 17](https://openjdk.org/projects/jdk/17/)
- [Gradle 8.6](https://gradle.org/install/)
- [Android SDK](https://developer.android.com/). Make sure to install Android SDK Build-Tools - `35.0.0` from SDK Manager.
- minSdkVersion = 24
- compileSdkVersion = 35
- targetSdkVersion = 35
- ndkVersion = 21.4.7075529
- kotlinVersion = 1.9.22

### iOS

- [XCode](https://developer.apple.com/xcode/) = >15
- Minimum Deployment Target = 14.0
- cocoapods > 1.12
- Ruby >= 2.6.10

## Configuring the Environment

If you ever want to use something in your local environment based on your customization and in need of using environment files other than default (.env), you can add some variables to your .env.local file.
Create a `.env.local` file using `.env` as your template in your root directory :

```
# Mimoto Server
MIMOTO_HOST =  https://api.collab.mosip.net/

# ESignet Server
ESIGNET_HOST =  https://esignet.collab.mosip.net/

# Telemetry Server
OBSRV_HOST = https://dataset-api.obsrv.mosip.net
Telemetry Dashboard = https://druid.obsrv.mosip.net/unified-console.html#workbench

#Application Theme can be ( gradient | purple ), defaults to gradient theme
APPLICATION_THEME=grdaient

#environment can be changed if it is toggled
CREDENTIAL_REGISTRY_EDIT=true

#Inji Wallet CLIENT ID for Data backup & Restore
GOOGLE_ANDROID_CLIENT_ID='<client_id>'
```

for more information on the backend services
refer [here](https://docs.mosip.io/inji/inji-wallet/technical-overview/backend-services).

## Building & Running the App: 2 Development Methods

### 📦 Method 1: Local Installation (Native Host)

1. **Prerequisites**: Node.js 20 LTS, JDK 17, and Android Studio (API 34/35/36, NDK 27). On Ubuntu/Debian: `sudo apt update && sudo apt install -y bzip2 build-essential`.
2. **Install & Run**:
   ```bash
   npm install
   npm start
   # In another terminal:
   npm run android:mosip   # Android
   npm run ios             # iOS (macOS only)
   ```

---

### 🐳 Method 2: Dockerized Development (Headless Container)

Use this method to develop on Android **without installing Node.js, Java, or Android SDK on your host**. Only your local Android Emulator and `adb` run on the host:

```bash
# 1. Compile the APK inside Docker container
npm run docker:build:android
# (Or run: ./scripts/docker-build-apk.sh)

# 2. Forward ports on host to your local Android Emulator
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8099 tcp:8099
adb reverse tcp:8443 tcp:8443

# 3. Install the APK onto your running local emulator
adb install -r android/app/build/outputs/apk/residentapp/debug/Inji_universal.apk

# 4. Start the Dockerized Metro bundler for live Fast Refresh / code updates
npm run docker:metro
```

---

## Building & Running for Android (Additional Info)

Refer to the documentation of Inji Wallet's [build and deployment android section](https://docs.mosip.io/inji/inji-wallet/build-and-deployment#android-build-and-run) for the steps build the android application.

Note: Alternative to building and running app via react native CLI, it can be built via Android Studio. The app is available in this repository's `./android` directory. Open this directory in Android Studio (version  
4.1 and above) and the app can be built and run from there.

More info here:

- [Build your app using Android Studio](https://developer.android.com/studio/run)

## Building & Running for iOS

Refer to the documentation of Inji Wallet's [build and deployment iOS section](https://docs.mosip.io/inji/inji-wallet/build-and-deployment#ios-build-and-run) for the steps build the iOS application.

More info here:

- [React Native - Publishing to the App Store](https://reactnative.dev/docs/publishing-to-app-store)
- [Apple Developer - Distributing Your App for Beta Testing and Releases](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)

### Note

When application is built via IDE, metro need to be started manually (For instance, if building app via XCode open metro manually, as metro hook has been removed from building via XCode - [reference](https://github.com/facebook/react-native/issues/42173#issuecomment-1921091973)).
However, if app is built via npm commands, metro starts automatically (For instance, `npm run android:mosip` or `npm run ios`)

---

## 📦 Inji Mobile Architecture Alignment

When adopting or customizing Inji Mobile:
- **`screens/`**: Custom AIT-branded screens (Onboarding, Home, Wallet Card List, QR Scanner, Settings).
- **`components/`**: Reusable atomic UI elements compliant with AIT Branding (`packages/branding`).
- **`shared/` / `machines/`**: Integration with Mimoto, Inji Certify, biometric authentication, state machines (XState), and BLE (Tuvali).
- **`types/`**: TypeScript typings for standard claims (National ID and University Transcript).

---

## 🔄 Transition Strategy (Inji Mobile vs Alternative)

As specified in project directives:
1. We **start with the Inji mobile framework**.
2. If dependencies, native module conflicts, or campus ecosystem mismatches arise, we evaluate alternatives (e.g. Flutter or clean React Native OpenID4VC SDK) while preserving the global standard definitions and use case specifications in this repository.

---

## Known Issues

- **Terminal Configuration Error**

  When attempting to build the application using certain terminals via npm commands, you may encounter the following error:

  ```
  Cannot start server in new windows because no terminal app was specified, use --terminal to specify, or start a dev server manually by running npm start or yarn start in other terminal window.
  ```

  **Cause:**

  - This issue occurs due to missing or incorrect terminal configuration or environment settings.

  **Workaround:**

  - Start the development server manually by running `npm start` in a separate terminal window.

## Contributions

Please refer [here](https://docs.mosip.io/inji/inji-mobile-wallet/contribution) for contributing to Inji

## Credits

Credits listed [here](/Credits.md)

## Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

## Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how to setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for  
  React Native.
