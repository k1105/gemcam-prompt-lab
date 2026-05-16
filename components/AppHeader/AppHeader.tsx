"use client";

import type { ReactNode } from "react";
import styles from "./AppHeader.module.css";

type Props = {
  title?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
};

export function AppHeader({ title, leftSlot, rightSlot }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {leftSlot}
        {title ? (
          <span className={styles.title}>{title}</span>
        ) : (
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
