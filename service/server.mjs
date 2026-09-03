import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
  sign,
  timingSafeEqual,
  verify,
} from "node:crypto";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const PORT = Number.parseInt(process.env.PORT || "8787", 10);
const ISSUER = process.env.PAGECONTROL_ISSUER || "https://api.pagecontrol.app";
const SERVICE_TOKEN = process.env.PAGECONTROL_SERVICE_TOKEN || "";
const MAX_BODY_BYTES = 32 * 1024;
const GRANT_TTL_SECONDS = 60;

function loadKeyPair() {
  const encodedPrivateKey = process.env.PAGECONTROL_PRIVATE_KEY;
  if (encodedPrivateKey) {
    const privateKey = createPrivateKey({
      key: Buffer.from(encodedPrivateKey, "base64"),
      format: "der",
      type: "pkcs8",
    });
    return { privateKey, publicKey: createPublicKey(privateKey), ephemeral: false };
  }
  const pair = generateKeyPairSync("ed25519");
  return { ...pair, ephemeral: true };
}

const keys = loadKeyPair();
const publicJwk = keys.publicKey.export({ format: "jwk" });
const keyId = createHash("sha256")
  .update(keys.publicKey.export({ format: "der", type: "spki" }))
  .digest("base64url")
  .slice(0, 16);

export const verificationKey = { ...publicJwk, use: "sig", alg: "EdDSA", kid: keyId };

function json(response, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
    ...headers,
  });
  response.end(body);
}

function allowedOrigin(origin) {
  if (typeof origin !== "string" || origin.length > 2048) return false;
  try {
    const url = new URL(origin);
    return url.origin === origin && (url.protocol === "https:" || url.hostname === "localhost");
  } catch {
    return false;
  }
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("body_too_large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function validGrantRequest(body) {
  return (
    body &&
    allowedOrigin(body.origin) &&
    typeof body.tool === "string" &&
    /^[a-zA-Z0-9_.:-]{1,128}$/.test(body.tool) &&
    typeof body.quoteId === "string" &&
    body.quoteId.length >= 3 &&
    body.quoteId.length <= 256 &&
    Number.isSafeInteger(body.amountMinor) &&
    body.amountMinor >= 0 &&
    typeof body.sessionId === "string" &&
    body.sessionId.length >= 8 &&
    body.sessionId.length <= 256
  );
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function issueGrant(body) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = { alg: "EdDSA", typ: "JWT", kid: keyId };
  const claims = {
    iss: ISSUER,
    aud: body.origin,
    origin: body.origin,
    tool: body.tool,
    quoteId: body.quoteId,
    amountMinor: body.amountMinor,
    sessionId: body.sessionId,
    iat: issuedAt,
    exp: issuedAt + GRANT_TTL_SECONDS,
    nonce: randomBytes(18).toString("base64url"),
    jti: randomBytes(18).toString("base64url"),
  };
  const protectedHeader = encodeJson(header);
  const payload = encodeJson(claims);
  const signingInput = `${protectedHeader}.${payload}`;
  const signature = sign(null, Buffer.from(signingInput), keys.privateKey).toString("base64url");
  return { token: `${signingInput}.${signature}`, protected: protectedHeader, grant: claims, signature };
}

export function inspectGrant(token) {
  if (typeof token !== "string") return { ok: false, code: "invalid_token" };
  const [protectedHeader, payload, signature, extra] = token.split(".");
  if (!protectedHeader || !payload || !signature || extra) return { ok: false, code: "invalid_token" };
  try {
    const header = JSON.parse(Buffer.from(protectedHeader, "base64url").toString("utf8"));
    const grant = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (header.alg !== "EdDSA" || header.kid !== keyId) return { ok: false, code: "invalid_header" };
    const valid = verify(
      null,
      Buffer.from(`${protectedHeader}.${payload}`),
      keys.publicKey,
      Buffer.from(signature, "base64url"),
    );
    if (!valid) return { ok: false, code: "invalid_signature" };
    if (!Number.isInteger(grant.exp) || grant.exp <= Math.floor(Date.now() / 1000)) {
      return { ok: false, code: "expired" };
    }
    return { ok: true, grant };
  } catch {
    return { ok: false, code: "invalid_token" };
  }
}

function bearerToken(request) {
  const authorization = request.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function validServiceToken(request) {
  const supplied = Buffer.from(bearerToken(request));
  const expected = Buffer.from(SERVICE_TOKEN);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function createPageControlServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (request.method === "GET" && url.pathname === "/health") {
      json(response, 200, { ok: true, service: "pagecontrol-signing", version: "1.0.0", keyId });
      return;
    }

    if (request.method === "GET" && url.pathname === "/.well-known/pagecontrol-key.json") {
      json(
        response,
        200,
        verificationKey,
        { "access-control-allow-origin": "*", "cache-control": "public, max-age=300" },
      );
      return;
    }

    if (request.method === "POST" && url.pathname === "/grant") {
      if (!SERVICE_TOKEN) {
        json(response, 503, { ok: false, code: "not_configured", message: "The signing service token is not configured." });
        return;
      }
      if (!validServiceToken(request)) {
        json(response, 401, { ok: false, code: "unauthorized", message: "A valid server credential is required." });
        return;
      }
      try {
        const body = await readJson(request);
        if (!validGrantRequest(body)) {
          json(response, 400, { ok: false, code: "invalid_request", message: "The approval grant fields are invalid." });
          return;
        }
        json(response, 201, { ok: true, ...issueGrant(body) });
      } catch (error) {
        const tooLarge = error instanceof Error && error.message === "body_too_large";
        json(response, tooLarge ? 413 : 400, {
          ok: false,
          code: tooLarge ? "body_too_large" : "invalid_json",
          message: tooLarge ? "The request body is too large." : "The request body is not valid JSON.",
        });
      }
      return;
    }

    if (request.method === "POST" && url.pathname === "/verify") {
      try {
        const body = await readJson(request);
        const result = inspectGrant(body.token);
        json(response, result.ok ? 200 : 400, result);
      } catch {
        json(response, 400, { ok: false, code: "invalid_json", message: "The request body is not valid JSON." });
      }
      return;
    }

    json(response, 404, { ok: false, code: "not_found", message: "No PageControl API route exists here." });
  });
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
  const server = createPageControlServer();
  server.listen(PORT, "0.0.0.0", () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : PORT;
    console.log(`PageControl signing service listening on ${port}`);
    if (keys.ephemeral) {
      console.warn("PAGECONTROL_PRIVATE_KEY is missing. This process is using an ephemeral development key.");
    }
  });
}
