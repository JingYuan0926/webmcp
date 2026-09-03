import "server-only";

import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * The Stripe secret key never leaves the server. Card details never reach it
 * either: the browser posts them straight to Stripe from inside the Elements
 * iframe, and this process only ever handles the resulting `pm_...` handle.
 *
 * The API version is deliberately omitted so the account default applies.
 */
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set. Copy .env.example to .env.local.");
  }
  if (!client) client = new Stripe(key);
  return client;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * True when a live secret key is configured without an explicit opt-in. This
 * demo charges cards on an agent's say-so, so a live key is refused by
 * default: a mistake here spends real money.
 */
export function liveKeyBlocked(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_live_") && process.env.ALLOW_LIVE_STRIPE_KEY !== "1";
}

export const LIVE_KEY_MESSAGE =
  "This is a live Stripe key, so nothing ran. Swap it for a test key (sk_test_… and " +
  "pk_test_…) from the Stripe dashboard's Test mode, then restart the dev server.";
