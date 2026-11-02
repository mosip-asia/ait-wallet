#!/usr/bin/env bash
# ==============================================================================
# Release Helper Script for the AIT Wallet BFF
#
# Runs local pre-flight checks, promotes 'dev' into 'main', creates an annotated
# SemVer release tag and pushes it. The tag triggers the CD pipeline
# (.github/workflows/cd-bff.yml), which deploys the BFF to the wallet-dev VM.
#
# Branching Model (as in ait-sis-adapter):
#   Pull requests target 'dev'. A release merges 'dev' into 'main' and tags it.
#   v* tags are reserved for BFF releases: every v* tag deploys the BFF.
#
# Usage:
#   bash apps/bff/scripts/release.sh [--dry-run] <version>
#   bash apps/bff/scripts/release.sh --dry-run v0.1.0   # checks + preview, changes nothing
#   bash apps/bff/scripts/release.sh v0.1.0
# ==============================================================================
set -euo pipefail

# ANSI Color codes
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m"

log_info() { echo -e "${BLUE}${BOLD}[INFO]${NC} $*"; }
log_ok() { echo -e "${GREEN}${BOLD}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}${BOLD}[WARN]${NC} $*"; }
log_err() { echo -e "${RED}${BOLD}[ERROR]${NC} $*" >&2; }

# Tags belong to the whole repository, so the script works from its root.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && git rev-parse --show-toplevel)"
cd "$ROOT_DIR"
BFF_DIR="apps/bff"
CD_URL="https://github.com/mosip-asia/ait-wallet/actions/workflows/cd-bff.yml"

# ------------------------------------------------------------------------------
# 1. Parse & Validate Arguments
# ------------------------------------------------------------------------------
DRY_RUN=false
VERSION=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -*)
      log_err "Unknown option '${arg}'. Usage: release.sh [--dry-run] <version>"
      exit 1
      ;;
    *) VERSION="$arg" ;;
  esac
done

if [[ -z "$VERSION" ]]; then
  echo -e "${BOLD}Target Release Version (e.g., v0.1.0):${NC} "
  read -r VERSION
fi

if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  log_err "Invalid version tag '${VERSION}'."
  log_err "Version must follow Semantic Versioning with a leading 'v' (e.g. v0.1.0, v1.0.0, v1.0.0-rc1)."
  exit 1
fi

[[ "$DRY_RUN" == true ]] && log_warn "DRY RUN: checks and preview only. Nothing is merged, tagged or pushed."

# ------------------------------------------------------------------------------
# 2. Local Pre-Flight Safety Checks
# ------------------------------------------------------------------------------
log_info "Running local pre-flight checks..."

# Check working tree is clean
if [[ -n "$(git status --porcelain)" ]]; then
  log_err "Working tree is dirty. Please commit, stash, or discard local changes first:"
  git status -s
  exit 1
fi

# Check if tag already exists locally or remotely
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  log_err "Tag '${VERSION}' already exists locally."
  exit 1
fi

if git ls-remote --tags origin 2>/dev/null | grep -q "refs/tags/${VERSION}$"; then
  log_err "Tag '${VERSION}' already exists on remote 'origin'."
  exit 1
fi

# Check Secrets Guard (the repository is public: no keys or .env files)
log_info "Running secrets guard check..."
bash "${BFF_DIR}/scripts/check-secrets-guard.sh"
log_ok "Secrets guard passed."

# Validate Docker Compose configuration
log_info "Validating Docker Compose configuration..."
if [[ ! -f "${BFF_DIR}/.env" ]]; then
  cp "${BFF_DIR}/.env.example" "${BFF_DIR}/.env"
  TEMP_ENV=true
else
  TEMP_ENV=false
fi

if ! (cd "$BFF_DIR" && docker compose config --quiet); then
  log_err "${BFF_DIR}/docker-compose.yml configuration failed validation."
  [[ "$TEMP_ENV" == true ]] && rm -f "${BFF_DIR}/.env"
  exit 1
fi

[[ "$TEMP_ENV" == true ]] && rm -f "${BFF_DIR}/.env"
log_ok "Docker Compose configuration verified."

# No test step yet: in Phase 1 the BFF is the official Mimoto image plus AIT
# configuration, so there is no BFF code to test (Phase 2 adds it).

# ------------------------------------------------------------------------------
# 3. Branch Synchronization & Promotion (dev -> main)
# ------------------------------------------------------------------------------
log_info "Fetching latest remote refs from origin..."
git fetch origin

if ! git rev-parse --verify --quiet origin/dev >/dev/null; then
  log_err "Branch 'dev' does not exist on origin. Create it from 'main' before the first release."
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
log_info "Current active branch: ${BOLD}${CURRENT_BRANCH}${NC}"

if [[ "$DRY_RUN" == true ]]; then
  # Preview what a real run would release: origin/dev promoted into main.
  RELEASE_BRANCH="main"
  RELEASE_REF="origin/dev"
  if git merge-base --is-ancestor origin/main origin/dev; then
    log_ok "'main' can fast-forward to 'dev'."
  else
    log_warn "'main' has commits that 'dev' lacks: a real run makes a merge commit."
  fi
  if [[ "$CURRENT_BRANCH" == "dev" && "$(git rev-parse dev)" != "$(git rev-parse origin/dev)" ]]; then
    log_warn "Local 'dev' differs from origin/dev. A real run pulls 'dev' first."
  fi
