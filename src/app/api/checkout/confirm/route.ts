import { NextResponse } from "next/server";

import { claimQuote, quoteTotalDecimal, releaseQuote } from "@/lib/server/quotes";
import { publicCard, readSession } from "@/lib/server/session";
import { assertTestMode, stripe, stripeConfigured } from "@/lib/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Every failure the agent can observe is one of these fixed strings. Stripe's
 * own error text is logged server-side and never returned: PageControl hands
 * a tool's error message straight to the model, so anything put here becomes
 * model context.
 */
const FAILURES: Record<string, string> = {
  stripe_unconfigured: "Payments are not configured on this server.",
  bad_request: "The checkout request was malformed.",
  no_session: "No shopping session. Reload the page.",
  no_card: "No card is on file. Save a card before checking out.",
  quote_missing: "No approved quote was supplied.",
  quote_expired: "The approved quote expired. Ask for a fresh checkout.",
  quote_used: "That quote was already charged.",
  card_declined: "The card was declined. Nothing was charged.",
  authentication_required:
    "The bank asked the cardholder to authenticate. A human must finish this payment in the browser.",
  payment_failed: "The payment did not complete. Nothing was charged.",
};

function fail(code: keyof typeof FAILURES | string, status = 400) {
  return NextResponse.json(
    { ok: false, code, message: FAILURES[code] ?? FAILURES.payment_failed },
    { status },
  );
}

export async function POST(request: Request) {
  if (!stripeConfigured()) return fail("stripe_unconfigured", 503);

  let quoteId: unknown;
  try {
    ({ quoteId } = await request.json());
  } catch {
    return fail("bad_request");
  }

  const session = await readSession();
  if (!session) return fail("no_session", 401);
  if (!session.paymentMethodId || !session.stripeCustomerId) return fail("no_card", 402);

  const claim = claimQuote(quoteId, session.id);
  if (!claim.ok) return fail(claim.code);
  const { quote } = claim;

  try {
    assertTestMode();
    const intent = await stripe().paymentIntents.create(
      {
        amount: quote.amountMinor,
        currency: quote.currency,
        customer: session.stripeCustomerId,
        payment_method: session.paymentMethodId,
        // Merchant-initiated: the shopper approved in PageControl, then left
        // the flow. No redirect can be shown to an agent-driven checkout.
        off_session: true,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        description: `Northline Tech order (${quote.lines.length} line${quote.lines.length === 1 ? "" : "s"})`,
        metadata: {
          quote_id: quote.id,
          fingerprint: quote.fingerprint,
        },
      },
      // Agents retry. Make a retry a no-op rather than a second charge.
      { idempotencyKey: `pi:${quote.id}` },
    );

    if (intent.status !== "succeeded") {
      releaseQuote(quote.id);
      console.error("[checkout/confirm] unexpected status", intent.status);
      return fail("payment_failed", 402);
    }

    return NextResponse.json({
      ok: true,
      orderId: `NT-${quote.id.slice(2, 10).toUpperCase()}`,
      total: quoteTotalDecimal(quote),
      currency: quote.currency.toUpperCase(),
      card: publicCard(session),
      paymentIntentId: intent.id,
      lines: quote.lines.map((line) => ({ id: line.id, name: line.name, qty: line.qty })),
    });
  } catch (error) {
    const stripeError = error as {
      code?: string;
      type?: string;
      rawType?: string;
      message?: string;
    };
    // Log the real reason; return an opaque code.
    console.error("[checkout/confirm]", stripeError?.message ?? error);

    if (stripeError?.code === "authentication_required") {
      // Do not release: this quote needs a human-present retry, not a replay.
      return fail("authentication_required", 402);
    }
    releaseQuote(quote.id);
    if (stripeError?.rawType === "card_error" || stripeError?.type === "StripeCardError") {
      return fail("card_declined", 402);
    }
    return fail("payment_failed", 502);
  }
}
