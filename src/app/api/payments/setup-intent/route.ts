import { NextResponse } from "next/server";

import {
  LIVE_KEY_MESSAGE,
  liveKeyBlocked,
  stripe,
  stripeConfigured,
} from "@/lib/server/stripe";
import { requireSession, setCustomer } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens a card-saving session. The returned client secret lets the Stripe
 * Elements iframe send card details straight to Stripe; they never transit
 * this process.
 */
export async function POST() {
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
    const customerId =
      session.stripeCustomerId ??
      (
        await stripe().customers.create({
          metadata: { app: "northline-tech", session: session.id },
        })
      ).id;

    if (!session.stripeCustomerId) setCustomer(session, customerId);

    const intent = await stripe().setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      // The shopper is present now; later charges are merchant-initiated.
      usage: "off_session",
      metadata: { app: "northline-tech" },
    });

    return NextResponse.json({ ok: true, clientSecret: intent.client_secret });
  } catch (error) {
    console.error("[setup-intent]", error);
    return NextResponse.json(
      { ok: false, code: "setup_failed", message: "Could not start card setup." },
      { status: 500 },
    );
  }
}
