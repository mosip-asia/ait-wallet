# AIT Wallet Applications Suite (`apps/`)

This directory contains the user-facing client applications and backend-for-frontend services comprising the **AIT Wallet ecosystem**:

```text
apps/
├── mobile/     # AIT Mobile Wallet (React Native / MOSIP Inji Mobile framework)
├── bff/        # Inji Mimoto Backend-for-Frontend (VDR Router, Status Syncer & Cache)
└── web/        # Web Wallet boundary and desktop authentication interfaces
```

---

## 🏗️ Architectural Topology

```text
┌───────────────────────────┐         ┌──────────────────────────┐         ┌──────────────────────────┐
│   apps/mobile             │         │   apps/bff               │         │   tools/local-issuer     │
│   Inji Mobile App         │◄───────►│   Inji Mimoto BFF        │◄───────►│   OIDC4VCI Mock Issuer   │
│   (React Native :8081)    │         │   (Docker :8099)         │         │   (Node.js / TLS :8443)  │
└───────────────────────────┘         └──────────────────────────┘         └──────────────────────────┘
```

The stack operates via two coordinating components:
1. **Wallet Backend (BFF)**: Runs Inji Mimoto to normalize VDR schemas, dereference public keys, proxy OAuth tokens, and shield the mobile app from heavy cryptographic resolution.
2. **Mobile Client**: Runs Inji Mobile on iOS / Android to manage hardware keypairs (Secure Enclave / Android KeyStore), encrypted credential databases, and presentation UIs.

---

## 🚀 Step 1: Start the Backend (BFF)

Before launching the mobile app, start the BFF service. Choose either **Option A** (cloud sandboxes) or **Option B** (local offline mock issuer):

### Option A: Standard BFF (Connecting to upstream/cloud sandboxes)
```bash
cd apps/bff
cp -n .env.example .env
docker compose up -d
```

### Option B: BFF + Local Development Mock Issuer (Recommended for Offline Dev)
To test complete credential issuance locally without external networks:
```bash
cd apps/bff
./scripts/start-local-issuer.sh
```

> [!TIP]
> When using Option B, install the local root CA (`tools/local-issuer/state/ca.pem` or `ca.der`) into your iOS/Android simulator so HTTPS requests succeed. See the [Local Development Mock Issuer Guide](../tools/local-issuer/README.md) for full instructions.

**Verify BFF Health**:
```bash
# Verify Mimoto health (port 8099)
curl http://localhost:8099/v1/mimoto/actuator/health

# Check configured issuers
curl http://localhost:8099/v1/mimoto/issuers
```

---

## 📱 Step 2: Spin Up the Mobile Client (`apps/mobile`)

Configure the mobile environment first:
```bash
cd apps/mobile
cp -n .env.example .env
```
Ensure `MIMOTO_HOST=http://localhost:8099` (or `http://10.0.2.2:8099` for Android without reverse proxy).

Choose your preferred development workflow:

### 🐳 Method 1: Dockerized Development (Headless Container — Recommended for Linux / Android)
Best for developers who want a zero-host-dependency workflow without installing Node.js, JDK 17, and 15+ GB of Android SDK/NDK toolchains on their workstation.

#### Prerequisites:
* **Docker & Docker Compose**
* **Android Emulator + ADB** (installed on your host machine to display the UI)
* *(No Node.js, Java, or Android SDK required on your host system)*

#### Commands:
```bash
cd apps/mobile

# 1. Compile the APK headlessly inside Docker:
npm run docker:build:android
# (Or run directly: ./scripts/docker-build-apk.sh)

# 2. Forward emulator ports to host containers:
adb reverse tcp:8081 tcp:8081   # Metro bundler
adb reverse tcp:8099 tcp:8099   # Inji Mimoto BFF
adb reverse tcp:8443 tcp:8443   # Local Mock Issuer

# 3. Install the freshly compiled APK onto your running emulator:
adb install -r android/app/build/outputs/apk/residentapp/debug/Inji_universal.apk

# 4. Start the Dockerized Metro bundler for live Fast Refresh / code updates:
npm run docker:metro
```

*Open the installed Inji app on your emulator. When you edit TypeScript/React Native code on your host, Metro will hot-reload the changes live.*

---

### 📦 Method 2: Local Installation (Native Host)
Best for macOS developers targeting iOS, or developers with existing Android SDK/NDK setups.

#### Prerequisites:
* **Node.js**: `v20.x` LTS
* **Java**: OpenJDK 17
* **Android**: Android Studio (API 34/35/36, NDK 27.0.12077973)
* **iOS (macOS only)**: Xcode 15+, CocoaPods (`pod install`)
* **Ubuntu / Debian packages**: `sudo apt update && sudo apt install -y bzip2 build-essential`

#### Commands:
```bash
cd apps/mobile

# 1. Install dependencies
npm install

# 2. For iOS: install CocoaPods pods (macOS only)
cd ios && pod install && cd ..

# 3. Start Metro bundler in one terminal
npm start

# 4. Launch on Emulator / Device in a second terminal:
# For Android:
npm run android:mosip

# For iOS (macOS only):
npm run ios
```

---

## 🧪 Step 3: Issue a Test Credential

If running with the **Local Mock Issuer** (Option B):
1. Complete initial app setup / passcode entry in the Inji Wallet.
2. Tap **+ Add Credential** / **Download Credential**.
3. Select **AIT Registrar — Local Demo**.
4. Log in using the built-in mock student account:
   * **Username**: `student`
   * **Password**: `student-local-password`
5. Tap **Sign in and issue student ID** to download Nisha Gurung's student ID card into your wallet.

---

## 🔒 Step 4: Next Steps: Configuring Google OAuth (Tier 2 Upgrade)

By default, the wallet runs in **Tier 1 (Guest Mode)**. To enable **Tier 2 (Permanent Registered Account)** with multi-device cloud backup:
- **Mobile client configuration**: Add your OAuth client ID to `GOOGLE_ANDROID_CLIENT_ID` in `apps/mobile/.env`.
- **BFF configuration**: Provide `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in `apps/bff/.env`.

---

## 📁 Applications Directory Map

| Path | Description | Documentation |
| :--- | :--- | :--- |
| [`apps/mobile/`](./mobile) | React Native Inji Mobile Client | [`apps/mobile/README.md`](./mobile/README.md) |
| [`apps/bff/`](./bff) | Inji Mimoto Backend-for-Frontend | [`apps/bff/README.md`](./bff/README.md), [`apps/bff/ARCHITECTURE.md`](./bff/ARCHITECTURE.md) |
| [`apps/web/`](./web) | Desktop & Web Wallet architecture boundary | [`apps/web/README.md`](./web/README.md) |
| [`tools/local-issuer/`](../tools/local-issuer) | Local Mock Issuer & Offline Testing Guide | [`tools/local-issuer/README.md`](../tools/local-issuer/README.md) |

