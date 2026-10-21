# AIT Wallet — Backend-for-Frontend (BFF) Architecture

**Status:** Proposal for review  
**Phase:** Phase 1 (Mimoto Container) → Phase 2 (Node.js / TypeScript BFF)

This document proposes the repository structure, configuration strategy, and two-phase migration plan for the AIT Wallet Backend-for-Frontend (`apps/bff/`).

It follows the system architecture defined in [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) and aligns with the mobile client structure in [`apps/mobile/ARCHITECTURE.md`](../mobile/ARCHITECTURE.md).

---

## 1. Architectural Approach: Two-Phase Evolution

Stock **Inji Mobile** expects a Mimoto-compatible backend (`MIMOTO_HOST`) to serve remote configuration, trusted issuer directories, and verifier allowlists. However, upstream `mosip/mimoto` (Java / Spring Boot) is a stateless proxy—it does not implement AIT's **Tier 1 / Tier 2 Account Model**, **Zero-Knowledge E2EE Multi-Device Vault** ([Issue #19](https://github.com/mosip-asia/ait-wallet/issues/19)), or **Multi-VDR Status Caching**.

Rather than forking `mosip/mimoto`'s Java codebase (which would introduce heavy JVM maintenance for code we intend to replace), `apps/bff/` uses a **Two-Phase Strangler Pattern**:

| Phase | Runtime | How It Works | Mobile App Impact |
| :--- | :--- | :--- | :--- |
| **Phase 1 (Immediate)** | Official `mosipid/inji-mimoto` Docker image | Runs the upstream Mimoto container unmodified on port `8099`, mounted with AIT's declarative JSON config files under `apps/bff/config/`. | Zero changes. Mobile app connects to `MIMOTO_HOST=http://localhost:8099` and works out-of-the-box. |
| **Phase 2 (AIT Custom BFF)** | **Node.js / TypeScript** (`apps/bff/src/`) | Replaces the Mimoto container on port `8099` with a lightweight TypeScript service that serves the exact same `/v1/mimoto/*` discovery routes from `apps/bff/config/*.json` **plus** AIT's `/v1/ait/*` Account, E2EE Vault, and VDR Status endpoints. | `/v1/mimoto/*` stays 100% compatible; `apps/mobile/ait/` features connect to `/v1/ait/*`. |

### Key Principles
1. **No Java Fork**: Never import or fork `mosip/mimoto` Java source code into this repository.
2. **Portable Configuration First**: Store issuer metadata (`mimoto-issuers-config.json`), verifier allowlists (`mimoto-trusted-verifiers-config.json`), and runtime flags (`mimoto-default.properties`) in `apps/bff/config/` so both Phase 1 (Mimoto container) and Phase 2 (Node.js BFF) consume the exact same files.
3. **Single-Language Monorepo in Phase 2**: Using **Node.js + TypeScript** for the Phase 2 BFF enables 100% type sharing (`RuntimeConfig`, Vault schemas, VC metadata) across `apps/mobile`, `apps/web`, `apps/bff`, and `packages/branding`.
4. **Zero-Knowledge Privacy Boundary**: The BFF never generates holder keys or sees plaintext Verifiable Credentials. All vault payloads uploaded to `/v1/ait/vault` are encrypted client-side (`AES-256-GCM`) prior to transmission.

---

## 2. Proposed Code Structure (`apps/bff/`)

```text
ait-wallet/
  apps/
    bff/
      ARCHITECTURE.md                           # This document
      README.md                                 # Quickstart & developer guide
      docker-compose.yml                        # Phase 1: Mimoto container (Phase 2: Node.js BFF + Postgres/Redis)
      .env.example                              # Documented BFF environment variables
      config/                                   # Shared declarative configs (Phase 1 & Phase 2)
        mimoto-issuers-config.json              # Trusted credential issuers & card display styles
        mimoto-trusted-verifiers-config.json    # Trusted OIDC4VP verifiers allowlist
        mimoto-default.properties               # Remote runtime properties (/v1/mimoto/allProperties)
      src/                                      # Phase 2: Node.js / TypeScript BFF implementation
        README.md                               # Module responsibilities & Phase 2 scaffold guide
        mimoto-compat/                          # /v1/mimoto/* compatibility routes
        accounts/                               # /v1/ait/accounts/* (Tier 1 Guest & Tier 2 SSO lifecycle)
        vault/                                  # /v1/ait/vault/* (Zero-Knowledge E2EE blob & key-slot storage)
        vdr/                                    # /v1/ait/vdr/* & /v1/ait/status/* (VDR hub & bitstring cache)
```

