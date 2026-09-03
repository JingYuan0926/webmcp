import { NextResponse } from "next/server";

import { createQuote, quoteTotalDecimal } from "@/lib/server/quotes";
import { publicCard, requireSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Prices the cart on the server and returns a short-lived, single-use quote.
 *
 * This is what binds the amount a human approves to the amount that is later
 * charged: the guard pins a quote id at approval time, and the charge route
 * only ever charges the amount recorded inside that quote.
 */
export async function POST(request: Request) {
  let lines: unknown;
  try {
    ({ lines } = await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Malformed request." },
      { status: 400 },
    );
  }

  const session = await requireSession();
  const result = createQuote(session.id, lines);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: "invalid_cart", message: result.message },
      { status: 400 },
    );
  }

  const { quote } = result;
  return NextResponse.json({
    ok: true,
    quoteId: quote.id,
    amountMinor: quote.amountMinor,
    total: quoteTotalDecimal(quote),
    currency: quote.currency,
    fingerprint: quote.fingerprint,
    expiresAt: quote.expiresAt,
    card: publicCard(session),
    lines: quote.lines.map((line) => ({ id: line.id, name: line.name, qty: line.qty })),
  });
}
