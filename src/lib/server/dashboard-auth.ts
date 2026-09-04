import "server-only";

import { DEMO_DASHBOARD_PASSWORD, DEMO_DASHBOARD_USERNAME } from "@/lib/demo-credentials";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const DASHBOARD_SESSION_COOKIE = "pagecontrol_dashboard_session";
export const DASHBOARD_KEYS_COOKIE = "pagecontrol_dashboard_keys";

const SESSION_TTL_SECONDS = 4 * 60 * 60;

export type DashboardKeys = {
  publishable: string;
  secret: string;
  publishableRotatedAt: string;
  secretRotatedAt: string;
  sessionId: string;
};

type DashboardSession = {
  sub: string;
  sessionId: string;
  expiresAt: number;
};

function previewSecret(): string {
  return process.env.PAGECONTROL_DASHBOARD_SESSION_SECRET || "pagecontrol-preview-session-only";
}

function encode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function equal(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(payload: string): string {
  return createHmac("sha256", previewSecret()).update(payload).digest("base64url");
}

export function dashboardCredentialsMatch(username: unknown, password: unknown): boolean {
  if (typeof username !== "string" || typeof password !== "string") return false;
  const expectedUsername =
    process.env.PAGECONTROL_DASHBOARD_USERNAME?.trim() || DEMO_DASHBOARD_USERNAME;
  const expectedPassword =
    process.env.PAGECONTROL_DASHBOARD_PASSWORD?.trim() || DEMO_DASHBOARD_PASSWORD;
  return equal(username, expectedUsername) && equal(password, expectedPassword);
}

export function createDashboardSession(username: string): string {
  const session: DashboardSession = {
    sub: username,
    sessionId: randomBytes(18).toString("base64url"),
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const payload = encode(JSON.stringify(session));
  return `${payload}.${signature(payload)}`;
}

export function readDashboardSession(token: string | undefined): DashboardSession | null {
  if (!token) return null;
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra || !equal(signature(payload), suppliedSignature)) return null;
  try {
    const parsed = JSON.parse(decode(payload).toString("utf8")) as DashboardSession;
    if (
      typeof parsed.sub !== "string" ||
      typeof parsed.sessionId !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function encryptionKey(): Buffer {
  return createHash("sha256").update(previewSecret()).digest();
}

export function sealDashboardKeys(keys: DashboardKeys): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(keys), "utf8"), cipher.final()]);
  return [encode(iv), encode(cipher.getAuthTag()), encode(ciphertext)].join(".");
}

export function openDashboardKeys(value: string | undefined, sessionId: string): DashboardKeys | null {
  if (!value) return null;
  const [encodedIv, encodedTag, encodedCiphertext, extra] = value.split(".");
  if (!encodedIv || !encodedTag || !encodedCiphertext || extra) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), decode(encodedIv));
    decipher.setAuthTag(decode(encodedTag));
    const plaintext = Buffer.concat([
      decipher.update(decode(encodedCiphertext)),
      decipher.final(),
    ]).toString("utf8");
    const keys = JSON.parse(plaintext) as DashboardKeys;
    if (keys.sessionId !== sessionId) return null;
    return keys;
  } catch {
    return null;
  }
}

function makeKey(prefix: "pk_demo" | "sk_demo"): string {
  return `${prefix}_${randomBytes(24).toString("base64url")}`;
}

export function createDashboardKeys(sessionId: string): DashboardKeys {
  const now = new Date().toISOString();
  return {
    publishable: makeKey("pk_demo"),
    secret: makeKey("sk_demo"),
    publishableRotatedAt: now,
    secretRotatedAt: now,
    sessionId,
  };
}

export function rotateDashboardKey(
  keys: DashboardKeys,
  kind: "publishable" | "secret",
): DashboardKeys {
  const now = new Date().toISOString();
  return kind === "publishable"
    ? { ...keys, publishable: makeKey("pk_demo"), publishableRotatedAt: now }
    : { ...keys, secret: makeKey("sk_demo"), secretRotatedAt: now };
}

export function dashboardCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    priority: "high" as const,
  };
}

export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}
