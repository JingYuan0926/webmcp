import "server-only";

import { randomUUID } from "node:crypto";

import { catalog } from "@/lib/catalog";

export type QuoteLine = {
  id: string;
  name: string;
  qty: number;
  unitMinor: number;
  lineMinor: number;
};

export type Quote = {
  id: string;
  sessionId: string;
  lines: QuoteLine[];
  amountMinor: number;
  currency: string;
  /** Stable digest of the priced cart, so the client can detect drift. */
  fingerprint: string;
  expiresAt: number;
  claimed: boolean;
};

export type CartLineInput = { id: string; qty: number };

const QUOTE_TTL_MS = 5 * 60 * 1000;
const MAX_QTY_PER_LINE = 99;
const CURRENCY = "usd";

const quotes = new Map<string, Quote>();

/** Prices are authored as decimals; money is only ever compared in minor units. */
function toMinor(price: number): number {
  return Math.round(price * 100);
}

export function fingerprintFor(lines: Array<{ id: string; qty: number }>): string {
  return lines
    .map((line) => `${line.id}:${line.qty}`)
    .sort()
    .join("|");
}

function sweep(): void {
  const now = Date.now();
  for (const [id, quote] of quotes) {
    if (quote.expiresAt <= now) quotes.delete(id);
  }
}

/**
 * Re-prices the cart from the server's own catalog. The client's idea of the
 * total is never trusted — only the product ids and quantities are taken from
 * it, and even those are validated against the catalog.
 */
export function createQuote(
  sessionId: string,
  input: unknown,
): { ok: true; quote: Quote } | { ok: false; message: string } {
  sweep();

  if (!Array.isArray(input) || !input.length) {
    return { ok: false, message: "The cart is empty." };
  }

  const seen = new Set<string>();
  const lines: QuoteLine[] = [];

  for (const raw of input as CartLineInput[]) {
    const id = typeof raw?.id === "string" ? raw.id : "";
    const qty = typeof raw?.qty === "number" ? raw.qty : Number.NaN;
    const product = catalog.find((entry) => entry.id === id);
    if (!product) return { ok: false, message: `Unknown product: ${id || "(missing id)"}.` };
    if (seen.has(id)) return { ok: false, message: `Duplicate cart line: ${id}.` };
    if (!Number.isInteger(qty) || qty <= 0 || qty > MAX_QTY_PER_LINE) {
      return { ok: false, message: `Invalid quantity for ${id}.` };
    }
    seen.add(id);
    const unitMinor = toMinor(product.price);
    lines.push({
      id,
      name: product.name,
      qty,
      unitMinor,
      lineMinor: unitMinor * qty,
    });
  }

  const amountMinor = lines.reduce((total, line) => total + line.lineMinor, 0);
  if (amountMinor <= 0) return { ok: false, message: "The cart total must be positive." };

  const quote: Quote = {
    id: `q_${randomUUID()}`,
    sessionId,
    lines,
    amountMinor,
    currency: CURRENCY,
    fingerprint: fingerprintFor(lines),
    expiresAt: Date.now() + QUOTE_TTL_MS,
    claimed: false,
  };
  quotes.set(quote.id, quote);
  return { ok: true, quote };
}

/**
 * Takes a quote for charging. Single-use and session-bound: a replayed or
 * borrowed quote id cannot move money twice.
 */
export function claimQuote(
  quoteId: unknown,
  sessionId: string,
): { ok: true; quote: Quote } | { ok: false; code: string; message: string } {
  sweep();
  if (typeof quoteId !== "string" || !quoteId) {
    return { ok: false, code: "quote_missing", message: "No approved quote was supplied." };
  }
  const quote = quotes.get(quoteId);
  if (!quote) {
    return { ok: false, code: "quote_expired", message: "The approved quote expired. Try again." };
  }
  if (quote.sessionId !== sessionId) {
    return { ok: false, code: "quote_missing", message: "That quote belongs to another session." };
  }
  if (quote.claimed) {
    return { ok: false, code: "quote_used", message: "That quote was already charged." };
  }
  quote.claimed = true;
  return { ok: true, quote };
}

/** Releases a quote after a failed charge so the shopper can retry. */
export function releaseQuote(quoteId: string): void {
  const quote = quotes.get(quoteId);
  if (quote) quote.claimed = false;
}

export function quoteTotalDecimal(quote: Quote): number {
  return quote.amountMinor / 100;
}
