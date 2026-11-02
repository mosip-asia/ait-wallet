#!/usr/bin/env bash
# Secrets guard: refuse files that could carry secrets before they reach GitHub.
# The repository is public, so a pushed key is a leaked key.
#
# Usage: bash apps/bff/scripts/check-secrets-guard.sh [--staged]
#   no option   check every tracked file, before a push (the CD pipeline runs it too)
#   --staged    check the files staged for the next commit, as a pre-commit hook:
#               printf '#!/bin/sh\nexec bash apps/bff/scripts/check-secrets-guard.sh --staged\n' > .git/hooks/pre-commit
#
# Refused: environment files (.env, *.env, *.env.*; templates named *.example are fine), key
# stores and keys (*.p12 *.pfx *.jks *.keystore *.pem *.key *.jwk), anything under a certs/
# directory, and any text file with a private-key block. Allowed on purpose: React Native's
# versioned .xcode.env (NODE_BINARY only; .xcode.env.local stays refused) and its public
# debug key apps/mobile/android/app/debug.keystore (the root .gitignore keeps it trackable).
#
# Exit codes: 0 clean, 1 findings, 2 usage or environment error.
set -euo pipefail

die() { echo "check-secrets-guard: $*" >&2; exit 2; }
usage() { sed -n '2,16p' "$0"; exit 2; }

mode=tracked
case "${1:-}" in
  "") ;;
  --staged) mode=staged ;;
  *) usage ;;
esac

cd "$(git rev-parse --show-toplevel)" || die "not inside the repository"

# NUL-separated names (-z), so git does not quote unusual file names.
if [ "$mode" = staged ]; then
  mapfile -d '' -t files < <(git diff --cached --name-only -z --diff-filter=ACMR)
  scope=(--cached)
else
  mapfile -d '' -t files < <(git ls-files -z)
  scope=()
fi

findings=0
report() { echo "REFUSED: $1: $2"; findings=$((findings + 1)); }

for f in "${files[@]}"; do
  if [ "$f" = apps/mobile/android/app/debug.keystore ]; then
    continue
  fi
  name="${f##*/}"
  case "$name" in
    *.example | .xcode.env) ;;
    .env | *.env | *.env.*) report "$f" "environment file (commit only a *.example template)" ;;
  esac
  case "$name" in
    *.p12 | *.pfx | *.jks | *.keystore | *.pem | *.key | *.jwk) report "$f" "key store or key file" ;;
  esac
  case "/$f" in
    */certs/*) report "$f" "file under a certs/ directory" ;;
  esac
done

# Private-key blocks in text files (-I skips binary files). git grep searches the whole
# index (or work tree), so no file list is passed: it would overflow the Windows
# command-line limit. In --staged mode the index includes the staged versions.
while IFS= read -r -d '' f; do
  report "$f" "contains a private-key block"
done < <(git grep "${scope[@]}" -z -lIE -e '-----BEGIN [A-Z0-9 ]*PRIVATE KEY' || true)

if [ "$findings" -gt 0 ]; then
  echo "check-secrets-guard: $findings finding(s)"
  exit 1
fi
echo "check-secrets-guard: ${#files[@]} files clean"
