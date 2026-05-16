import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  createSessionCookie,
  isAllowedEmail,
  verifyIdToken,
} from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { idToken?: string };
    if (!body.idToken) {
      return NextResponse.json(
        { error: "idToken is required" },
        { status: 400 },
      );
    }

    const decoded = await verifyIdToken(body.idToken);
    if (!decoded.emailVerified) {
      return NextResponse.json(
        { error: "email_not_verified" },
        { status: 403 },
      );
    }
    if (!isAllowedEmail(decoded.email)) {
      return NextResponse.json(
        { error: "domain_not_allowed" },
        { status: 403 },
      );
    }

    const cookieValue = await createSessionCookie(body.idToken);
    const res = NextResponse.json({ ok: true, email: decoded.email });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: cookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
