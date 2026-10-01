# AGENTS.md — Developer & AI Agent Guidelines

> **Target Audience**: Any AI Coding Agent (Antigravity, Claude, Copilot, Cursor, Codex, Devin, Aider) or human developer working on the `ait-wallet` repository.

This document establishes the **immutable architectural rules**, **domain invariants**, and **operational guidelines** for contributing to this codebase. All agents must read and adhere to these directives before generating code or modifying documentation.

---

## 🎯 1. Repository Purpose & Architecture Summary

The `ait-wallet` is a **universal, multi-governance, cross-platform Verifiable Credential (VC) wallet** with an initial reference deployment for the **Asian Institute of Technology (AIT)** community.

The system is governed by **3 Architectural Pillars**:
1. **Multi-Platform BFF Architecture**: Thin mobile/web clients backed by a Backend-for-Frontend (BFF / Inji Mimoto) handling VDR resolution, status lists, and zero-knowledge E2EE vault sync.
2. **Multi-Document Format & Multi-VDR Presentation**: Native support for **IETF SD-JWT** (`vc+sd-jwt`), **ISO/IEC 18013-5 mdoc** (`mso_mdoc`), and **W3C JSON-LD** (`ldp_vc`) without duplicate visual UI cards.
3. **Presentation-Level Context Selector**: Region/domain toggle pills (e.g. AIT Campus vs. Thailand National) in the UI that dynamically re-order presentation priorities without altering underlying cryptographic payloads.

---

## ⚠️ 2. The 8 Immutable Prime Directives

Any AI agent generating code, configuration, or documentation in this repository **MUST** strictly obey these eight rules:

### 1. 🚫 NO Hardcoded Credential Schemas in this Repository
- **Rule**: Do **NOT** create bespoke credential schema definitions or validation packages (e.g., `packages/schemas/`) inside this repository.
- **Why**: Schemas belong to **Verifiable Credential Governance Authorities (VCGAs)** and are published to public **Verifiable Data Registries (VDRs)**. The wallet is an agnostic custodian that dynamically dereferences schemas at runtime via OIDC4VCI.

