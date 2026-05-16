"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  buildGoogleProvider,
  getFirebaseAuth,
  isAllowedEmail,
} from "@/lib/firebase-client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  error: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setSigningIn(true);
    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithPopup(auth, buildGoogleProvider());
      const email = cred.user.email;
      if (!isAllowedEmail(email)) {
        await signOut(auth);
        setError("このアカウントではサインインできません。");
        return;
      }
      const idToken = await cred.user.getIdToken(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        await signOut(auth);
        const json = await res.json().catch(() => ({}));
        if (json.error === "domain_not_allowed") {
          setError("このアカウントではサインインできません。");
        } else if (json.error === "email_not_verified") {
          setError("メールアドレスが検証されていません。");
        } else {
          setError(json.error ?? "サインインに失敗しました。");
        }
      }
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (code === "auth/popup-closed-by-user") {
        // user closed the popup; not an error worth surfacing
        return;
      }
      setError(err instanceof Error ? err.message : "サインインに失敗しました。");
    } finally {
      setSigningIn(false);
    }
  }, []);

  const logOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signingIn,
      signInWithGoogle,
      logOut,
      error,
    }),
    [user, loading, signingIn, signInWithGoogle, logOut, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
