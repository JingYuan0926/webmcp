"use client";

import { catalog } from "@/lib/catalog";

export type CartLine = { id: string; qty: number };

export type SavedCard = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export type QuoteSnapshot = {
  quoteId: string;
  amountMinor: number;
  total: number;
  currency: string;
  fingerprint: string;
  expiresAt: number;
};

export type PinnedQuote =
  | { ok: true; quoteId: string; amountMinor: number; total: number }
  | { ok: false; code: "no_quote" | "expired" | "cart_changed" | "amount_changed" };

let currentQuote: QuoteSnapshot | null = null;
const pinnedByCall = new Map<string, QuoteSnapshot>();
let card: SavedCard | null = null;
let cardLoaded = false;
const listeners = new Set<() => void>();

function announce(): void {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Mirrors the server's digest so drift is detectable on either side. */
export function fingerprintFor(lines: CartLine[]): string {
  return lines
    .map((line) => `${line.id}:${line.qty}`)
    .sort()
    .join("|");
}

function localTotal(lines: CartLine[]): number {
  return lines.reduce((total, line) => {
    const product = catalog.find((entry) => entry.id === line.id);
    return product ? total + Math.round(product.price * 100) * line.qty : total;
  }, 0) / 100;
}

export function savedCard(): SavedCard | null {
  return card ? { ...card } : null;
}

export function hasCard(): boolean {
  return card !== null;
}

export function cardIsLoaded(): boolean {
  return cardLoaded;
}

function setCard(next: SavedCard | null): void {
  card = next;
  cardLoaded = true;
  announce();
}

export function rememberCard(next: SavedCard | null): void {
  setCard(next);
}

export function currentQuoteSnapshot(): QuoteSnapshot | null {
  return currentQuote ? { ...currentQuote } : null;
}

/**
 * Asks the server to price the cart. Called whenever the cart changes, so a
 * fresh quote is standing by when the guard needs a cost synchronously.
 */
export async function refreshQuote(lines: CartLine[]): Promise<QuoteSnapshot | null> {
  if (!lines.length) {
    currentQuote = null;
    announce();
    return null;
  }
  try {
    const response = await fetch("/api/checkout/quote", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lines }),
    });
    const payload = await response.json();
    if (!payload?.ok) {
      currentQuote = null;
      announce();
      return null;
    }
    if (payload.card !== undefined) setCard(payload.card);
    currentQuote = {
      quoteId: payload.quoteId,
      amountMinor: payload.amountMinor,
      total: payload.total,
      currency: payload.currency,
      fingerprint: payload.fingerprint,
      expiresAt: payload.expiresAt,
    };
    announce();
    return currentQuote;
  } catch {
    currentQuote = null;
    announce();
    return null;
  }
}

/**
 * Runs inside the guard's synchronous `getCost` hook. It returns the amount the
 * human will see on the approval card and pins the exact quote behind it, so
 * the later charge cannot be for a different cart.
 *
 * Falls back to a locally computed total when no quote is ready — the caps and
 * budget still apply, and `takePinnedQuote` refuses the charge.
 */
export function pinQuote(lines: CartLine[], callId: string): number {
  const now = Date.now();
  for (const [id, quote] of pinnedByCall) {
    if (quote.expiresAt <= now) pinnedByCall.delete(id);
  }
  const fingerprint = fingerprintFor(lines);
  if (
    currentQuote &&
    currentQuote.fingerprint === fingerprint &&
    currentQuote.expiresAt > Date.now()
  ) {
    pinnedByCall.set(callId, currentQuote);
    return currentQuote.total;
  }
  pinnedByCall.delete(callId);
  return localTotal(lines);
}

/**
 * Consumes the pinned quote at execution time and re-checks it against the
 * live cart. If anything moved between the human's approval and this moment,
 * the charge is refused rather than silently repriced.
 */
export function takePinnedQuote(
  lines: CartLine[],
  callId: string,
  approvedCost: number | null,
): PinnedQuote {
  const pin = pinnedByCall.get(callId) ?? null;
  pinnedByCall.delete(callId);
  if (!pin) return { ok: false, code: "no_quote" };
  if (pin.expiresAt <= Date.now()) return { ok: false, code: "expired" };
  if (pin.fingerprint !== fingerprintFor(lines)) return { ok: false, code: "cart_changed" };
  if (approvedCost === null || Math.round(approvedCost * 100) !== pin.amountMinor) {
    return { ok: false, code: "amount_changed" };
  }
  return {
    ok: true,
    quoteId: pin.quoteId,
    amountMinor: pin.amountMinor,
    total: pin.total,
  };
}

export type ChargeResult =
  | {
      ok: true;
      orderId: string;
      total: number;
      currency: string;
      card: SavedCard | null;
      /** Stripe PaymentIntent id, for looking the charge up in the dashboard. */
      paymentIntentId: string;
    }
  | { ok: false; code: string; message: string };

/**
 * Every reason a grant can fail, phrased for the shopper and the agent. The
 * route distinguishes them; collapsing them into one sentence made a lost
 * session read as a service outage.
 */
const GRANT_ERRORS: Record<string, string> = {
  no_session: "This browser has no shopping session on the server. Reload the page and save your card again.",
  wrong_origin: "The approval request came from another site. Nothing was charged.",
  quote_missing: "No approved price was found for this cart. Start checkout again.",
  quote_expired: "The approved price expired. Start checkout again.",
  quote_used: "That approved price was already charged.",
  grant_unavailable: "The approval proof service is unavailable. Nothing was charged.",
  grant_origin_not_permitted:
    "This origin is not authorised to request approvals. Add it to PAGECONTROL_ALLOWED_ORIGINS on the signing service. Nothing was charged.",
  bad_request: "The approval request was malformed. Nothing was charged.",
};

async function approvalGrant(
  quoteId: string,
): Promise<{ ok: true; grant: string } | { ok: false; code: string; message: string }> {
  let payload: { ok?: boolean; grant?: unknown; code?: unknown } | null = null;
  try {
    const response = await fetch("/api/checkout/grant", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quoteId }),
    });
    payload = await response.json();
    if (response.ok && typeof payload?.grant === "string") {
      return { ok: true, grant: payload.grant };
    }
  } catch {
    return {
      ok: false,
      code: "grant_unreachable",
      message: "Could not reach the approval service. Nothing was charged.",
    };
  }
  const code = typeof payload?.code === "string" ? payload.code : "grant_unavailable";
  return { ok: false, code, message: GRANT_ERRORS[code] ?? GRANT_ERRORS.grant_unavailable };
}

/** Charges a pinned quote only after the shop server obtains a signed grant. */
export async function chargeQuote(quoteId: string): Promise<ChargeResult> {
  const approval = await approvalGrant(quoteId);
  if (!approval.ok) return approval;
  const grant = approval.grant;
  const response = await fetch("/api/checkout/confirm", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ quoteId, grant }),
  });
  const payload = await response.json();
  if (payload?.ok) {
    if (payload.card !== undefined) setCard(payload.card);
    return payload as ChargeResult;
  }
  return {
    ok: false,
    code: typeof payload?.code === "string" ? payload.code : "payment_failed",
    message:
      typeof payload?.message === "string"
        ? payload.message
        : "The payment did not complete. Nothing was charged.",
  };
}
