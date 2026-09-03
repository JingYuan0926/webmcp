import assert from "node:assert/strict";
import { test } from "node:test";

process.env.PAGECONTROL_SERVICE_TOKEN = "test-service-token";

const {
  createPageControlServer,
  inspectGrant,
  issueGrant,
  parseAllowedOrigins,
  validGrantRequest,
  verificationKey,
} = await import("./server.mjs");

const grantRequest = {
  origin: "https://merchant.example",
  tool: "checkout",
  quoteId: "q_example",
  amountMinor: 30000,
  sessionId: "session_example",
};

async function requestGrant(allowedOrigins, body = grantRequest) {
  const server = createPageControlServer({ allowedOrigins });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    const address = server.address();
    assert.equal(typeof address, "object");
    const response = await fetch(`http://127.0.0.1:${address.port}/grant`, {
      method: "POST",
      headers: {
        authorization: "Bearer test-service-token",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return { response, payload: await response.json() };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("publishes an Ed25519 verification key", async () => {
  assert.equal(verificationKey.kty, "OKP");
  assert.equal(verificationKey.crv, "Ed25519");
  assert.equal(verificationKey.alg, "EdDSA");
});

test("issues and verifies a short-lived grant", async () => {
  assert.equal(validGrantRequest(grantRequest), true);
  const issued = issueGrant(grantRequest);
  assert.equal(issued.grant.amountMinor, 30000);
  assert.equal(issued.grant.exp - issued.grant.iat, 60);
  const verified = inspectGrant(issued.token);
  assert.equal(verified.ok, true);
  assert.equal(verified.grant.quoteId, "q_example");
});

test("issues a grant for an origin bound to the service token", async () => {
  const { response, payload } = await requestGrant(parseAllowedOrigins(" https://merchant.example "));
  assert.equal(response.status, 201);
  assert.equal(payload.ok, true);
  assert.equal(inspectGrant(payload.token).ok, true);
});

test("refuses a grant for an origin outside the token binding", async () => {
  const { response, payload } = await requestGrant(parseAllowedOrigins("https://other.example"));
  assert.equal(response.status, 403);
  assert.deepEqual(payload, { error: "origin_not_permitted" });
});

test("allows any valid origin when no binding is configured", async () => {
  const { response, payload } = await requestGrant(parseAllowedOrigins("  "));
  assert.equal(response.status, 201);
  assert.equal(payload.ok, true);
});

test("rejects a modified grant", () => {
  const issued = issueGrant(grantRequest);
  const parts = issued.token.split(".");
  parts[1] = Buffer.from(JSON.stringify({ changed: true })).toString("base64url");
  assert.equal(inspectGrant(parts.join(".")).ok, false);
});
