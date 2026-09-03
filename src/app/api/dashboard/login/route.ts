import { NextResponse } from "next/server";

import {
  createDashboardKeys,
  createDashboardSession,
  dashboardCookieOptions,
  dashboardCredentialsMatch,
  DASHBOARD_KEYS_COOKIE,
  DASHBOARD_SESSION_COOKIE,
  isSameOriginMutation,
  readDashboardSession,
  sealDashboardKeys,
} from "@/lib/server/dashboard-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ ok: false, message: "This sign-in request came from another site." }, { status: 403 });
  }

  let username: unknown;
  let password: unknown;
  try {
    ({ username, password } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, message: "Enter your username and password." }, { status: 400 });
  }

  if (!dashboardCredentialsMatch(username, password)) {
    return NextResponse.json({ ok: false, message: "The username or password is incorrect." }, { status: 401 });
  }

  const token = createDashboardSession(String(username));
  const session = readDashboardSession(token);
  if (!session) {
    return NextResponse.json({ ok: false, message: "The preview session could not start." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  const options = dashboardCookieOptions();
  response.cookies.set(DASHBOARD_SESSION_COOKIE, token, options);
  response.cookies.set(
    DASHBOARD_KEYS_COOKIE,
    sealDashboardKeys(createDashboardKeys(session.sessionId)),
    options,
  );
  return response;
}
