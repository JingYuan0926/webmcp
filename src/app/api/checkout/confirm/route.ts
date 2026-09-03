import { NextResponse } from "next/server";

import { requestOrigin, verifyAndConsumeCheckoutGrant } from "@/lib/server/pagecontrol-grants";
import { claimQuote, quoteTotalDecimal, releaseQuote } from "@/lib/server/quotes";
import {
  commitSessionSpend,
  persistSession,
  publicCard,
  readSession,
  releaseSessionSpend,
  reserveSessionSpend,
} from "@/lib/server/session";
import {
  LIVE_KEY_MESSAGE,
  liveKeyBlocked,
  stripe,
  stripeConfigured,
} from "@/lib/server/stripe";

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
  live_key_blocked: LIVE_KEY_MESSAGE,
  bad_request: "The checkout request was malformed.",
  no_session: "No shopping session. Reload the page.",
  no_card: "No card is on file. Save a card before checking out.",
  quote_missing: "No approved quote was supplied.",
  quote_expired: "The approved quote expired. Ask for a fresh checkout.",
  quote_used: "That quote was already charged.",
  wrong_origin: "The checkout request came from another site.",
  grant_missing: "A signed human approval is required before checkout.",
  grant_invalid: "The signed human approval is invalid.",
  grant_mismatch: "The signed approval does not match this exact order.",
  grant_used: "That signed approval was already used.",
  grant_unavailable: "The approval proof service is unavailable. Nothing was charged.",
  grant_origin_not_permitted:
    "This origin is not authorised to request approvals. Add it to PAGECONTROL_ALLOWED_ORIGINS on the signing service. Nothing was charged.",
  server_budget_exceeded: "This order exceeds the server-enforced session budget.",
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
  // Checked before the quote is claimed, so a blocked run does not burn it.
  if (liveKeyBlocked()) return fail("live_key_blocked", 403);

  const origin = requestOrigin(request);
  if (!origin) return fail("wrong_origin", 403);

  let quoteId: unknown;
  let grant: unknown;
  try {
    ({ quoteId, grant } = await request.json());
  } catch {
    return fail("bad_request");
  }

  const session = await readSession();
  if (!session) return fail("no_session", 401);
  if (!session.paymentMethodId || !session.stripeCustomerId) return fail("no_card", 402);

  const claim = claimQuote(quoteId, session.id);
  if (!claim.ok) return fail(claim.code);
  const { quote } = claim;

  const approval = await verifyAndConsumeCheckoutGrant(grant, { origin, quote });
  if (!approval.ok) {
    releaseQuote(quote.id);
    return fail(approval.code, approval.code === "grant_unavailable" ? 503 : 403);
  }
  if (!reserveSessionSpend(session, quote.amountMinor)) {
    releaseQuote(quote.id);
    return fail("server_budget_exceeded", 403);
  }

  try {
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
          // quote.id carries the whole signed payload and runs past Stripe's
          // field limits. quote.ref is a UUID and identifies the quote 1:1.
          quote_ref: quote.ref,
          fingerprint: quote.fingerprint,
        },
      },
      // Agents retry. Make a retry a no-op rather than a second charge.
      // Keyed on quote.ref: Stripe caps an idempotency key at 255 characters
      // and quote.id is far longer, which made every charge fail outright.
      { idempotencyKey: `pi:${quote.ref}` },
    );

    if (intent.status !== "succeeded") {
      releaseSessionSpend(session, quote.amountMinor);
      await persistSession(session);
      releaseQuote(quote.id);
      console.error("[checkout/confirm] unexpected status", intent.status);
      return fail("payment_failed", 402);
    }

    commitSessionSpend(session, quote.amountMinor);
    await persistSession(session);

    return NextResponse.json({
      ok: true,
      orderId: `NT-${quote.ref.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      total: quoteTotalDecimal(quote),
      currency: quote.currency.toUpperCase(),
      card: publicCard(session),
      paymentIntentId: intent.id,
      lines: quote.lines.map((line) => ({ id: line.id, name: line.name, qty: line.qty })),
    });
  } catch (error) {
    releaseSessionSpend(session, quote.amountMinor);
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
