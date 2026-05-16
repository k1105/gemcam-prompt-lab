"use client";

import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { useAuth } from "@/components/AuthProvider/AuthProvider";
import styles from "./page.module.css";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { user, loading, signingIn, signInWithGoogle, error } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, next, router]);

  return (
    <div className={styles.body}>
      <h1 className={styles.heading}>SIGN IN</h1>
      <p className={styles.lead}>
        Googleアカウントでサインインしてください。
      </p>
      <button
        className="kodak-btn"
        onClick={signInWithGoogle}
        disabled={signingIn || loading}
        type="button"
      >
        <Icon icon="logos:google-icon" width={18} />
        {signingIn ? "SIGNING IN…" : "SIGN IN WITH GOOGLE"}
      </button>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className={styles.app}>
      <AppHeader />
      <Suspense fallback={<div className={styles.body} />}>
        <LoginInner />
      </Suspense>
    </main>
  );
}
