import "server-only";

import { randomUUID } from "node:crypto";
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
 * A demo-scale session store. Everything that identifies the shopper's card
 * lives here, on the server, keyed by an httpOnly cookie: the `pm_...` handle
 * is never sent to the browser and so can never reach the agent.
 *
 * It is in-memory, so it resets when the dev server restarts. Swap for a real
 * store before this is anything but a demo.
 */
const sessions = new Map<string, Session>();

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

/** Reads the existing session without minting one. */
export async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  return sessions.get(id) ?? null;
}

/**
 * Reads the session, creating one if needed. Only call from a route handler:
 * setting a cookie outside a request scope throws in Next.
 */
export async function requireSession(): Promise<Session> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) {
    const found = sessions.get(existing);
    if (found) return found;
  }
  const id = randomUUID();
  const session = blank(id);
  sessions.set(id, session);
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return session;
}

export function setCustomer(session: Session, customerId: string): void {
  session.stripeCustomerId = customerId;
  sessions.set(session.id, session);
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
  sessions.set(session.id, session);
}

export function forgetCard(session: Session): void {
  session.paymentMethodId = null;
  session.card = null;
  sessions.set(session.id, session);
}

/** Reserves spend synchronously so overlapping checkouts cannot race the cap. */
export function reserveSessionSpend(session: Session, amountMinor: number): boolean {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) return false;
  if (session.spentMinor + session.reservedMinor + amountMinor > session.budgetMinor) {
    return false;
  }
  session.reservedMinor += amountMinor;
  sessions.set(session.id, session);
  return true;
}

export function commitSessionSpend(session: Session, amountMinor: number): void {
  session.reservedMinor = Math.max(0, session.reservedMinor - amountMinor);
  session.spentMinor += amountMinor;
  sessions.set(session.id, session);
}

export function releaseSessionSpend(session: Session, amountMinor: number): void {
  session.reservedMinor = Math.max(0, session.reservedMinor - amountMinor);
  sessions.set(session.id, session);
}

/** The only shape of card data that is allowed to reach the browser. */
export function publicCard(session: Session): SavedCard | null {
  return session.card ? { ...session.card } : null;
}
