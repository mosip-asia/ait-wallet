# AIT Local Development Issuer (`tools/local-issuer`)

An isolated, standards-compliant OIDC4VCI mock issuer and OAuth 2.0 authorization server simulating the **AIT Registrar** for local offline testing.

---

## 🎯 Purpose

This fixture allows developers to test end-to-end credential issuance into the **Inji Mobile Wallet** without external network access or live university IdP connections.

It implements:
* **OIDC4VCI**: Discovery (`/.well-known/openid-credential-issuer`), token endpoint (`/oauth/token`), and credential issuance (`/credential`).
* **Format**: W3C JSON-LD Verifiable Credentials (`ldp_vc`) signed via `RsaSignature2018` (RSA-PSS).
* **Claims**: Standard [`schema.org/EducationalOccupationalCredential`](https://schema.org/EducationalOccupationalCredential) academic claims.
* **Holder Binding**: Cryptographically binds the credential to the mobile wallet's public key (`did:jwk:...`).

---

## 🚀 Quick Usage

To start this mock server alongside the Inji Mimoto BFF:

```bash
cd ../../apps/bff
./scripts/start-local-issuer.sh
```

### Running Standalone Unit / Integration Tests
```bash
npm install
npm test
```

### Mock Test Account Credentials
* **Username**: `student`
* **Password**: `student-local-password`
* **Issued Credential Subject**: Nisha Gurung (`DEMO-2026-0002`)

---

## 📖 Detailed Documentation

For full architecture details, local CA installation on iOS/Android emulators, and Mimoto integration:
👉 **[Local Development Mock Issuer & Testing Guide](../../docs/LOCAL_DEVELOPMENT_ISSUER.md)**

