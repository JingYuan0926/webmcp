import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

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
  /** Unique per quote. The signed id starts with a constant prefix, so this is
      what an order reference must be derived from. */
  ref: string;
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

/**
 * A quote is carried in its own id, signed, rather than held in a server Map.
 *
 * Pricing a cart, obtaining a grant, and charging are three separate requests,
 * and on serverless they can land on three different instances — a Map would
 * lose the quote between them. The signature is what keeps this safe: the id
 * round-trips through the browser, so it must not be forgeable.
 *
 * `claimed` below is a best-effort single-use guard that only works while one
 * instance stays warm. The real protection against a double charge is Stripe's
 * idempotency key on the quote id, which holds across instances.
 */
const claimed = new Set<string>();

function signingSecret(): string {
  // Trimmed, and trimmed identically in both signers: a pasted value carrying a
  // stray space would otherwise sign here and fail to verify there.
  const secret = (
    process.env.PAGECONTROL_SESSION_SECRET ||
    process.env.PAGECONTROL_SERVICE_TOKEN ||
    process.env.STRIPE_SECRET_KEY
  )?.trim();
  if (!secret) throw new Error("No secret available to sign quotes.");
  return secret;
}

type QuoteBody = {
  n: string;
  s: string;
  l: QuoteLine[];
  a: number;
  c: string;
  f: string;
  x: number;
};

function encodeQuoteId(body: QuoteBody): string {
  const payload = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  const sig = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `q_${payload}.${sig}`;
}

function decodeQuoteId(quoteId: string): Quote | null {
  if (!quoteId.startsWith("q_")) return null;
  const rest = quoteId.slice(2);
  const dot = rest.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = rest.slice(0, dot);
  const provided = Buffer.from(rest.slice(dot + 1));
  let expected: Buffer;
  try {
    expected = Buffer.from(createHmac("sha256", signingSecret()).update(payload).digest("base64url"));
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as QuoteBody;
    if (!Array.isArray(body?.l) || typeof body.s !== "string") return null;
    return {
      id: quoteId,
      ref: typeof body.n === "string" ? body.n : "",
      sessionId: body.s,
      lines: body.l,
      amountMinor: body.a,
      currency: body.c,
      fingerprint: body.f,
      expiresAt: body.x,
      claimed: false,
    };
  } catch {
    return null;
  }
}

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

/** Keeps the best-effort claim set from growing without bound. */
function sweep(): void {
  if (claimed.size > 500) claimed.clear();
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

  const expiresAt = Date.now() + QUOTE_TTL_MS;
  const fingerprint = fingerprintFor(lines);
  const ref = randomUUID();
  const id = encodeQuoteId({
    n: ref,
    s: sessionId,
    l: lines,
    a: amountMinor,
    c: CURRENCY,
    f: fingerprint,
    x: expiresAt,
  });
  return {
    ok: true,
    quote: { id, ref, sessionId, lines, amountMinor, currency: CURRENCY, fingerprint, expiresAt, claimed: false },
  };
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
  const quote = decodeQuoteId(quoteId);
  if (!quote) {
    return { ok: false, code: "quote_missing", message: "That quote is not valid." };
  }
  if (quote.expiresAt <= Date.now()) {
    return { ok: false, code: "quote_expired", message: "The approved quote expired. Try again." };
  }
  if (quote.sessionId !== sessionId) {
    return { ok: false, code: "quote_missing", message: "That quote belongs to another session." };
  }
  if (claimed.has(quoteId)) {
    return { ok: false, code: "quote_used", message: "That quote was already charged." };
  }
  claimed.add(quoteId);
  return { ok: true, quote };
}

/** Reads an unexpired, unclaimed quote without consuming it. */
export function readQuote(
  quoteId: unknown,
  sessionId: string,
): { ok: true; quote: Quote } | { ok: false; code: string } {
  sweep();
  if (typeof quoteId !== "string" || !quoteId) return { ok: false, code: "quote_missing" };
  const quote = decodeQuoteId(quoteId);
  if (!quote) return { ok: false, code: "quote_missing" };
  if (quote.expiresAt <= Date.now()) return { ok: false, code: "quote_expired" };
  if (quote.sessionId !== sessionId) return { ok: false, code: "quote_missing" };
  if (claimed.has(quoteId)) return { ok: false, code: "quote_used" };
  return { ok: true, quote };
}

/** Releases a quote after a failed charge so the shopper can retry. */
export function releaseQuote(quoteId: string): void {
  claimed.delete(quoteId);
}

export function quoteTotalDecimal(quote: Quote): number {
  return quote.amountMinor / 100;
}
