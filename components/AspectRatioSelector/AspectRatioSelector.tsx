"use client";

import { ASPECT_RATIOS, type AspectRatio } from "@/lib/camera";
import styles from "./AspectRatioSelector.module.css";

type Props = {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
};

export function AspectRatioSelector({ value, onChange }: Props) {
  return (
    <div className={styles.bar}>
      <span className={styles.label}>ASPECT</span>
      {ASPECT_RATIOS.map((ratio) => (
        <button
          key={ratio}
          className={`${styles.option} ${
            ratio === value ? styles.optionActive : ""
          }`}
          onClick={() => onChange(ratio)}
        >
          {ratio}
        </button>
      ))}
    </div>
  );
}
