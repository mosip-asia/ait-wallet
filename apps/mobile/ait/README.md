# `ait/` — AIT Customization Layer

Everything AIT-specific lives here, **clearly separated from the Inji base**.
Inji's folders (`screens/`, `machines/`, `components/`, `shared/`, native) stay
untouched so `git subtree pull` keeps bringing upstream fixes cleanly.

```
ait/
├── theme/          # configurable theme — consumes packages/branding tokens
├── config/         # runtime config (env + BFF remote)
├── components/     # reusable AIT UI (token-driven, e.g. StatusBadge)
├── features/       # feature-first: each feature keeps screen + machine + types
│   ├── transcript/ #   TranscriptScreen + transcript.machine + transcript.types
│   └── onboarding/
├── integrations/
│   └── ait-api/    # AIT issuer/backend client (repository pattern)
└── security/       # AIT auth POLICIES (extends Inji biometrics — not rebuilt)
```

## Rules

- 🎨 **No hardcoded colours** — components read tokens via `theme/useTheme()`.
- 🧩 **Feature-first** — a feature's screen, machine and types live together.
- 🔌 **Reuse Inji** — credential download/verify/store/present and biometric
  unlock come from Inji; we only add AIT config, theme, features and policies.
- 🔗 **Bridge, don't override** — AIT screens → machine → `ait-api` → Inji core.

See [`../ARCHITECTURE.md`](../ARCHITECTURE.md) for the full model and merge plan.
