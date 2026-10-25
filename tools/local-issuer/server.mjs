/** Fictional, isolated development registrar. Never deploy as a production issuer. */
import https from "node:https";
import { readFileSync } from "node:fs";
import {
  createHash,
  createPublicKey,
  randomBytes,
  randomUUID,
  sign,
  constants,
  timingSafeEqual,
} from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { RsaSignature2018 } from "./rsa-suite.mjs";
import { decodeProtectedHeader, importJWK, jwtVerify } from "jose";
const require = createRequire(import.meta.url);
const jsigs = require("jsonld-signatures");
const contexts = new Map([
  ...require("credentials-context").contexts,
  ...require("security-context").contexts,
]);
export const ORIGIN = "https://localhost:8443";
export const CLIENT = "ait-wallet-mobile";
export const REDIRECT = "io.mosip.residentapp.inji://oauthredirect";
export const CONFIG_ID = "AITLocalStudent";
export const DID = "did:web:localhost%3A8443";
const stateDir =
  process.env.ISSUER_STATE_DIR ||
  fileURLToPath(new URL("./state", import.meta.url));
const pem = (name) => readFileSync(resolve(stateDir, name), "utf8");
const signingKey = pem("issuer-key.pem");
const clientJwk = JSON.parse(pem("client-public.jwk"));
const issuerPublicPem = createPublicKey(signingKey).export({
  type: "spki",
  format: "pem",
});
const issuerJwk = createPublicKey(signingKey).export({ format: "jwk" });
const method = {
  id: DID + "#issuer-key",
  type: "RsaVerificationKey2018",
  controller: DID,
  publicKeyPem: issuerPublicPem,
};
const didDocument = {
  "@context": "https://w3id.org/security/v2",
  id: DID,
  verificationMethod: [method],
  assertionMethod: [method.id],
};
const credentialContext = [
  "https://www.w3.org/2018/credentials/v1",
  { "@vocab": "https://schema.org/" },
];
const credentialTypes = [
  "VerifiableCredential",
  "https://schema.org/EducationalOccupationalCredential",
];
const display = [
  {
    name: "AIT Local Demo Student ID",
    locale: "en",
    language: "en",
    background_color: "#005c50",
    text_color: "#ffffff",
    logo: {
      uri: ORIGIN + "/assets/ait-demo-logo.svg",
      url: ORIGIN + "/assets/ait-demo-logo.svg",
      alt_text: "Fictional AIT Local Demo",
    },
  },
];
const claims = Object.fromEntries(
  ["name", "identifier", "affiliation"].map((k) => [
    k,
    {
      display: [
        {
          name: {
            name: "Name",
            identifier: "Student ID",
            affiliation: "Institution",
          }[k],
          locale: "en",
          language: "en",
        },
      ],
    },
  ])
);
// The fixture maps all academic attributes to schema.org; it defines no wallet schema.
export const metadata = {
  credential_issuer: ORIGIN,
  authorization_servers: [ORIGIN],
  credential_endpoint: ORIGIN + "/credential",
  display: [
    {
      name: "AIT Registrar — Local Demo",
      locale: "en",
      language: "en",
      logo: {
        url: ORIGIN + "/assets/ait-demo-logo.svg",
        uri: ORIGIN + "/assets/ait-demo-logo.svg",
      },
    },
  ],
  credential_configurations_supported: {
    [CONFIG_ID]: {
      format: "ldp_vc",
      scope: "ait.local.student",
      cryptographic_binding_methods_supported: ["jwk"],
      credential_signing_alg_values_supported: ["RsaSignature2018"],
      proof_types_supported: {
        jwt: {
          proof_signing_alg_values_supported: ["RS256", "ES256", "EdDSA"],
        },
      },
      display,
      credential_definition: {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: credentialTypes,
        credentialSubject: claims,
      },
    },
  },
};
export const authorizationMetadata = {
  issuer: ORIGIN,
  authorization_endpoint: ORIGIN + "/authorize",
  token_endpoint: ORIGIN + "/oauth/token",
  jwks_uri: ORIGIN + "/jwks",
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code"],
  scopes_supported: ["ait.local.student", "openid"],
  code_challenge_methods_supported: ["S256"],
  token_endpoint_auth_methods_supported: ["private_key_jwt"],
  token_endpoint_auth_signing_alg_values_supported: ["RS256"],
};
const tickets = new Map(),
  codes = new Map(),
  tokens = new Map(),
  usedAssertions = new Map();
