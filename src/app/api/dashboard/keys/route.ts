import { NextRequest, NextResponse } from "next/server";

import {
  createDashboardKeys,
  dashboardCookieOptions,
  DASHBOARD_KEYS_COOKIE,
  DASHBOARD_SESSION_COOKIE,
  isSameOriginMutation,
  openDashboardKeys,
  readDashboardSession,
  rotateDashboardKey,
  sealDashboardKeys,
} from "@/lib/server/dashboard-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authenticatedState(request: NextRequest) {
  const session = readDashboardSession(request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value);
  if (!session) return null;
  const keys =
    openDashboardKeys(request.cookies.get(DASHBOARD_KEYS_COOKIE)?.value, session.sessionId) ||
    createDashboardKeys(session.sessionId);
  return { session, keys };
}

function keyResponse(keys: ReturnType<typeof createDashboardKeys>) {
  return {
    ok: true,
    keys: {
      publishable: keys.publishable,
      secret: keys.secret,
      publishableRotatedAt: keys.publishableRotatedAt,
      secretRotatedAt: keys.secretRotatedAt,
    },
  };
}

export async function GET(request: NextRequest) {
  const state = authenticatedState(request);
  if (!state) {
    return NextResponse.json({ ok: false, message: "Sign in to manage merchant keys." }, { status: 401 });
  }
  const response = NextResponse.json(keyResponse(state.keys));
  response.cookies.set(DASHBOARD_KEYS_COOKIE, sealDashboardKeys(state.keys), dashboardCookieOptions());
  return response;
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ ok: false, message: "This rotation request came from another site." }, { status: 403 });
  }
  const state = authenticatedState(request);
  if (!state) {
    return NextResponse.json({ ok: false, message: "Your preview session expired. Sign in again." }, { status: 401 });
  }

  let kind: unknown;
  try {
    ({ kind } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, message: "Choose a key to rotate." }, { status: 400 });
  }
  if (kind !== "publishable" && kind !== "secret") {
    return NextResponse.json({ ok: false, message: "Choose a valid key to rotate." }, { status: 400 });
  }

  const keys = rotateDashboardKey(state.keys, kind);
  const response = NextResponse.json(keyResponse(keys));
  response.cookies.set(DASHBOARD_KEYS_COOKIE, sealDashboardKeys(keys), dashboardCookieOptions());
  return response;
}
