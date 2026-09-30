# AIT Web Wallet (`apps/web`)

---

## 🌐 Overview & Future Roadmap

The **AIT Web Wallet** is the future browser-based companion to the AIT Mobile Wallet. While our primary focus is releasing the mobile wallet on iOS and Android, this directory establishes the architectural boundary and interfaces for web-based credential management.

---

## 🎯 Target Use Cases for Web Wallet

1. **Desktop Academic Services**: Single Sign-On (SSO) and Verifiable Presentation for web portals (e.g. thesis submission, student loan approvals, library digital repositories) without requiring a mobile phone handy.
2. **Administrative & Faculty Workflows**: Bulk verification, academic grading sign-offs, and research grant credential presentations.
3. **Backup & Credential Recovery**: Account recovery and cloud backup synchronization across user devices (conforming to MOSIP Inji Web specs).

---

## 🛠️ Anticipated Stack

- **Framework**: [MOSIP Inji Web](https://github.com/mosip/inji-web) or modern React/Next.js SPA.
- **Key Storage**: Web Cryptography API (`window.crypto.subtle`) / IndexedDB with hardware security tokens (WebAuthn / FIDO2).
- **Protocols**: OIDC4VCI (Issuance) and OIDC4VP (Presentation via browser session / deep links).

---

## 📦 Decoupling & Submodule Considerations

- If the web wallet team operates independently or requires a separate deployment pipeline, this folder can easily transition into a Git Submodule pointing to a dedicated repository (e.g. `ait-web-wallet`) without disrupting shared design tokens in `packages/branding` or project documentation in `docs/`.
