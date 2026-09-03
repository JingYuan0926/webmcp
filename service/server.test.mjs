import assert from "node:assert/strict";
import { test } from "node:test";

process.env.PAGECONTROL_SERVICE_TOKEN = "test-service-token";

const { inspectGrant, issueGrant, validGrantRequest, verificationKey } = await import("./server.mjs");

test("publishes an Ed25519 verification key", async () => {
  assert.equal(verificationKey.kty, "OKP");
  assert.equal(verificationKey.crv, "Ed25519");
  assert.equal(verificationKey.alg, "EdDSA");
});

test("issues and verifies a short-lived grant", async () => {
  const request = {
    origin: "https://merchant.example",
    tool: "checkout",
    quoteId: "q_example",
    amountMinor: 30000,
    sessionId: "session_example",
  };
  assert.equal(validGrantRequest(request), true);
  const issued = issueGrant(request);
  assert.equal(issued.grant.amountMinor, 30000);
  assert.equal(issued.grant.exp - issued.grant.iat, 60);
  const verified = inspectGrant(issued.token);
  assert.equal(verified.ok, true);
  assert.equal(verified.grant.quoteId, "q_example");
});

test("rejects a modified grant", () => {
  const issued = issueGrant({
    origin: "https://merchant.example",
    tool: "checkout",
    quoteId: "q_example",
    amountMinor: 30000,
    sessionId: "session_example",
  });
  const parts = issued.token.split(".");
  parts[1] = Buffer.from(JSON.stringify({ changed: true })).toString("base64url");
  assert.equal(inspectGrant(parts.join(".")).ok, false);
});
