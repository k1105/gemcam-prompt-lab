import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "session";

// Routes that require an authenticated session.
// Edge proxy can only check cookie presence; deep verification is performed
// in API routes (Node runtime, firebase-admin).
const PROTECTED_PREFIXES = ["/projects"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname === "/" ||
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const hasSession = req.cookies.has(SESSION_COOKIE);
  if (hasSession) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Exclude API routes, Next internals, static files, share routes, and login.
    "/((?!api|_next|s/|login|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
