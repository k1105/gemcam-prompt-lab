"use client";

import { Icon } from "@iconify/react";
import styles from "./AppHeader.module.css";

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>G</span>
        <span>GEMCAM</span>
        <span className={styles.logoTag}>PROMPT LAB</span>
      </div>
    </header>
  );
}
