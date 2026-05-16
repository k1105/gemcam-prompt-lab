"use client";

import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider/AuthProvider";
import styles from "./UserMenu.module.css";

export function UserMenu() {
  const router = useRouter();
  const { user, logOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (!user) return null;

  const handleLogout = async () => {
    setOpen(false);
    await logOut();
    router.replace("/login");
  };

  const initial = (user.displayName || user.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        className={styles.avatarBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        type="button"
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="" className={styles.avatarImg} />
        ) : (
          <span className={styles.avatarText}>{initial}</span>
        )}
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.email}>{user.email}</div>
          <button
            className={styles.menuItem}
            onClick={handleLogout}
            role="menuitem"
            type="button"
          >
            <Icon icon="material-symbols:logout-rounded" width={16} />
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
