# AIT Wallet BFF (`apps/bff`)

Backend-for-Frontend (BFF) for the **AIT Mobile Wallet** (`apps/mobile`) and **AIT Web Wallet** (`apps/web`).

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the complete **Two-Phase Evolution Plan** (Phase 1: Official Mimoto Docker Container → Phase 2: Node.js / TypeScript BFF with Zero-Knowledge E2EE Vault).

---

## 🚀 Phase 1 Quickstart (Official Mimoto Container + AIT Configs)

In Phase 1, you do **not** need Java or Maven installed. The BFF runs the official `mosipid/inji-mimoto` Docker container mounted with AIT's declarative JSON configuration files in [`./config/`](./config/).

### 1. Configure Environment
```bash
cd apps/bff
cp .env.example .env
```

### 2. Start the BFF Container

#### Option A: Standard BFF (Connecting to upstream/sandbox issuers)
```bash
docker compose up -d
```

#### Option B: BFF + Local Development Mock Issuer (Offline Testing)
If you want to test complete issuance locally with an isolated mock AIT Registrar:
```bash
./scripts/start-local-issuer.sh
```
*(See [`tools/local-issuer/README.md`](../../tools/local-issuer/README.md) for certificate installation in emulators and mock login credentials).*

The BFF will start on **`http://localhost:8099`**.

### 3. Verify Mimoto Endpoints
```bash
# 1. Check remote wallet properties
curl http://localhost:8099/v1/mimoto/allProperties

# 2. List configured credential issuers (AIT Registrar + fallback sandbox)
curl http://localhost:8099/v1/mimoto/issuers

# 3. List trusted OIDC4VP verifiers
curl http://localhost:8099/v1/mimoto/verifiers
```

### 4. Connect the Mobile Wallet (`apps/mobile`)
In `apps/mobile/.env`, set:
```ini
MIMOTO_HOST=http://localhost:8099
```
*(For Android Emulator, use `http://10.0.2.2:8099`; for physical devices on the same Wi-Fi, use your workstation's LAN IP).*

---

## 🚢 Deployment to `wallet-dev` (CD)

A `v*` tag deploys the BFF to `wallet-dev`, a private development VM (Debian 12, Docker) on the DPI NetBird mesh. It runs Mon–Fri 08:30–18:30 (Asia/Bangkok); a deployment outside those hours fails at the NetBird step.

The pipeline is [`.github/workflows/cd-bff.yml`](../../.github/workflows/cd-bff.yml). It:
1. checks the secrets and variables below, runs [`scripts/check-secrets-guard.sh`](./scripts/check-secrets-guard.sh) and validates `docker-compose.yml`;
2. joins the NetBird mesh and logs in to the VM over SSH as the CI user `deploy`;
3. checks out the tag in `SERVER_PROJECT_DIR` and runs [`scripts/deploy.sh`](./scripts/deploy.sh): pull the images, start the stack in place (the Postgres volume and the keystore are kept), wait for `/v1/mimoto/actuator/health`, then run [`scripts/smoke-test.sh`](./scripts/smoke-test.sh);
4. if that fails, deploys the last release that passed (recorded in `.deploy_success`) again and fails the run.

### Cut a Release
Releases are promoted from `dev` into `main` (create `dev` from `main` before the first release). From a clean `dev` checkout:
```bash
bash apps/bff/scripts/release.sh --dry-run v0.1.0   # checks and preview, changes nothing
bash apps/bff/scripts/release.sh v0.1.0             # merges dev into main, pushes main and the tag
```
`v*` tags are reserved for BFF releases.

### One-Time Setup
In GitHub → **Settings → Secrets and variables → Actions**, at repository level:

| Name | Kind | Value |
|---|---|---|
| `NETBIRD_SETUP_KEY` | Secret | Reusable, ephemeral NetBird setup key for CI runners |
| `SSH_PRIVATE_KEY` | Secret | Private key of the `deploy` user on `wallet-dev` |
| `NETBIRD_MANAGEMENT_URL` | Variable | `https://netbird.dpi.ait.ac.th` |
| `SERVER_HOST` | Variable | `wallet-dev-vm` |
| `SERVER_USER` | Variable | `deploy` |
| `SERVER_PROJECT_DIR` | Variable | `/projects/ait-wallet` |

The `deploy` user (Docker, passwordless sudo, key accepted only from NetBird addresses) is managed in `mosip-asia/ait-vc-infra` (`ait-vc-wallet/`).

**Before the first deployment:** `deploy.sh` creates `apps/bff/.env` from `.env.example` when it is missing, so the stack starts with the development passwords. For real ones, write `/projects/ait-wallet/apps/bff/.env` on the VM first: changing `POSTGRES_PASSWORD` or `OIDC_P12_PASSWORD` later means `docker compose down -v` and a new keystore, which deletes the BFF's data.

### Reach the Deployed BFF
- From a device on the NetBird mesh: `http://wallet-dev-vm:8099/v1/mimoto/...` (Docker-published ports over the mesh are not tested yet; if it does not answer, use the SSH forward below).
- "Login with Google" accepts only the `http://localhost:8099` redirect, so for that flow forward the port over SSH and open `http://localhost:8099`:
  ```bash
  ssh -L 8099:localhost:8099 <os-login-user>@wallet-dev-vm.netbird.selfhosted
  ```

---

## 📁 Directory Overview

```text
apps/bff/
├── ARCHITECTURE.md                              # Two-Phase BFF design & API contracts
├── README.md                                    # This guide
├── docker-compose.yml                           # Local BFF container orchestration
├── .env.example                                 # Environment variables template
├── config/                                      # Portable configs (shared by Phase 1 & Phase 2)
│   ├── mimoto-issuers-config.json               # AIT Issuer metadata & card branding (#0B5D34 / #D4AF37)
│   ├── mimoto-trusted-verifiers-config.json     # Trusted OIDC4VP verifiers allowlist
│   └── mimoto-default.properties                # Runtime flags served at /v1/mimoto/allProperties
├── scripts/                                     # Keystore and local-issuer helpers, plus:
│   ├── deploy.sh                                # CD: pull, start in place, health check, smoke test
│   ├── smoke-test.sh                            # CD: post-deployment API checks
│   ├── release.sh                               # Cut a release: dev -> main + v* tag
│   └── check-secrets-guard.sh                   # Refuse keys and .env files before they reach GitHub
└── src/                                         # Phase 2: Node.js / TypeScript BFF modules
    └── README.md                                # Phase 2 module boundaries
```
