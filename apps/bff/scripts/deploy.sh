#!/usr/bin/env bash
# ==============================================================================
# Deploy or update the AIT Wallet BFF Compose stack (Phase 1: the official
# Mimoto image) on the host.
#
# IMPORTANT:
# Mimoto keeps its keys in the Postgres volume AND in certs/oidckeystore.p12,
# and the two must stay in sync. We DO NOT destroy volumes ('down -v') and we
# never regenerate an existing keystore: images are pulled and the services are
# restarted in place.
# ==============================================================================
set -euo pipefail

# ANSI color codes
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
NC="\033[0m"

BFF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$BFF_DIR"

echo -e "${BLUE}${BOLD}[DEPLOY]${NC} Starting deployment of the AIT Wallet BFF..."

# Print the value of KEY from .env: the last match wins; a trailing CR and one
# pair of surrounding double quotes are removed.
env_value() {
  local value
  value="$(grep -E "^$1=" .env | tail -n 1 || true)"
  value="${value#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s' "$value"
}

# 1. Ensure .env exists
if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    echo -e "${YELLOW}${BOLD}[WARN]${NC} No .env file found. Creating from .env.example (development passwords)..."
    cp .env.example .env
  else
    echo -e "${RED}${BOLD}[ERROR]${NC} Missing .env and .env.example file. Aborting." >&2
    exit 1
  fi
fi

BFF_PORT="$(env_value BFF_PORT)"
BFF_PORT="${BFF_PORT:-8099}"

# 2. Ensure the Mimoto keystore exists (generated once, then kept)
if [[ ! -f certs/oidckeystore.p12 ]]; then
  echo -e "${YELLOW}${BOLD}[WARN]${NC} No certs/oidckeystore.p12 found. Generating it (first deployment only)..."
  OIDC_P12_PASSWORD="$(env_value OIDC_P12_PASSWORD)"
  export OIDC_P12_PASSWORD="${OIDC_P12_PASSWORD:-dummypassword}"
  bash scripts/generate-keystore.sh
fi

# 3. Pull the pinned images (Phase 1 builds nothing)
echo -e "${BLUE}${BOLD}[DEPLOY]${NC} Pulling images..."
docker compose pull --quiet ||
  echo -e "${YELLOW}${BOLD}[WARN]${NC} Image pull failed. Using the images already on this host."

# 4. Start services in background (preserving the Postgres volume and the keystore)
echo -e "${BLUE}${BOLD}[DEPLOY]${NC} Starting services (preserving the Postgres volume and the keystore)..."
docker compose up -d --remove-orphans

# 5. Wait for Mimoto to become healthy (its JVM and key manager start slowly)
HEALTH_URL="http://127.0.0.1:${BFF_PORT}/v1/mimoto/actuator/health"
echo -e "${BLUE}${BOLD}[DEPLOY]${NC} Waiting for service readiness at ${HEALTH_URL}..."
TIMEOUT=300
ELAPSED=0

while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    echo -e "${GREEN}${BOLD}[OK]${NC} Mimoto is healthy and ready!"
    break
  fi
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
  echo -e "${RED}${BOLD}[ERROR]${NC} Mimoto failed to become healthy within ${TIMEOUT}s. Recent container logs:" >&2
  docker compose logs --tail 80 mimoto postgres config-server
  exit 1
fi

# 6. Run post-deployment smoke test
echo -e "${BLUE}${BOLD}[DEPLOY]${NC} Running post-deployment smoke test..."
if ! bash scripts/smoke-test.sh "http://127.0.0.1:${BFF_PORT}"; then
  echo -e "${RED}${BOLD}[ERROR]${NC} Post-deployment smoke test failed. Recent Mimoto logs:" >&2
  docker compose logs --tail 80 mimoto
  exit 1
fi

# 7. Print running services summary
echo ""
echo -e "${GREEN}${BOLD}Stack status:${NC}"
docker compose ps
echo ""
echo -e "${GREEN}${BOLD}✅ Deployment of the AIT Wallet BFF completed successfully!${NC}"
