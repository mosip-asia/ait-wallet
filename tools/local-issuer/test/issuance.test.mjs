import test from "node:test";
import { RsaSignature2018 } from "../rsa-suite.mjs";
import assert from "node:assert/strict";
import https from "node:https";
import http from "node:http";
import { readFileSync } from "node:fs";
import { randomBytes, createHash, generateKeyPairSync } from "node:crypto";
import { SignJWT, importPKCS8 } from "jose";
import { createRequire } from "node:module";
import {
  ORIGIN,
  CLIENT,
  REDIRECT,
  CONFIG_ID,
  DID,
  PRE_AUTH_GRANT,
  documentLoader,
} from "../server.mjs";
const jsigs = createRequire(import.meta.url)("jsonld-signatures");
const state = new URL("../state/", import.meta.url);
const ca = readFileSync(new URL("ca.pem", state));
function request(path, { method = "GET", form, json, token } = {}) {
  const u = new URL(
    path,
    path.startsWith("http://") ? "http://localhost:8099" : ORIGIN
  );
  const data = form
    ? new URLSearchParams(form).toString()
    : json
    ? JSON.stringify(json)
    : undefined;
  return new Promise((resolve, reject) => {
    const req = (u.protocol === "https:" ? https : http).request(
      u,
      {
        method,
        ca,
        rejectUnauthorized: true,
        family: 4,
        headers: {
          ...(data
            ? {
                "content-type": form
                  ? "application/x-www-form-urlencoded"
                  : "application/json",
                "content-length": Buffer.byteLength(data),
              }
            : {}),
          ...(token ? { authorization: "Bearer " + token } : {}),
        },
      },
      (res) => {
        let text = "";
        res.on("data", (b) => (text += b));
        res.on("end", () => {
          let body;
          try {
            body = JSON.parse(text);
          } catch {
            body = text;
          }
          resolve({ status: res.statusCode, body, headers: res.headers });
        });
      }
    );
    req.on("error", reject);
    req.end(data);
  });
}
const pkce = () => randomBytes(48).toString("base64url");
const challenge = (v) => createHash("sha256").update(v).digest("base64url");
async function authorization(verifier = pkce()) {
  const q = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT,
    redirect_uri: REDIRECT,
    state: randomBytes(24).toString("base64url"),
    code_challenge: challenge(verifier),
    code_challenge_method: "S256",
    scope: "ait.local.student",
  });
  const page = await request("/authorize?" + q);
  assert.equal(page.status, 200);
  assert.ok(page.headers["content-security-policy"].includes(REDIRECT), "form policy must allow the exact registered native callback");
  const ticket = /name="ticket" value="([^"]+)"/.exec(page.body)[1];
  const wrong = await request("/authorize", {
    method: "POST",
    form: { ticket, approved: "false" },
  });
  assert.equal(wrong.status, 403);
  const login = await request("/authorize", {
    method: "POST",
    form: { ticket, approved: "true" },
  });
  assert.equal(login.status, 302);
  const callback = new URL(login.headers.location);
  assert.equal(callback.searchParams.get("state"), q.get("state"));
  return {
    code: callback.searchParams.get("code"),
    code_verifier: verifier,
    grant_type: "authorization_code",
    client_id: CLIENT,
    redirect_uri: REDIRECT,
  };
}
async function assertion(audience = ORIGIN + "/oauth/token", expires = "2m") {
  const key = await importPKCS8(
    readFileSync(new URL("client-key.pem", state), "utf8"),
    "RS256"
  );
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(CLIENT)
    .setSubject(CLIENT)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expires)
    .setJti(randomBytes(24).toString("hex"))
    .sign(key);
}
async function directToken(f, overrides = {}) {
  return request("/oauth/token", {
    method: "POST",
    form: {
      ...f,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: await assertion(),
      ...overrides,
    },
  });
}
test("discovery, TLS hostname validation and configured credential", async () => {
  const m = await request("/.well-known/openid-credential-issuer");
  assert.equal(m.body.credential_issuer, ORIGIN);
  assert.equal(
    m.body.credential_configurations_supported[CONFIG_ID].format,
    "ldp_vc"
  );
  const b = await request(
    "http://localhost:8099/v1/mimoto/issuers/AITRegistrar"
  );
  assert.equal(b.body.errors.length, 0);
  assert.equal(b.body.response.client_alias, "ait-wallet-mobile-client");
  const h = await request("http://localhost:8099/v1/mimoto/actuator/health");
  assert.equal(h.body.status, "UP");
});
test("PKCE, private_key_jwt audience/lifetime/replay, redirect and one-time code enforcement", async () => {
  assert.equal(
    (
      await request(
        "/authorize?" +
          new URLSearchParams({
            client_id: CLIENT,
            redirect_uri: REDIRECT,
            response_type: "code",
            state: "test-state",
          })
      )
    ).status,
    400
  );
  const f = await authorization();
  assert.equal(
    (
      await directToken(f, {
        client_assertion: await assertion("https://wrong.invalid"),
      })
    ).status,
    401
  );
  assert.equal(
    (
      await directToken(f, {
        client_assertion: await assertion(ORIGIN + "/oauth/token", "2h"),
      })
    ).status,
    401
  );
  assert.equal(
    (await directToken({ ...f, code_verifier: pkce() })).status,
    400
  );
  assert.equal(
    (await directToken({ ...f, redirect_uri: "https://wrong.invalid" })).status,
    400
  );
  const a = await assertion();
  assert.equal((await directToken(f, { client_assertion: a })).status, 200);
  assert.equal((await directToken(f, { client_assertion: a })).status, 401);
  assert.equal((await directToken(f)).status, 400);
});
test("real Mimoto token proxy, holder proof, RSA signature, signed identity and tamper rejection", async () => {
  const f = await authorization();
  const exchange = await request(
    "http://localhost:8099/v1/mimoto/get-token/AITRegistrar",
    { method: "POST", form: f }
  );
  assert.equal(exchange.status, 200, "Mimoto token proxy must succeed");
  const t = exchange.body.response || exchange.body;
  assert.equal(
    typeof t.access_token,
    "string",
    "proxy must return access token"
  );
  assert.equal(
    (
      await request("/credential", {
        method: "POST",
        token: t.access_token,
        json: { format: "ldp_vc" },
      })
    ).status,
    400
  );
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  const jwk = publicKey.export({ format: "jwk" });
  const proof = (nonce) =>
    new SignJWT({ nonce })
      .setProtectedHeader({ alg: "ES256", typ: "openid4vci-proof+jwt", jwk })
      .setIssuer(CLIENT)
      .setAudience(ORIGIN)
      .setIssuedAt()
      .setExpirationTime("2m")
      .sign(privateKey);
  assert.equal(
    (
      await request("/credential", {
        method: "POST",
        token: t.access_token,
        json: {
          format: "ldp_vc",
          proof: { proof_type: "jwt", jwt: await proof("wrong") },
        },
      })
    ).status,
    400
  );
  const jwt = await proof(t.c_nonce);
  const issued = await request("/credential", {
    method: "POST",
    token: t.access_token,
    json: {
      format: "ldp_vc",
      proof: { proof_type: "jwt", jwt },
      name: "Attacker Profile",
    },
  });
  assert.equal(issued.status, 200, "credential signing must succeed");
  const vc = issued.body.credential;
  assert.equal(vc.credentialSubject.name, "Nisha Gurung");
  assert.equal(vc.credentialSubject.identifier, "DEMO-2026-0002");
  assert.equal(
    vc.credentialSubject.id,
    "did:jwk:" + Buffer.from(JSON.stringify(jwk)).toString("base64url")
  );
  const options = {
    suite: new RsaSignature2018(),
    purpose: new jsigs.purposes.AssertionProofPurpose(),
    documentLoader,
    compactProof: false,
  };
  const verified = await jsigs.verify(vc, options);
  assert.equal(
    verified.verified,
    true,
    verified.results?.[0]?.error?.message || verified.error?.message
  );
  vc.credentialSubject.identifier = "TAMPERED";
  assert.equal((await jsigs.verify(vc, options)).verified, false);
  assert.equal(
    (
      await request("/credential", {
        method: "POST",
        token: t.access_token,
        json: { format: "ldp_vc", proof: { proof_type: "jwt", jwt } },
      })
    ).status,
    401
  );
  const did = await request("/.well-known/did.json");
  assert.equal(did.body.id, DID);
});

