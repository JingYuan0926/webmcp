import { NextResponse } from "next/server";

import { issueCheckoutGrant, requestOrigin } from "@/lib/server/pagecontrol-grants";
import { readQuote } from "@/lib/server/quotes";
import { readSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = requestOrigin(request);
  if (!origin) {
    return NextResponse.json(
      { ok: false, code: "wrong_origin", message: "The approval request came from another site." },
      { status: 403 },
    );
  }

  let quoteId: unknown;
  try {
    ({ quoteId } = await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "The approval request was malformed." },
      { status: 400 },
    );
  }

  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, code: "no_session", message: "No shopping session. Reload the page." },
      { status: 401 },
    );
  }
  const result = readQuote(quoteId, session.id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, message: "The approved quote is unavailable." },
      { status: 400 },
    );
  }

  const issued = await issueCheckoutGrant(origin, result.quote);
  if (!issued.ok) {
    return NextResponse.json(
      { ok: false, code: issued.code, message: "The approval proof service is unavailable." },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, grant: issued.token });
}
