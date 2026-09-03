import { NextResponse } from "next/server";

import {
  DASHBOARD_KEYS_COOKIE,
  DASHBOARD_SESSION_COOKIE,
  isSameOriginMutation,
} from "@/lib/server/dashboard-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ ok: false, message: "This sign-out request came from another site." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(DASHBOARD_SESSION_COOKIE);
  response.cookies.delete(DASHBOARD_KEYS_COOKIE);
  return response;
}
