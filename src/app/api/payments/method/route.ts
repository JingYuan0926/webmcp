import { NextResponse } from "next/server";

import { stripe, stripeConfigured } from "@/lib/server/stripe";
import {
  forgetCard,
  persistSession,
  publicCard,
  readSession,
  requireSession,
  saveCard,
} from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reports whether a card is on file. Brand and last four only — never a handle. */
export async function GET() {
  const session = await readSession();
  return NextResponse.json({
    ok: true,
    configured: stripeConfigured(),
    card: session ? publicCard(session) : null,
  });
}

/**
 * Finishes card setup. The browser sends only the SetupIntent id; the payment
 * method handle is read back from Stripe and kept server-side.
 */
export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { ok: false, code: "stripe_unconfigured", message: "Stripe keys are not set." },
      { status: 503 },
    );
  }

  let checkoutSessionId: unknown;
  try {
    ({ checkoutSessionId } = await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Malformed request." },
      { status: 400 },
    );
  }

  if (typeof checkoutSessionId !== "string" || !checkoutSessionId.startsWith("cs_")) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Missing checkout session." },
      { status: 400 },
    );
  }

  try {
    const session = await requireSession();
    const checkout = await stripe().checkout.sessions.retrieve(checkoutSessionId, {
      expand: ["setup_intent"],
    });

    // The session id travels back through the URL bar, so bind it to this
    // browser session before trusting it.
    const checkoutCustomer =
      typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id;
    if (!checkoutCustomer || checkoutCustomer !== session.stripeCustomerId) {
      return NextResponse.json(
        { ok: false, code: "forbidden", message: "That setup belongs to another session." },
        { status: 403 },
      );
    }

    const intent =
      checkout.setup_intent && typeof checkout.setup_intent !== "string"
        ? checkout.setup_intent
        : null;
    if (!intent || intent.status !== "succeeded") {
      return NextResponse.json(
        { ok: false, code: "setup_incomplete", message: "Card setup did not complete." },
        { status: 400 },
      );
    }

    const paymentMethodId =
      typeof intent.payment_method === "string"
        ? intent.payment_method
        : intent.payment_method?.id;
    if (!paymentMethodId) {
      return NextResponse.json(
        { ok: false, code: "setup_incomplete", message: "No card was attached." },
        { status: 400 },
      );
    }

    const method = await stripe().paymentMethods.retrieve(paymentMethodId);
    if (!method.card) {
      return NextResponse.json(
        { ok: false, code: "unsupported_method", message: "Only cards are supported." },
        { status: 400 },
      );
    }

    saveCard(session, session.stripeCustomerId!, paymentMethodId, {
      brand: method.card.brand,
      last4: method.card.last4,
      expMonth: method.card.exp_month,
      expYear: method.card.exp_year,
    });

    await persistSession(session);
    return NextResponse.json({ ok: true, card: publicCard(session) });
  } catch (error) {
    console.error("[payments/method]", error);
    return NextResponse.json(
      { ok: false, code: "setup_failed", message: "Could not save the card." },
      { status: 500 },
    );
  }
}

/** Forgets the card without deleting the Stripe customer. */
export async function DELETE() {
  const session = await readSession();
  if (session) {
    forgetCard(session);
    await persistSession(session);
  }
  return NextResponse.json({ ok: true, card: null });
}
