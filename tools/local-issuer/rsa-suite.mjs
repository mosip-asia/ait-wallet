// RsaSignature2018 wire adapter: maintained Digital Bazaar JWS/JSON-LD libraries
// perform canonicalization and detached JWS framing; Node/OpenSSL performs RSA-PSS.
import { JwsLinkedDataSignature } from "@digitalbazaar/jws-linked-data-signature";
import { verify, constants } from "node:crypto";
export class RsaSignature2018 extends JwsLinkedDataSignature {
  constructor({ signer } = {}) {
    super({
      type: "RsaSignature2018",
      alg: "PS256",
      signer,
      contextUrl: "https://www.w3.org/2018/credentials/v1",
      LDKeyClass: {
        from: async (key) => ({
          verifier: () => ({
            verify: ({ data, signature }) =>
              verify(
                "sha256",
                data,
                {
                  key: key.publicKeyPem,
                  padding: constants.RSA_PKCS1_PSS_PADDING,
                  saltLength: 32,
                },
                signature
              ),
          }),
        }),
      },
    });
    this.canonizeOptions = { algorithm: "URDNA2015" };
  }
  async getVerificationMethod({ proof, documentLoader }) {
    const id =
      typeof proof.verificationMethod === "string"
        ? proof.verificationMethod
        : proof.verificationMethod?.id;
    const { document } = await documentLoader(id);
    const key =
      document.id === id
        ? document
        : document.verificationMethod?.find((k) => k.id === id);
    if (
      !key ||
      key.type !== "RsaVerificationKey2018" ||
      !key.publicKeyPem ||
      key.revoked
    )
      throw Error("Invalid RSA verification method");
    return key;
  }
}
