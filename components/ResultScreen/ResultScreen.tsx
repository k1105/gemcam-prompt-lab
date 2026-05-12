"use client";

import { Icon } from "@iconify/react";
import styles from "./ResultScreen.module.css";

type Props = {
  imageDataUrl: string | null;
  filterName: string;
  error: string | null;
  onRetake: () => void;
  onClose: () => void;
};

export function ResultScreen({
  imageDataUrl,
  filterName,
  error,
  onRetake,
  onClose,
}: Props) {
  function download() {
    if (!imageDataUrl) return;
    const a = document.createElement("a");
    a.href = imageDataUrl;
    a.download = `gemcam-${Date.now()}.png`;
    a.click();
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>RESULT</span>
        <span className={styles.filterTag}>{filterName}</span>
      </div>
      {error ? (
        <div className={styles.error}>
          ERROR — {error}
        </div>
      ) : null}
      <div className={styles.imageWrap}>
        {imageDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageDataUrl} alt="generated" className={styles.image} />
        )}
      </div>
      <div className={styles.actions}>
        <button className="kodak-btn kodak-btn--ghost" onClick={onClose}>
          <Icon icon="material-symbols:close-rounded" width={18} />
          CLOSE
        </button>
        <button
          className="kodak-btn"
          onClick={download}
          disabled={!imageDataUrl}
        >
          <Icon icon="material-symbols:download-rounded" width={18} />
          SAVE
        </button>
        <button className="kodak-btn" onClick={onRetake}>
          <Icon icon="material-symbols:refresh-rounded" width={18} />
          AGAIN
        </button>
      </div>
    </div>
  );
}
