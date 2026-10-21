# `apps/bff/src/` — Phase 2 Node.js / TypeScript BFF

This directory holds the **Phase 2 Node.js / TypeScript BFF** implementation that replaces the Phase 1 `mosipid/inji-mimoto` Docker container on port `8099`.

## Planned Module Layout

```text
src/
├── index.ts              # Fastify / Hono server entrypoint (port 8099)
├── mimoto-compat/        # 100% compatible /v1/mimoto/* routes reading ../config/*.json
├── accounts/             # /v1/ait/accounts/* — Tier 1 (30d Guest) & Tier 2 (6m SSO Permanent)
├── vault/                # /v1/ait/vault/* — Zero-Knowledge E2EE Multi-Device Vault (Issue #19)
└── vdr/                  # /v1/ait/status/* & /v1/ait/vdr/* — Federated VDR & Bitstring Status Cache
```

See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) and [Issue #19](https://github.com/mosip-asia/ait-wallet/issues/19) for the full design specification.
