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
└── src/                                         # Phase 2: Node.js / TypeScript BFF modules
    └── README.md                                # Phase 2 module boundaries
```
