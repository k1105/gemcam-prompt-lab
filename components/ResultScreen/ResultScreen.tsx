"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import styles from "./ResultScreen.module.css";

type Props = {
  imageDataUrl: string | null;
  filterName: string;
  error: string | null;
  onRetake: () => void;
  onClose: () => void;
  onSetAsThumbnail?: () => Promise<void>;
};

type ThumbState = "idle" | "saving" | "saved" | "error";

export function ResultScreen({
  imageDataUrl,
  filterName,
  error,
  onRetake,
  onClose,
  onSetAsThumbnail,
}: Props) {
  const [thumbState, setThumbState] = useState<ThumbState>("idle");

  function download() {
    if (!imageDataUrl) return;
    const a = document.createElement("a");
    a.href = imageDataUrl;
    a.download = `gemcam-${Date.now()}.png`;
    a.click();
  }

  async function setAsThumbnail() {
    if (!onSetAsThumbnail || !imageDataUrl) return;
    setThumbState("saving");
    try {
      await onSetAsThumbnail();
      setThumbState("saved");
    } catch {
      setThumbState("error");
    }
  }

  const canSetThumb = !!imageDataUrl && !error && !!onSetAsThumbnail;

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
      {canSetThumb && (
        <div className={styles.secondary}>
          <button
            className="kodak-btn kodak-btn--ghost"
            onClick={setAsThumbnail}
            disabled={thumbState === "saving" || thumbState === "saved"}
          >
            <Icon
              icon={
                thumbState === "saved"
                  ? "material-symbols:check-rounded"
                  : "material-symbols:image-outline-rounded"
              }
              width={18}
            />
            {thumbState === "saving"
              ? "SAVING…"
              : thumbState === "saved"
              ? "SET AS THUMBNAIL"
              : thumbState === "error"
              ? "FAILED — RETRY"
              : "USE AS THUMBNAIL"}
          </button>
        </div>
      )}
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
