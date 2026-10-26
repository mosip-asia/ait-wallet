#!/usr/bin/env bash
# Opt-in, fictional registrar fixture; preserves existing local env, keys and DB.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then cp .env.example .env; fi
./scripts/generate-keystore.sh
docker compose up -d
python3 ../../tools/local-issuer/scripts/setup.py
export LOCAL_ISSUER_UID="$(id -u)"
export LOCAL_ISSUER_GID="$(id -g)"
docker compose -f docker-compose.yml -f docker-compose.local-issuer.yml \
  up -d --build --force-recreate config-server mimoto local-issuer
printf '%s\n' 'Local fixture started. Follow README.md to trust its CA in the simulator.'
