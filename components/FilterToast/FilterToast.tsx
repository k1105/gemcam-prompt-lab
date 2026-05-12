"use client";

import styles from "./FilterToast.module.css";

type Props = {
  name: string;
  triggerKey: number;
};

export function FilterToast({ name, triggerKey }: Props) {
  return (
    <div key={triggerKey} className={styles.toast}>
      <span className={styles.text}>{name}</span>
    </div>
  );
}