elif [[ "$CURRENT_BRANCH" == "dev" ]]; then
  log_info "Pulling latest changes on 'dev'..."
  git pull origin dev

  LOCAL_DEV_REV="$(git rev-parse dev)"
  REMOTE_DEV_REV="$(git rev-parse origin/dev)"
  if [[ "$LOCAL_DEV_REV" != "$REMOTE_DEV_REV" ]]; then
    log_err "Local 'dev' (${LOCAL_DEV_REV:0:7}) is out of sync with origin/dev (${REMOTE_DEV_REV:0:7}). Aborting."
    exit 1
  fi
  log_ok "Branch 'dev' is up to date."

  log_info "Switching to 'main' branch..."
  git checkout main
  log_info "Pulling latest changes on 'main'..."
  git pull origin main

  log_info "Merging 'dev' into 'main'..."
  if ! git merge --ff-only dev; then
    log_warn "Fast-forward merge not possible. Performing standard merge commit..."
    git merge -m "Merge branch 'dev' for release ${VERSION}" dev
  fi
  log_ok "'main' successfully updated with latest changes from 'dev'."
  RELEASE_BRANCH="main"
elif [[ "$CURRENT_BRANCH" == "main" ]]; then
  log_info "Pulling latest changes on 'main'..."
  git pull origin main
  RELEASE_BRANCH="main"
else
  log_warn "You are on branch '${CURRENT_BRANCH}', not 'dev' or 'main'."
  echo -e "Releases are promoted from 'dev' into 'main'."
  read -r -p "Switch to 'dev' before releasing? [Y/n]: " SWITCH_DEV
  SWITCH_DEV="${SWITCH_DEV:-Y}"
  if [[ "$SWITCH_DEV" == "y" || "$SWITCH_DEV" == "Y" ]]; then
    git checkout dev
    git pull origin dev
    git checkout main
    git pull origin main
    git merge dev
    RELEASE_BRANCH="main"
  else
    RELEASE_BRANCH="$CURRENT_BRANCH"
    git pull origin "$RELEASE_BRANCH"
  fi
fi

if [[ "$DRY_RUN" != true ]]; then
  RELEASE_REF="$RELEASE_BRANCH"
  log_ok "Release staging on branch '${RELEASE_BRANCH}' is complete."
fi

# ------------------------------------------------------------------------------
# 4. Preview & Confirmation Gate
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}======================================================================${NC}"
echo -e "${BOLD}                      RELEASE PREVIEW: ${GREEN}${VERSION}${NC}"
echo -e "${BOLD}======================================================================${NC}"

# --no-pager: a pager would stop the script until 'q' is pressed.
LAST_TAG="$(git describe --tags --abbrev=0 --match 'v*' "$RELEASE_REF" 2>/dev/null || echo "")"
if [[ -n "$LAST_TAG" ]]; then
  echo -e "Commits included since last tag (${YELLOW}${LAST_TAG}${NC}):"
  git --no-pager log --oneline "${LAST_TAG}..${RELEASE_REF}"
else
  echo -e "Initial release commits:"
  git --no-pager log --oneline -n 10 "$RELEASE_REF"
fi

echo -e "${BOLD}Target Branch:${NC}         ${RELEASE_BRANCH}"
echo -e "${BOLD}Target Commit:${NC}         $(git rev-parse --short "$RELEASE_REF")"
echo -e "${BOLD}Pushed Tag:${NC}            ${VERSION}"
echo -e "${BOLD}Deployment Target:${NC}     wallet-dev (GCP VM, over the DPI NetBird mesh)"
echo -e "${BOLD}======================================================================${NC}"
echo ""

if [[ "$DRY_RUN" == true ]]; then
  log_ok "Dry run complete: nothing was merged, tagged or pushed."
  exit 0
fi

read -r -p "Deploy release ${VERSION} to wallet-dev? [y/N]: " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  log_warn "Release aborted by user."
  exit 0
fi

# ------------------------------------------------------------------------------
# 5. Push Branch, Tag, and Trigger CD
# ------------------------------------------------------------------------------
log_info "Pushing '${RELEASE_BRANCH}' to origin..."
git push origin "$RELEASE_BRANCH"

log_info "Creating annotated tag '${VERSION}'..."
git tag -a "$VERSION" -m "Release $VERSION"

log_info "Pushing tag '${VERSION}' to trigger CD workflow..."
git push origin "$VERSION"

log_ok "Tag '${VERSION}' successfully pushed to GitHub!"

# Create GitHub Release with auto-generated notes if gh CLI is authenticated
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  log_info "Creating GitHub Release with auto-generated release notes..."
  if gh release create "$VERSION" --title "Release $VERSION" --generate-notes; then
    log_ok "GitHub Release published."
  else
    log_warn "GitHub Release not created. The tag is pushed; create the release in the GitHub UI if needed."
  fi
fi

# ------------------------------------------------------------------------------
# 6. Return to Working Branch
# ------------------------------------------------------------------------------
if [[ "$CURRENT_BRANCH" == "dev" ]]; then
  log_info "Switching back to 'dev' branch..."
  git checkout dev
fi

echo ""
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD} 🎉 Release ${VERSION} successfully cut on branch '${RELEASE_BRANCH}'!${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "The deployment to wallet-dev has been triggered (the VM runs Mon-Fri 08:30-18:30 Asia/Bangkok)."
echo -e "Monitor live CD progress at:"
echo -e "${BLUE}${CD_URL}${NC}"
echo ""