---

## 3. Module & Endpoint Responsibilities

### 3.1 Mimoto Compatibility Layer (`/v1/mimoto/*`)
Served by the `mosipid/inji-mimoto` container in **Phase 1** and by `src/mimoto-compat/` in **Phase 2**. These are the only endpoints called by upstream Inji Mobile (`apps/mobile/shared/api.ts`) during modern OIDC4VCI / OIDC4VP flows:

| Method & Path | Source File in `config/` | Purpose |
| :--- | :--- | :--- |
| `GET /v1/mimoto/allProperties` | `mimoto-default.properties` | Pushes remote feature flags, cache TTL, and crypto config to the mobile app on startup. |
| `GET /v1/mimoto/issuers` | `mimoto-issuers-config.json` | Returns the list of accredited issuers (e.g., AIT Registrar) for the "Add Card" directory. |
| `GET /v1/mimoto/issuers/:issuerId` | `mimoto-issuers-config.json` | Returns OIDC4VCI `.well-known` discovery endpoints and visual card styling for a specific issuer. |
| `GET /v1/mimoto/verifiers` | `mimoto-trusted-verifiers-config.json` | Returns trusted OIDC4VP relying parties (client IDs, redirect URIs, DIDs). |
| `POST /v2/get-token/:issuer` *(Optional)* | Environment / OIDC client config | Optional token exchange proxy when an authorization server requires a confidential `client_assertion`. |

> **Note on Legacy Mimoto Endpoints**: Legacy MOSIP IDA endpoints (`/v1/mimoto/aid/*`, `/v1/mimoto/wallet-binding`, `/v1/mimoto/credentialshare/*`) predate OIDC4VCI/OIDC4VP and are **not used** by AIT Wallet.

### 3.2 AIT Custom BFF Layer (`/v1/ait/*` — Phase 2 Node.js / TypeScript)

| Module | Endpoints | Responsibility |
| :--- | :--- | :--- |
| `src/accounts/` | `POST /v1/ait/accounts/guest`<br>`POST /v1/ait/accounts/upgrade`<br>`GET /v1/ait/accounts/me` | Enforces **Prime Directive #6**: Tier 1 Guest accounts (mobile-only, 30-day inactivity auto-purge, no PID issuance) and in-place upgrade to Tier 2 Permanent accounts via OIDC SSO (Keycloak, Google, Apple, Microsoft; 6-month inactivity retention). |
| `src/vault/` | `GET /v1/ait/vault`<br>`PUT /v1/ait/vault`<br>`PUT /v1/ait/vault/slots`<br>`DELETE /v1/ait/vault` | Implements the **Termius / Obsidian Sync E2EE Vault Model** ([Issue #19](https://github.com/mosip-asia/ait-wallet/issues/19)): stores encrypted VC + holder-key ciphertext blobs (`AES-256-GCM`) and Envelope Encryption key slots (`Slot 1: Argon2id Master Password`, `Slot 2: Emergency Recovery QR / Passkey`, `Slot 3: Active Device Biometrics`), plus Vault Reset for 1-click OIDC4VCI re-issuance. |
| `src/vdr/` | `GET /v1/ait/status/:listId`<br>`GET /v1/ait/vdr/trust-anchors` | Polls, decompresses, and caches W3C Bitstring Status Lists and federated VDR public keys (AIT, Thailand MHESI/DGA, India DigiLocker) so mobile clients do not download large bitstrings over cellular data (**Prime Directive #7**). |

---

## 4. Delivery Order

1. **Phase 1A (This PR)**: Establish `apps/bff/` architecture, `docker-compose.yml` running the official Mimoto container, and AIT-branded `config/*.json` files.
2. **Phase 1B**: Connect `apps/mobile` (`MIMOTO_HOST`) to `apps/bff` and verify issuer discovery with AIT Inji Certify / mock OIDC4VCI issuer.
3. **Phase 2A**: Initialize Node.js / TypeScript project in `apps/bff/` (Fastify/Hono + Zod) implementing `/v1/mimoto/*` compatibility routes and swap the Docker service.
4. **Phase 2B**: Implement `/v1/ait/accounts` and `/v1/ait/vault` (Zero-Knowledge E2EE Multi-Device Vault, [Issue #19](https://github.com/mosip-asia/ait-wallet/issues/19)).
