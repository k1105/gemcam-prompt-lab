"use client";

import styles from "./ProcessingScreen.module.css";

type Props = {
  imageDataUrl: string;
  filterName: string;
};

export function ProcessingScreen({ imageDataUrl, filterName }: Props) {
  return (
    <div className={styles.root}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageDataUrl} alt="captured" className={styles.preview} />
      <span className={styles.filterTag}>{filterName}</span>
      <div className={styles.spinner} />
      <span className={styles.label}>Generating…</span>
    </div>
  );
}