### 2. 🌐 Ground Institutional Credentials in `schema.org` & `eduPerson`
- **Rule**: When referencing or modeling academic and institutional credentials (such as Student ID, Staff ID, and Academic Transcripts), always map claims to:
  - [`schema.org/EducationalOccupationalCredential`](https://schema.org/EducationalOccupationalCredential)
  - [`schema.org/Course`](https://schema.org/Course)
  - [`schema.org/Person`](https://schema.org/Person)
  - [`eduPerson` (RFC 8485 / REF eduPerson)](https://refeds.org/eduperson)
- **Why**: Ensures credentials are universally machine-readable across international universities, HR evaluation platforms (e.g. WES), and global verifiers without custom AIT parsers.

### 3. 🧩 Semantic Inheritance & Dual-Contexts (Global vs. National)
- **Rule**: If a national government (e.g., Thailand MHESI / DGA) mandates custom domestic fields, **NEVER** replace the global `schema.org` base. Always use **Dual-Contexts / Semantic Inheritance**:
  ```json
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://schema.org",
    "https://schema.mhesi.go.th/v1",
    "https://id.ait.ac.th/vdr/schemas/transcript/v1.jsonld"
  ]
  ```
- **Why**: Global verifiers read standard `schema.org` claims and safely ignore unrecognized national keys (preserving international student mobility). Domestic verifiers validate both the global claims and the mandatory national curriculum codes.

### 4. ⚖️ Decouple Interoperability from Trust
- **Rule**: Always treat **Interoperability** (Syntax & Semantics) and **Trust** (Governance & Policy) as two distinct layers:
  - **Interoperability**: Handled by open schemas (`schema.org`) and wire protocols (OIDC4VP / SD-JWT).
  - **Trust**: Handled by Trust Anchors and **OpenID Federation 1.0**.
  - **Boundary**: It is the **Issuer's responsibility** to adhere to international standards. If a third-party verifier fails to parse a standard schema, that is a **verifier defect**, not an issuer failure.

### 5. 👥 Multiple Roles Must Be Separate VCs
- **Rule**: If an individual holds multiple roles (e.g. a person who is both a Graduate Student and a Research Staff member), **NEVER combine them into a single hybrid card**.
- **Why**: Roles have separate issuing authorities (Registrar vs. HR), different expiration lifecycles (graduation vs. contract termination), and require strict adherence to the Principle of Least Privilege.

### 6. 👤 Enforce the Tiered Account Model
- **Rule**: Always adhere to the two-tier account architecture:
  - **Tier 1 (Temporary Guest)**:
    - Mobile-only (Web clients cannot create guest accounts).
    - Auto-purged after **30 days** of inactivity.
    - Displays data loss warning modal on claiming any credential.
    - **STRICT POLICY GUARD: Never allow claiming Person Identification Data (PID)**.
  - **Tier 2 (Permanent Registered)**:
    - Multi-platform (iOS, Android, Desktop Web).
    - Upgraded via pluggable IdPs (Google OAuth, Apple ID, Microsoft Entra ID, Keycloak SSO).
    - PID issuance unlocked; zero-knowledge E2EE backup enabled.
    - Retention policy: Purged after **6 months** of continuous inactivity.

### 7. 📱 Thin Client + Thick BFF Boundary
- **Rule**: Do **NOT** implement complex registry scrapers, heavy cryptographic status bitstring decompression, or direct multi-VDR federation engines on the mobile client.
- **Why**: Offload registry aggregation, status polling, and schema caching to the **BFF (Inji Mimoto)**. The mobile app must remain a lean, fast, battery-efficient client focused on UI, local encrypted storage, and hardware keypair signing.

### 8. 🏷️ Precision in Ecosystem Terminology
- **Rule**: Maintain strict adherence to official terminology:
  - **India**: Refer to national identity via **DigiLocker / Aadhaar / UIDAI** (do *not* label it "MOSIP National ID").
  - **Thailand**: Refer to the national ecosystem via **Thailand Trust Framework / MHESI / DGA** (do *not* use "ETDA").
  - **MOSIP Inji**: The underlying open-source framework for mobile and BFF components.
  - **Neutrality**: Keep card designs neutral; avoid platform lock-in labels (e.g. do not brand cards exclusively as "Apple Enclave" on cross-platform views).

---

## 🗺️ 3. Repository Map & Key References

When looking for specific context, consult these authoritative documents:

| Topic | File Path |
| :--- | :--- |
| **Global Standards, Transcripts, VDRs & Dual-Contexts** | [docs/GLOBAL_STANDARDS_AND_REGISTRIES.md](docs/GLOBAL_STANDARDS_AND_REGISTRIES.md) |
| **System Architecture, VDR Adapters & Client-Server Split** | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **Consolidated Use Cases (Digital ID, Transcripts, Guest Mode)**| [docs/USE_CASES.md](docs/USE_CASES.md) |
| **Conceptual Learning Guide, Triangle of Trust & Glossary** | [docs/LEARNING_GUIDE.md](docs/LEARNING_GUIDE.md) |
| **Project Vision, Roadmap & Governance Milestones** | [docs/VISION_AND_ROADMAP.md](docs/VISION_AND_ROADMAP.md) |
| **Development Workflow, Git Branching & Definition of Done** | [docs/WORKFLOW_AND_GUIDELINES.md](docs/WORKFLOW_AND_GUIDELINES.md) |
| **Design Tokens, Color Palettes & Card Dimensions** | [packages/branding/README.md](packages/branding/README.md) |
| **Mobile Client Structure (React Native / Inji Mobile)** | [apps/mobile/README.md](apps/mobile/README.md) |
| **Web Wallet Boundary & Desktop SSO Interfaces** | [apps/web/README.md](apps/web/README.md) |

---

## 🛠️ 4. AI Agent Workflow & Verification Protocol

When tasked with generating code or modifying existing files:

1. **Read First**: Always inspect the relevant `docs/` files to understand domain constraints before proposing architectural changes.
2. **Preserve Documentation Integrity**: Do not revert architectural decisions, re-introduce deleted folders (`docs/credentials/`, `packages/schemas/`), or break cross-document alignment.
3. **Validate Code Changes**:
   - Check for strict TypeScript compliance.
   - Ensure native mobile code respects iOS Secure Enclave and Android KeyStore abstractions.
   - Verify that UI components consume tokens from `packages/branding`.
4. **Follow Git & Commit Conventions**:
   - Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
   - Write clear, concise, user-facing change summaries.

---

## 🛡️ 5. Project Scope Boundaries & Tooling Invariants

### A. Digital Issuance vs. Manual Operations
- **In-Scope**: Digital credential issuance software, schema design (`schema.org` + dual-contexts), automated eligibility evaluation via SIS/SOMSIS APIs, and administrative issuance/revocation dashboards.
- **Out-of-Scope**: Manual physical scanning of paper archives, data entry of historical paper transcripts, and retroactive database data cleansing. AIT administrative departments are the authoritative owners responsible for cleaning and certifying their data in SIS.

### B. Headless Chrome PDF Compilation
- When converting Markdown documents to PDF on macOS environments, use the zero-dependency pipeline via local Headless Google Chrome (`jobs/convert_to_pdf.py`).
- Maintain compact executive print styling (`8.5pt` body font, `line-height: 1.5`, `margin: 18mm`) to fit standard 4-section documents into exactly 2 pages.