const now = () => Math.floor(Date.now() / 1000);
const random = () => randomBytes(32).toString("base64url");
const hash = (x) => createHash("sha256").update(x).digest("base64url");
const counters = { login: 0, token: 0, credential: 0, rejected: 0 };
function fail(error, status = 400) {
  throw Object.assign(new Error(error), { status });
}
function check(ok, error = "invalid_request", status = 400) {
  if (!ok) fail(error, status);
}
function json(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(data));
}
const escaped = (x) =>
  String(x).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
const equal = (a, b) => {
  const x = Buffer.from(a || ""),
    y = Buffer.from(b || "");
  return x.length === y.length && timingSafeEqual(x, y);
};
async function body(req) {
  let text = "";
  for await (const data of req) {
    text += data;
    check(text.length <= 32768, "invalid_request", 413);
  }
  try {
    return req.headers["content-type"]?.includes("application/json")
      ? JSON.parse(text)
      : Object.fromEntries(new URLSearchParams(text));
  } catch {
    fail("invalid_request");
  }
}
export async function documentLoader(url) {
  const base = url.split("#")[0];
  const doc = contexts.get(base) || (base === DID ? didDocument : undefined);
  check(!!doc, "unknown_document");
  return { contextUrl: null, documentUrl: url, document: doc };
}
export async function issueCredential(holder) {
  const credential = {
    "@context": credentialContext,
    id: "urn:uuid:" + randomUUID(),
    type: credentialTypes,
    issuer: DID,
    issuanceDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 365 * 86400000).toISOString(),
    credentialSubject: {
      id: holder,
      type: "Person",
      name: "Nisha Gurung",
      givenName: "Nisha",
      familyName: "Gurung",
      identifier: "DEMO-2026-0002",
      // eduPersonAffiliation uses its registered OID, without a custom context.
      "urn:oid:1.3.6.1.4.1.5923.1.1.1.1": ["student"],
      affiliation: { type: "EducationalOrganization", name: "AIT Local Demo" },
      enrollment: "active",
    },
    // enrollment is a schema.org Enrollment/educational role via a full semantic IRI below.
    name: "AIT Local Demo Student ID",
    description: "Fictional local development student credential",
  };
  // Use only vocabulary-defined fields in the signed graph (no custom claim definitions).
  delete credential.credentialSubject.enrollment;
  credential.credentialSubject.memberOf = {
    type: "OrganizationRole",
    roleName: "student",
    description: "active enrollment",
    memberOf: { type: "EducationalOrganization", name: "AIT Local Demo" },
  };
  const signer = {
    id: method.id,
    sign: ({ data }) =>
      sign("sha256", Buffer.from(data), {
        key: signingKey,
        padding: constants.RSA_PKCS1_PSS_PADDING,
        saltLength: 32,
      }),
  };
  return jsigs.sign(credential, {
    suite: new RsaSignature2018({ signer }),
    purpose: new jsigs.purposes.AssertionProofPurpose(),
    documentLoader,
    compactProof: false,
  });
}
async function clientAuthentication(form) {
  check(
    form.client_assertion_type ===
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    "invalid_client",
    401
  );
  try {
    const { payload } = await jwtVerify(
      form.client_assertion,
      await importJWK(clientJwk, "RS256"),
      {
        algorithms: ["RS256"],
        issuer: CLIENT,
        subject: CLIENT,
        audience: ORIGIN + "/oauth/token",
        clockTolerance: 5,
        requiredClaims: ["iat", "exp", "jti"],
      }
    );
    check(
      payload.exp > payload.iat &&
        payload.exp - payload.iat <= 3600 &&
        Math.abs(now() - payload.iat) <= 60,
      "invalid_client",
      401
    );
    check(!usedAssertions.has(payload.jti), "invalid_client", 401);
    usedAssertions.set(payload.jti, payload.exp);
  } catch {
    fail("invalid_client", 401);
  }
}
async function handle(req, res) {
  const url = new URL(req.url, ORIGIN),
    path = url.pathname;
  if (req.method === "GET" && path === "/health")
    return json(res, 200, { status: "UP", fixture: true, events: counters });
  if (req.method === "GET" && path === "/.well-known/openid-credential-issuer")
    return json(res, 200, metadata);
  if (
    req.method === "GET" &&
    [
      "/.well-known/oauth-authorization-server",
      "/.well-known/openid-configuration",
    ].includes(path)
  )
    return json(res, 200, authorizationMetadata);
  if (req.method === "GET" && path === "/.well-known/did.json")
    return json(res, 200, didDocument);
  if (req.method === "GET" && path === "/jwks")
    return json(res, 200, {
      keys: [{ ...issuerJwk, kid: method.id, use: "sig", alg: "PS256" }],
    });
  if (req.method === "GET" && path === "/assets/ait-demo-logo.svg") {
    res.writeHead(200, { "content-type": "image/svg+xml" });
    return res.end(
      '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100"><rect width="240" height="100" rx="12" fill="#005c50"/><text x="120" y="42" text-anchor="middle" fill="white" font-family="sans-serif" font-size="24">AIT Local Demo</text><text x="120" y="73" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16">FICTIONAL ISSUER</text></svg>'
    );
  }
  if (req.method === "GET" && path === "/authorize") {
    const p = Object.fromEntries(url.searchParams);
    check(
      p.client_id === CLIENT &&
        p.redirect_uri === REDIRECT &&
        p.response_type === "code"
    );
    check(
      p.code_challenge_method === "S256" &&
        /^[A-Za-z0-9_-]{43}$/.test(p.code_challenge || ""),
      "invalid_request"
    );
    check(
      typeof p.state === "string" && p.state.length >= 8,
      "invalid_request"
    );
    if (p.scope)
      check(
        p.scope
          .split(" ")
          .every((x) => ["ait.local.student", "openid"].includes(x)),
        "invalid_scope"
      );
    const ticket = random();
    tickets.set(ticket, { ...p, exp: now() + 300, attempts: 0 });
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' io.mosip.residentapp.inji://oauthredirect; frame-ancestors 'none'; base-uri 'none'",
    });
    return res.end(
      `<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><title>AIT Local Demo login</title><style>body{font:18px system-ui;max-width:460px;margin:40px auto;padding:20px}input,button{display:block;font:inherit;padding:12px;margin:12px 0;width:90%}button{background:#005c50;color:white}</style><h1>AIT Registrar — Local Demo</h1><p>Fictional local test service.</p><form method="post" action="/authorize"><input type="hidden" name="ticket" value="${escaped(
        ticket
      )}"><label>Username<input name="username" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button>Sign in and issue student ID</button></form></html>`
    );
  }
  if (req.method === "POST" && path === "/authorize") {
    check(
      !req.headers.origin || req.headers.origin === ORIGIN,
      "invalid_request"
    );
    const f = await body(req),
      t = tickets.get(f.ticket);
    check(t && t.exp > now() && t.attempts++ < 5, "invalid_request");
    check(
      equal(f.username, "student") &&
        equal(f.password, "student-local-password"),
      "access_denied",
      403
    );
    tickets.delete(f.ticket);
    const code = random();
    codes.set(hash(code), { ...t, exp: now() + 90 });
    counters.login++;
    const callback = new URL(REDIRECT);
    callback.searchParams.set("code", code);
    callback.searchParams.set("state", t.state);
    res.writeHead(302, {
      location: callback.href,
      "cache-control": "no-store",
    });
    return res.end();
  }
  if (req.method === "POST" && path === "/oauth/token") {
    const f = await body(req);
    await clientAuthentication(f);
    check(f.grant_type === "authorization_code", "unsupported_grant_type");
    check(
      f.client_id === CLIENT && f.redirect_uri === REDIRECT,
      "invalid_grant"
    );
    const c = codes.get(hash(f.code || ""));
    check(c && c.exp > now(), "invalid_grant");
    check(
      /^[A-Za-z0-9._~-]{43,128}$/.test(f.code_verifier || "") &&
        equal(hash(f.code_verifier), c.code_challenge),
      "invalid_grant"
    );
    codes.delete(hash(f.code));
    const accessToken = random(),
      nonce = random();
    tokens.set(hash(accessToken), { nonce, exp: now() + 300, issued: false });
    counters.token++;
    return json(res, 200, {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 300,
      c_nonce: nonce,
      c_nonce_expires_in: 300,
      scope: "ait.local.student",
    });
  }
  if (req.method === "POST" && path === "/credential") {
    const token = tokens.get(
      hash((req.headers.authorization || "").replace(/^Bearer /, ""))
    );
    check(token && token.exp > now() && !token.issued, "invalid_token", 401);
    const f = await body(req);
    check(
      f.format === "ldp_vc" || f.credential_configuration_id === CONFIG_ID,
      "unsupported_credential_format"
    );
    if (f.credential_definition)
      check(
        JSON.stringify(f.credential_definition.type) ===
          JSON.stringify(credentialTypes),
        "unsupported_credential_type"
      );
    const proof = f.proof?.jwt || f.proofs?.jwt?.[0];
    check(typeof proof === "string", "invalid_proof");
    let jwk, header, payload;
    try {
      header = decodeProtectedHeader(proof);
      check(
        header.typ === "openid4vci-proof+jwt" && header.jwk && !header.kid,
        "invalid_proof"
      );
      jwk = header.jwk;
      check(
        !["d", "p", "q", "dp", "dq", "qi", "k"].some((k) => k in jwk),
        "invalid_proof"
      );
      ({ payload } = await jwtVerify(proof, await importJWK(jwk, header.alg), {
        algorithms: ["RS256", "ES256", "EdDSA"],
        audience: ORIGIN,
        issuer: CLIENT,
        requiredClaims: ["iat", "nonce"],
        clockTolerance: 5,
      }));
      check(
        Math.abs(now() - payload.iat) <= 120 &&
          equal(payload.nonce, token.nonce),
        "invalid_proof"
      );
    } catch {
      fail("invalid_proof");
    }
    // Single-use nonce and access token. The signed subject is the wallet's exact public proof key.
    token.issued = true;
    const holder =
      "did:jwk:" + Buffer.from(JSON.stringify(jwk)).toString("base64url");
    const credential = await issueCredential(holder);
    counters.credential++;
    console.log(
      JSON.stringify({
        event: "credential_issued",
        format: "ldp_vc",
        holderBinding: "proof-key",
        count: counters.credential,
      })
    );
    return json(res, 200, {
      format: "ldp_vc",
      credential,
      credentials: [{ credential }],
    });
  }
  fail("not_found", 404);
}
setInterval(() => {
  for (const map of [tickets, codes, tokens])
    for (const [k, v] of map) if (v.exp < now()) map.delete(k);
  for (const [k, v] of usedAssertions) if (v < now()) usedAssertions.delete(k);
}, 30000).unref();
export const server = https.createServer(
  { key: pem("tls-key.pem"), cert: pem("tls-cert.pem") },
  (req, res) => {
    handle(req, res).catch((e) => {
      counters.rejected++;
      if (!res.headersSent)
        json(res, e.status || 500, {
          error: e.status ? e.message : "server_error",
        });
      else res.end();
      if (!e.status)
        console.error(
          JSON.stringify({ event: "internal_error", type: e.name })
        );
    });
  }
);
if (process.argv[1] === fileURLToPath(import.meta.url))
  server.listen(8443, "0.0.0.0", () =>
    console.log(
      JSON.stringify({ event: "local_issuer_started", origin: ORIGIN })
    )
  );
