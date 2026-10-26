#!/usr/bin/env bash
# Generate a LOCAL development PKCS#12 keystore (certs/oidckeystore.p12) for Mimoto.
# Never commit this file; never copy another developer's keystore or DB state.
set -euo pipefail
cd "$(dirname "$0")/.."

PASS="${OIDC_P12_PASSWORD:-dummypassword}"
OUT="certs/oidckeystore.p12"
mkdir -p certs

if [ -f "$OUT" ]; then
  echo "ℹ️  $OUT already exists — keeping it."
  echo "   To regenerate: rm $OUT && docker compose down -v && ./scripts/generate-keystore.sh"
  echo "   (the keystore and the Postgres volume must stay in sync)."
  exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
  -keyout "$TMP/key.pem" -out "$TMP/cert.pem" \
  -subj "/CN=ait-wallet-dev/O=AIT/C=TH"
openssl pkcs12 -export \
  -inkey "$TMP/key.pem" -in "$TMP/cert.pem" \
  -name partner -out "$OUT" -passout "pass:$PASS"

echo "✅ Generated $OUT (password = OIDC_P12_PASSWORD, default 'dummypassword')."
echo "⚠️  If you ever regenerate it, also run: docker compose down -v"
