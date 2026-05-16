import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "./firebase";

const ALLOWED_DOMAIN = "@dentsu.co.jp";
export const SESSION_COOKIE_NAME = "session";
// 14 days, Firebase max.
export const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

export type AuthedUser = {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
};

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
}

export async function createSessionCookie(idToken: string): Promise<string> {
  const auth = getAuth(getAdminApp());
  return auth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });
}

export async function verifyIdToken(idToken: string) {
  const auth = getAuth(getAdminApp());
  const decoded = await auth.verifyIdToken(idToken, true);
  if (!decoded.email) throw new Error("token has no email");
  return {
    uid: decoded.uid,
    email: decoded.email,
    emailVerified: !!decoded.email_verified,
    name: decoded.name,
    picture: decoded.picture,
  };
}

export async function getAuthedUser(): Promise<AuthedUser | null> {
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  try {
    const auth = getAuth(getAdminApp());
    const decoded = await auth.verifySessionCookie(cookie, true);
    if (!decoded.email || !decoded.email_verified) return null;
    if (!isAllowedEmail(decoded.email)) return null;
    return {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: true,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch {
    return null;
  }
}

export async function requireAuthedUser(): Promise<AuthedUser> {
  const user = await getAuthedUser();
  if (!user) {
    const err = new Error("unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return user;
}

// Returns either the authenticated user, or a 401 NextResponse for the caller
// to return directly.
export async function getAuthedUserOrResponse(): Promise<
  { user: AuthedUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getAuthedUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  return { user };
}
