"use client";

import type { ReactNode } from "react";
import styles from "./AppHeader.module.css";

type Props = {
  title?: string;
  // Project logo shown next to the title (replaces the default GEMCAM mark).
  logoUrl?: string | null;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
};

export function AppHeader({ title, logoUrl, leftSlot, rightSlot }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {leftSlot}
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.logoImg} src={logoUrl} alt="" />
        )}
        {title ? (
          <span className={styles.title}>{title}</span>
        ) : logoUrl ? null : (
          <div className={styles.logo}>
            <span className={styles.logoMark}>G</span>
            <span>GEMCAM</span>
            <span className={styles.logoTag}>PROMPT LAB</span>
          </div>
        )}
      </div>
      {rightSlot && <div className={styles.right}>{rightSlot}</div>}
    </header>
  );
}
