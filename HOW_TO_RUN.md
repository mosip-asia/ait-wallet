# How to run (Android)

Run commands from the repository root. Start Docker and an Android emulator first.

## 1. BFF + local demo issuer

```bash
cd apps/bff
./scripts/start-local-issuer.sh
```

BFF: http://localhost:8099. Leave Docker running.

## 2. Mobile

Set `MIMOTO_HOST=http://localhost:8099` in `apps/mobile/.env`.

Terminal 1 (leave running):

```bash
cd apps/mobile
npm start
```

Terminal 2:

```bash
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8099 tcp:8099
adb reverse tcp:8443 tcp:8443
cd apps/mobile
npm run android:mosip -- --no-packager
```

First setup needs mobile dependencies, JDK 17, and Android SDK: [mobile setup](apps/mobile/README.md).
For HTTPS demo issuance, install the [local CA in the emulator](tools/local-issuer/README.md#b-android-emulator).
