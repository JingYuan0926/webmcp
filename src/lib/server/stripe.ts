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

/** Guards against a live key in a demo that intentionally charges cards. */
export function assertTestMode(): void {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (key.startsWith("sk_live_") && process.env.ALLOW_LIVE_STRIPE_KEY !== "1") {
    throw new Error(
      "Refusing to run against a live Stripe key. Use a sk_test_ key, or set ALLOW_LIVE_STRIPE_KEY=1.",
    );
  }
}
