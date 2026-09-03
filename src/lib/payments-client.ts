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
  | { ok: true; quoteId: string; total: number }
  | { ok: false; code: "no_quote" | "expired" | "cart_changed" };

let currentQuote: QuoteSnapshot | null = null;
let pinned: QuoteSnapshot | null = null;
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
export function pinQuote(lines: CartLine[]): number {
  const fingerprint = fingerprintFor(lines);
  if (
    currentQuote &&
    currentQuote.fingerprint === fingerprint &&
    currentQuote.expiresAt > Date.now()
  ) {
    pinned = currentQuote;
    return currentQuote.total;
  }
  pinned = null;
  return localTotal(lines);
}

/**
 * Consumes the pinned quote at execution time and re-checks it against the
 * live cart. If anything moved between the human's approval and this moment,
 * the charge is refused rather than silently repriced.
 */
export function takePinnedQuote(lines: CartLine[]): PinnedQuote {
  const pin = pinned;
  pinned = null;
  if (!pin) return { ok: false, code: "no_quote" };
  if (pin.expiresAt <= Date.now()) return { ok: false, code: "expired" };
  if (pin.fingerprint !== fingerprintFor(lines)) return { ok: false, code: "cart_changed" };
  return { ok: true, quoteId: pin.quoteId, total: pin.total };
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

async function approvalGrant(quoteId: string): Promise<string | null> {
  const response = await fetch("/api/checkout/grant", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ quoteId }),
  });
  const payload = await response.json();
  return response.ok && typeof payload?.grant === "string" ? payload.grant : null;
}

/** Charges a pinned quote only after the shop server obtains a signed grant. */
export async function chargeQuote(quoteId: string): Promise<ChargeResult> {
  const grant = await approvalGrant(quoteId);
  if (!grant) {
    return {
      ok: false,
      code: "grant_unavailable",
      message: "The approval proof service is unavailable. Nothing was charged.",
    };
  }
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
