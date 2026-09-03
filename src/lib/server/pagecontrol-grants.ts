import "server-only";

import { createHash, createPublicKey, verify } from "node:crypto";
import type { JsonWebKey as NodeJsonWebKey } from "node:crypto";

import type { Quote } from "@/lib/server/quotes";

type GrantClaims = {
  iss: string;
  aud: string;
  origin: string;
  tool: string;
  quoteId: string;
  amountMinor: number;
  sessionId: string;
  iat: number;
  exp: number;
  nonce: string;
  jti: string;
};

type PublicJwk = NodeJsonWebKey & { kid?: string; alg?: string };

const usedNonces = new Map<string, number>();
let publicKeyPromise: Promise<{ key: ReturnType<typeof createPublicKey>; kid: string }> | null = null;

function apiUrl(): string {
  return (process.env.PAGECONTROL_API_URL || "https://api.pagecontrol.app").replace(/\/$/, "");
}

function decodePart(value: string): unknown {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function sweepNonces(nowSeconds: number): void {
  for (const [nonce, expiresAt] of usedNonces) {
    if (expiresAt <= nowSeconds) usedNonces.delete(nonce);
  }
}

async function verificationKey(): Promise<{ key: ReturnType<typeof createPublicKey>; kid: string }> {
  if (!publicKeyPromise) {
    publicKeyPromise = fetch(`${apiUrl()}/.well-known/pagecontrol-key.json`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("public_key_unavailable");
        const jwk = (await response.json()) as PublicJwk;
        if (jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || jwk.alg !== "EdDSA" || !jwk.kid) {
          throw new Error("invalid_public_key");
        }
        return { key: createPublicKey({ key: jwk, format: "jwk" }), kid: jwk.kid };
      })
      .catch((error) => {
        publicKeyPromise = null;
        throw error;
      });
  }
  return publicKeyPromise;
}

/**
 * Grants bind to a digest of the quote id, not the id itself.
 *
 * A quote now carries its whole signed payload in its id, which runs past the
 * signing service's 256-character limit on that field. The digest is 1:1 with
 * the quote, so the binding is exactly as tight, and the deployed service
 * needs no change.
 */
function quoteRef(quoteId: string): string {
  return createHash("sha256").update(quoteId).digest("hex");
}

export function requestOrigin(request: Request): string | null {
  const expected = new URL(request.url).origin;
  return request.headers.get("origin") === expected ? expected : null;
}

export async function issueCheckoutGrant(
  origin: string,
  quote: Quote,
): Promise<{ ok: true; token: string } | { ok: false; code: string }> {
  const serviceToken = process.env.PAGECONTROL_SERVICE_TOKEN;
  if (!serviceToken) return { ok: false, code: "grant_not_configured" };

  try {
    const response = await fetch(`${apiUrl()}/grant`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${serviceToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        origin,
        tool: "checkout",
        quoteId: quoteRef(quote.id),
        amountMinor: quote.amountMinor,
        sessionId: quote.sessionId,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    const payload = (await response.json()) as { token?: unknown };
    if (!response.ok || typeof payload.token !== "string") {
      return { ok: false, code: "grant_unavailable" };
    }
    return { ok: true, token: payload.token };
  } catch {
    return { ok: false, code: "grant_unavailable" };
  }
}

export async function verifyAndConsumeCheckoutGrant(
  token: unknown,
  expected: { origin: string; quote: Quote },
): Promise<{ ok: true; claims: GrantClaims } | { ok: false; code: string }> {
  if (typeof token !== "string") return { ok: false, code: "grant_missing" };
  const [protectedHeader, payload, signature, extra] = token.split(".");
  if (!protectedHeader || !payload || !signature || extra) {
    return { ok: false, code: "grant_invalid" };
  }

  try {
    const header = decodePart(protectedHeader) as { alg?: unknown; kid?: unknown };
    const claims = decodePart(payload) as GrantClaims;
    const verification = await verificationKey();
    if (header.alg !== "EdDSA" || header.kid !== verification.kid) {
      return { ok: false, code: "grant_invalid" };
    }
    const signatureValid = verify(
      null,
      Buffer.from(`${protectedHeader}.${payload}`),
      verification.key,
      Buffer.from(signature, "base64url"),
    );
    if (!signatureValid) return { ok: false, code: "grant_invalid" };

    const nowSeconds = Math.floor(Date.now() / 1000);
    // The signing service and this app are separate deployments with separate
    // clocks. Five seconds of allowance was tight enough that ordinary drift
    // rejected valid grants; the 60-second expiry still bounds the window.
    const CLOCK_SKEW_SECONDS = 60;
    const failures: string[] = [];
    if (claims.iss !== apiUrl()) failures.push("iss");
    if (claims.aud !== expected.origin) failures.push("aud");
    if (claims.origin !== expected.origin) failures.push("origin");
    if (claims.tool !== "checkout") failures.push("tool");
    if (claims.quoteId !== quoteRef(expected.quote.id)) failures.push("quoteId");
    if (claims.amountMinor !== expected.quote.amountMinor) failures.push("amountMinor");
    if (claims.sessionId !== expected.quote.sessionId) failures.push("sessionId");
    if (!Number.isInteger(claims.iat) || claims.iat > nowSeconds + CLOCK_SKEW_SECONDS) {
      failures.push("iat");
    }
    if (!Number.isInteger(claims.exp) || claims.exp <= nowSeconds - CLOCK_SKEW_SECONDS) {
      failures.push("exp");
    }
    if (claims.exp - claims.iat > 60) failures.push("lifetime");
    if (typeof claims.nonce !== "string" || claims.nonce.length < 16) failures.push("nonce");
    if (typeof claims.jti !== "string" || claims.jti.length < 16) failures.push("jti");

    if (failures.length) {
      // Named in the server log only; the agent gets the opaque code.
      console.error("[grant] mismatched claims:", failures.join(","), {
        skewSeconds: claims.iat - nowSeconds,
      });
      return { ok: false, code: "grant_mismatch" };
    }

    sweepNonces(nowSeconds);
    if (usedNonces.has(claims.nonce)) return { ok: false, code: "grant_used" };
    usedNonces.set(claims.nonce, claims.exp);
    return { ok: true, claims };
  } catch {
    return { ok: false, code: "grant_invalid" };
  }
}
