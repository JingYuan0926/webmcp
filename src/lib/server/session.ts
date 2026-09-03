import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type SavedCard = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export type Session = {
  id: string;
  stripeCustomerId: string | null;
  paymentMethodId: string | null;
  card: SavedCard | null;
  spentMinor: number;
  reservedMinor: number;
  budgetMinor: number;
};

const COOKIE = "nt_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * The session lives in the cookie itself, signed, rather than in a server-side
 * Map.
 *
 * On serverless each instance has its own memory, so a card saved by one
 * request was invisible to the next — the shopper saw "Visa ····4242" in the
 * panel while checkout failed with no_session. Carrying the state in a signed
 * cookie makes it survive whichever instance answers.
 *
 * The signature is what makes this safe: the browser holds the value but
 * cannot edit it, so it cannot invent a Stripe customer, attach someone else's
 * payment method, or reset its own spend. The cookie stays httpOnly, and the
 * card number is never part of it — only the brand, last four, and expiry.
 */
function signingSecret(): string {
  const secret =
    process.env.PAGECONTROL_SESSION_SECRET ||
    process.env.PAGECONTROL_SERVICE_TOKEN ||
    process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "No secret available to sign the session cookie. Set PAGECONTROL_SESSION_SECRET.",
    );
  }
  return secret;
}

function sign(body: string): string {
  return createHmac("sha256", signingSecret()).update(body).digest("base64url");
}

function encodeSession(session: Session): string {
  const body = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(value: string): Session | null {
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const provided = Buffer.from(value.slice(dot + 1));
  let expected: Buffer;
  try {
    expected = Buffer.from(sign(body));
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session;
    if (typeof parsed?.id !== "string" || !parsed.id) return null;
    return {
      id: parsed.id,
      stripeCustomerId: typeof parsed.stripeCustomerId === "string" ? parsed.stripeCustomerId : null,
      paymentMethodId: typeof parsed.paymentMethodId === "string" ? parsed.paymentMethodId : null,
      card: parsed.card && typeof parsed.card.last4 === "string" ? parsed.card : null,
      spentMinor: Number.isSafeInteger(parsed.spentMinor) ? parsed.spentMinor : 0,
      reservedMinor: Number.isSafeInteger(parsed.reservedMinor) ? parsed.reservedMinor : 0,
      budgetMinor: Number.isSafeInteger(parsed.budgetMinor) ? parsed.budgetMinor : sessionBudgetMinor(),
    };
  } catch {
    return null;
  }
}

function sessionBudgetMinor(): number {
  const configured = Number.parseInt(process.env.PAGECONTROL_SESSION_BUDGET_MINOR || "30000", 10);
  return Number.isSafeInteger(configured) && configured >= 0 ? configured : 30_000;
}

function blank(id: string): Session {
  return {
    id,
    stripeCustomerId: null,
    paymentMethodId: null,
    card: null,
    spentMinor: 0,
    reservedMinor: 0,
    budgetMinor: sessionBudgetMinor(),
  };
}

/** Writes the session back to its cookie. Call after any mutation. */
export async function persistSession(session: Session): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Reads the existing session without minting one. */
export async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  return value ? decodeSession(value) : null;
}

/**
 * Reads the session, creating one if needed. Only call from a route handler:
 * setting a cookie outside a request scope throws in Next.
 */
export async function requireSession(): Promise<Session> {
  const existing = await readSession();
  if (existing) return existing;
  const session = blank(randomUUID());
  // Persist immediately so the id is stable — quotes are bound to it.
  await persistSession(session);
  return session;
}

export function setCustomer(session: Session, customerId: string): void {
  session.stripeCustomerId = customerId;
}

export function saveCard(
  session: Session,
  customerId: string,
  paymentMethodId: string,
  card: SavedCard,
): void {
  session.stripeCustomerId = customerId;
  session.paymentMethodId = paymentMethodId;
  session.card = card;
}

export function forgetCard(session: Session): void {
  session.paymentMethodId = null;
  session.card = null;
}

/** Reserves spend synchronously so overlapping checkouts cannot race the cap. */
export function reserveSessionSpend(session: Session, amountMinor: number): boolean {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) return false;
  if (session.spentMinor + session.reservedMinor + amountMinor > session.budgetMinor) {
    return false;
  }
  session.reservedMinor += amountMinor;
  return true;
}

export function commitSessionSpend(session: Session, amountMinor: number): void {
  session.reservedMinor = Math.max(0, session.reservedMinor - amountMinor);
  session.spentMinor += amountMinor;
}

export function releaseSessionSpend(session: Session, amountMinor: number): void {
  session.reservedMinor = Math.max(0, session.reservedMinor - amountMinor);
}

/** The only shape of card data that is allowed to reach the browser. */
export function publicCard(session: Session): SavedCard | null {
  return session.card ? { ...session.card } : null;
}
