#!/usr/bin/env bash
# ==============================================================================
# Post-Deployment Smoke Test for the AIT Wallet BFF (Mimoto)
#
# Validates that the BFF is running, healthy, and serving its wallet APIs:
# 1. Health: GET /v1/mimoto/actuator/health (status UP)
# 2. Wallet Properties: GET /v1/mimoto/allProperties
# 3. Credential Issuers: GET /v1/mimoto/issuers (at least one issuer)
# 4. Trusted Verifiers: GET /v1/mimoto/verifiers
#
# Usage:
#   bash scripts/smoke-test.sh [base_url]
#   bash scripts/smoke-test.sh http://127.0.0.1:8099
# ==============================================================================
set -euo pipefail

# ANSI color codes
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m"

BASE_URL="${1:-http://127.0.0.1:${BFF_PORT:-8099}}"
BASE_URL="${BASE_URL%/}" # Strip trailing slash
API_URL="${BASE_URL}/v1/mimoto"

echo -e "${BLUE}${BOLD}[SMOKE TEST]${NC} Target Base URL: ${BASE_URL}"

# check <step> <path> <pattern> <name>: GET the path, then require the pattern
# (an extended regular expression) in the response body.
check() {
  local step="$1" path="$2" pattern="$3" name="$4" url response
  url="${API_URL}${path}"
  echo -e "${BLUE}${BOLD}[SMOKE TEST]${NC} ${step}/4 Checking ${name} at ${path}..."
  response="$(curl -sf --max-time 10 "$url")" || {
    echo -e "${RED}${BOLD}[SMOKE TEST FAILED]${NC} Could not reach ${name} at ${url}" >&2
    exit 1
  }
  if ! grep -qE "$pattern" <<<"$response"; then
    echo -e "${RED}${BOLD}[SMOKE TEST FAILED]${NC} ${name} response did not match '${pattern}':" >&2
    echo "${response:0:300}..." >&2
    exit 1
  fi
  echo -e "${GREEN}${BOLD}[OK]${NC} ${name} verified."
}

check 1 /actuator/health '"status"[[:space:]]*:[[:space:]]*"UP"' "Health endpoint"
check 2 /allProperties '"response"[[:space:]]*:[[:space:]]*\{' "Wallet properties"
check 3 /issuers '"issuers"[[:space:]]*:[[:space:]]*\[[[:space:]]*\{' "Credential issuers"
check 4 /verifiers '"verifiers"[[:space:]]*:[[:space:]]*\[' "Trusted verifiers"

echo ""
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD} 🎉 SMOKE TEST PASSED: AIT Wallet BFF is healthy!${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
exit 0
