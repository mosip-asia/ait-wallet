# `ait/` — AIT Customization Layer

Everything AIT-specific lives here, **clearly separated from the Inji base**.
Inji's folders (`screens/`, `machines/`, `components/`, `shared/`, native) stay
untouched so `git subtree pull` keeps bringing upstream fixes cleanly.

This PR establishes the **structure** and the **configuration mechanism**.
Feature folders are placeholders describing the pattern — features are built in
later PRs (after the Inji base is merged).

```
ait/
├── theme/          # ✅ configurable theme — consumes packages/branding tokens
├── config/         # ✅ runtime config (env + BFF remote)
├── components/     # ▫️ placeholder — reusable AIT UI (token-driven)
├── features/       # ▫️ placeholder — feature-first (screen + machine + types)
├── integrations/   # ▫️ placeholder — AIT issuer/backend clients (repository)
└── security/       # ▫️ placeholder — AIT auth policies (wraps Inji biometrics)
```

- ✅ = implemented now (proves the configurable mechanism)
- ▫️ = structure placeholder (shows where code goes, built later)

See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) for the full model and merge plan.
