import { NextResponse } from "next/server";

import { forgetCard, persistSession, requireSession, setCustomer } from "@/lib/server/session";
import {
  LIVE_KEY_MESSAGE,
  liveKeyBlocked,
  stripe,
  stripeConfigured,
} from "@/lib/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens a Stripe-hosted card setup page. The shopper leaves for
 * checkout.stripe.com, enters the card there, and comes back with only a
 * session id — card details never touch this origin at all.
 */
export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { ok: false, code: "stripe_unconfigured", message: "Stripe keys are not set." },
      { status: 503 },
    );
  }
  if (liveKeyBlocked()) {
    return NextResponse.json(
      { ok: false, code: "live_key_blocked", message: LIVE_KEY_MESSAGE },
      { status: 403 },
    );
  }

  try {
    const session = await requireSession();

    // A customer saved under a previous Stripe key does not exist under the
    // current one, and Stripe then refuses the whole setup. Check first, and
    // start a fresh customer rather than failing every card setup for anyone
    // who visited before the key changed.
    let customerId = session.stripeCustomerId;
    if (customerId) {
      try {
        const existing = await stripe().customers.retrieve(customerId);
        if ((existing as { deleted?: boolean }).deleted) customerId = null;
      } catch {
        customerId = null;
      }
      if (!customerId) forgetCard(session);
    }

    if (!customerId) {
      customerId = (
        await stripe().customers.create({
          metadata: { app: "northline-tech", session: session.id },
        })
      ).id;
      setCustomer(session, customerId);
      await persistSession(session);
    }

    const origin = new URL(request.url).origin;
    const checkout = await stripe().checkout.sessions.create({
      mode: "setup",
      currency: "usd",
      customer: customerId,
      payment_method_types: ["card"],
      success_url: `${origin}/?card_setup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?card_setup=cancelled`,
    });

    if (!checkout.url) {
      return NextResponse.json(
        { ok: false, code: "setup_failed", message: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, url: checkout.url });
  } catch (error) {
    console.error("[payments/checkout-session]", error);
    return NextResponse.json(
      { ok: false, code: "setup_failed", message: "Could not open Stripe card setup." },
      { status: 500 },
    );
  }
}
