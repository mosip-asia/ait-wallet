# AIT Wallet — Mobile App Architecture

**Status:** Proposal for review  
**Phase:** 1

This document proposes the mobile code structure and configuration approach for AIT Wallet.

It preserves Inji Mobile’s existing directory layout and introduces an AIT-specific layer for branding, features, integrations, and authentication policies. It follows the system architecture defined in `docs/ARCHITECTURE.md`.

**Scope:** Code organization, module responsibilities, and configuration mechanisms. Feature implementations are delivered in subsequent PRs.

---

## 1. Architectural approach

AIT Wallet extends Inji Mobile rather than rebuilding its wallet capabilities.

The mobile app follows the thin-client boundaries defined in `docs/ARCHITECTURE.md`. Existing Inji credential management, encrypted storage, signing, and authentication capabilities are reused.

### Principles

- Preserve Inji’s existing directory layout.
- Keep AIT-specific additions together.
- Reuse existing wallet functionality before introducing new implementations.
- Separate presentation, workflows, integrations, and configuration.
- Minimize and document changes to upstream-derived files.
- Keep private keys and signing operations within the existing on-device security mechanisms.

---

## 2. Two-zone model

The mobile application contains two logical zones within one application.

| Zone | Responsibility | Rule |
| :--- | :--- | :--- |
| Inji-derived code | Existing wallet screens, workflows, credential operations, storage, and native integrations | Preserve the directory layout. Make minimal integration changes and document them. |
| AIT-specific code | AIT branding, features, integrations, configuration, and authentication policies | Place mobile additions under `apps/mobile/ait/`; place shared design tokens in `packages/branding/`. |

The AIT layer connects to Inji through explicit integration points such as application initialization, navigation, theme integration, and workflow actions.

The `ait/` directory is an organizational boundary, not an automatic override or plugin mechanism. Existing Inji files may require small changes to connect AIT functionality.

This separation reduces upstream conflicts but does not eliminate them. Upstream updates must be reviewed and tested before merging.

---

## 3. Proposed code structure

Existing Inji directories remain in place. The following shows the relevant directories and proposed AIT additions; it is not an exhaustive listing of Inji files.

```text
ait-wallet/
  apps/
    mobile/                         # Inji subtree and AIT mobile additions
      android/                      # Existing Android project
      ios/                          # Existing iOS project
      assets/                       # Existing Inji assets
      components/                   # Existing Inji components
      screens/                      # Existing Inji screens
      routes/                       # Existing navigation
      machines/                     # Existing XState workflows
      lib/                          # Existing utilities and integrations
      shared/                       # Existing shared code
      types/                        # Existing types
      locales/                      # Existing localization resources

      ait/
        theme/                      # Branding-to-theme integration
        config/                     # Configuration loading and validation
        components/                 # Reusable AIT UI components
        features/                   # AIT feature modules
        integrations/               # AIT backend clients and data mapping
        security/                   # AIT authentication policies
        assets/                     # AIT-specific images and icons

      ARCHITECTURE.md                # This document
      .env.example                  # Documented deployment variables
      app.config.ts                 # Existing app/build configuration
      package.json                  # Mobile dependencies and scripts
      package-lock.json             # Mobile dependency lockfile

  packages/
    branding/                       # Shared design tokens

  docs/
    ARCHITECTURE.md                  # System architecture

  .github/
    workflows/                      # AIT repository CI
```

Mobile dependencies and the existing mobile lockfile remain under `apps/mobile/`.

`packages/branding/` is a local shared package. Its integration must configure Metro, TypeScript, dependency resolution, and CI so that mobile builds can resolve it.

---

## 4. Module responsibilities

| Directory | Responsibility |
| :--- | :--- |
| `ait/theme/` | Adapt shared design tokens to the app’s theme system. |
| `ait/config/` | Load, validate, and expose deployment and remote configuration. |
| `ait/components/` | Provide UI components reused across multiple AIT features. |
| `ait/features/` | Contain feature-specific screens, components, workflows, and types. |
| `ait/integrations/` | Communicate with AIT backend services and map API responses into application types. |
| `ait/security/` | Apply AIT authentication policies using existing Inji security capabilities. |
| `ait/assets/` | Store AIT-specific images, icons, and illustrations. |
| `packages/branding/` | Define shared visual tokens such as colors, typography, and spacing. |

### Feature organization

Each feature groups its own code together. For example:

```text
ait/features/transcript/
  TranscriptScreen.tsx
  transcript.machine.ts
  transcript.types.ts
  components/
```

Create files and subdirectories only when required by the implementation.

### Dependency rules

- Screens and components handle presentation and user interaction.
- XState machines coordinate workflows, transitions, and asynchronous actions.
- Integration modules handle backend communication and response mapping.
- Feature-specific components remain inside their feature.
- Components shared across AIT features belong in `ait/components/`.
- Shared wallet state and credential operations reuse existing Inji modules.
- Integration and configuration modules must not depend on UI components.
- Avoid circular dependencies between AIT modules and Inji-derived code.

Typical interaction:

```text
Screen → workflow machine → integration or existing Inji capability
```

Screens must not directly implement key management, credential cryptography, or encrypted storage.

---

## 5. Integration with Inji

No existing Inji directories are moved.

| Existing Inji area | AIT integration |
| :--- | :--- |
| Application initialization | Initialize AIT configuration and theme integration. |
| `screens/`, `components/` | Incrementally adopt shared branding and connect AIT components. |
| `routes/` | Register AIT screens and navigation entries. |
| `machines/` | Connect AIT workflows to existing wallet workflows and services. |
| Authentication and biometric workflows | Apply AIT policies while reusing existing authentication capabilities. |
| Existing local settings | Store supported user preferences through the existing mechanism. |
| `.env`, `app.config.ts` | Supply build/deployment configuration. |
| Running application | Load validated remote configuration through `ait/config/`. |

Biometric unlock, encrypted storage, key management, and credential handling must first be assessed in the imported Inji revision before adding new implementations.

Device biometric unlock and credential-photo face matching are separate capabilities and must be treated separately.

---

## 6. Delivery order and status

### Delivery order

1. Merge the Inji subtree import.
2. Rebase the AIT structure/configuration branch onto that base.
3. Implement and verify the branding package, theme integration, and configuration mechanism.
4. Add AIT features through subsequent PRs.

The initial subtree import must precede additions under `apps/mobile/`, because `git subtree add` expects its destination path not to exist.

### Status terminology

| Status | Meaning |
| :--- | :--- |
| Proposed | Described and awaiting agreement. |
| Implemented | Code exists and its behavior has been checked. |
| Integrated | Connected to the mobile application and verified in the relevant flows. |
| Placeholder | Indicates intended organization; contains no feature implementation. |

This document is a proposal. Implementation and integration status must be reported in the accompanying PR.