test("demo QR offer is short-lived and single-use, with holder-bound signed Nisha data and no password", async () => {
  const result = await request("/demo/credential-request", {method: "POST"});
  assert.equal(result.status, 200);
  assert.equal(result.body.fixture, true);
  assert.equal(result.body.fields.find(f => f.label === "Full name").value, "Nisha Gurung");
  assert.ok(result.body.expiresAt > Date.now() && result.body.expiresAt <= Date.now() + 300000);
  const offer = JSON.parse(new URL(result.body.offerUri).searchParams.get("credential_offer"));
  assert.equal(offer.credential_issuer, ORIGIN);
  const form = {grant_type: PRE_AUTH_GRANT, "pre-authorized_code": offer.grants[PRE_AUTH_GRANT]["pre-authorized_code"]};
  assert.equal((await request("/oauth/token", {method: "POST", form: {...form, "pre-authorized_code": "invalid"}})).status, 400);
  assert.equal((await request("/oauth/token", {method: "POST", form: {...form, client_id: "unregistered-client"}})).status, 401);
  const exchanged = await request("/oauth/token", {method: "POST", form});
  assert.equal(exchanged.status, 200);
  assert.equal((await request("/oauth/token", {method: "POST", form})).status, 400);
  const token = exchanged.body;
  assert.equal((await request("/credential", {method: "POST", token: token.access_token, json: {format: "ldp_vc"}})).status, 400);
  const {privateKey, publicKey} = generateKeyPairSync("ec", {namedCurve: "prime256v1"});
  const jwk = publicKey.export({format: "jwk"});
  // Anonymous pre-authorized offers have no client identifier in the holder proof.
  const proof = await new SignJWT({nonce: token.c_nonce})
    .setProtectedHeader({alg: "ES256", typ: "openid4vci-proof+jwt", jwk})
    .setAudience(ORIGIN).setIssuedAt().setExpirationTime("2m").sign(privateKey);
  const issued = await request("/credential", {method: "POST", token: token.access_token,
    json: {format: "ldp_vc", proof: {proof_type: "jwt", jwt: proof}, name: "Untrusted request name"}});
  assert.equal(issued.status, 200);
  const vc = issued.body.credential;
  assert.equal(vc.credentialSubject.name, "Nisha Gurung");
  assert.equal(vc.credentialSubject.identifier, "DEMO-2026-0002");
  assert.equal(vc.about.type, "Course");
  assert.equal(vc.about.name, result.body.fields.find(f => f.label === "Field of study").value);
  assert.equal(vc.credentialSubject.id, "did:jwk:" + Buffer.from(JSON.stringify(jwk)).toString("base64url"));
  const options = {suite: new RsaSignature2018(), purpose: new jsigs.purposes.AssertionProofPurpose(), documentLoader, compactProof: false};
  assert.equal((await jsigs.verify(vc, options)).verified, true);
  vc.credentialSubject.name = "Tampered name";
  assert.equal((await jsigs.verify(vc, options)).verified, false);
  assert.equal((await request("/credential", {method: "POST", token: token.access_token,
    json: {format: "ldp_vc", proof: {proof_type: "jwt", jwt: proof}}})).status, 401);
});
