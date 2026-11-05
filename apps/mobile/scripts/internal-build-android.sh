#!/usr/bin/env bash
# ==============================================================================
# Container Internal Build Script for AIT Inji Mobile Wallet (Android APK)
# ==============================================================================
set -euo pipefail

# 1. Auto-configure Java & Gradle proxy if container environment defines a proxy
PROXY_URL="${https_proxy:-${http_proxy:-${HTTPS_PROXY:-${HTTP_PROXY:-}}}}"
if [ -n "$PROXY_URL" ]; then
  P_HOST_PORT=$(echo "$PROXY_URL" | sed -e 's,^.*://,,' -e 's,/.*$,,')
  P_HOST="${P_HOST_PORT%:*}"
  P_PORT="${P_HOST_PORT##*:}"

  if [ -n "$P_HOST" ] && [ -n "$P_PORT" ] && [ "$P_HOST" != "$P_PORT" ]; then
    echo "🌐 Detected HTTP/HTTPS proxy ($PROXY_URL). Auto-configuring Gradle & JVM proxy..."
    mkdir -p /root/.gradle
    cat << GEOF > /root/.gradle/gradle.properties
systemProp.http.proxyHost=${P_HOST}
systemProp.http.proxyPort=${P_PORT}
systemProp.https.proxyHost=${P_HOST}
systemProp.https.proxyPort=${P_PORT}
systemProp.http.nonProxyHosts=localhost|127.0.0.1|192.168.*|10.*|100.74.*
GEOF
    export JAVA_OPTS="-Dhttp.proxyHost=${P_HOST} -Dhttp.proxyPort=${P_PORT} -Dhttps.proxyHost=${P_HOST} -Dhttps.proxyPort=${P_PORT} ${JAVA_OPTS:-}"
    export GRADLE_OPTS="-Dhttp.proxyHost=${P_HOST} -Dhttp.proxyPort=${P_PORT} -Dhttps.proxyHost=${P_HOST} -Dhttps.proxyPort=${P_PORT} ${GRADLE_OPTS:-}"
  fi
fi

# 2. Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# 3. Compile Android target via Gradle
TARGET="${*:-:app:assembleResidentappDebug}"
echo "🔨 Running Gradle build with target: $TARGET..."
cd android
./gradlew $TARGET
