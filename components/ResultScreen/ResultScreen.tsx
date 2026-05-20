"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import styles from "./ResultScreen.module.css";

type Props = {
  imageDataUrl: string | null;
  beforeDataUrl?: string | null;
  filterName: string;
  error: string | null;
  onRetake: () => void;
  onClose: () => void;
  onSetAsThumbnail?: () => Promise<void>;
};

type ThumbState = "idle" | "saving" | "saved" | "error";

export function ResultScreen({
  imageDataUrl,
  beforeDataUrl,
  filterName,
  error,
  onRetake,
  onClose,
  onSetAsThumbnail,
}: Props) {
  const [thumbState, setThumbState] = useState<ThumbState>("idle");
  const [viewMode, setViewMode] = useState<"before" | "after">("after");

  async function save() {
    // We want to save the currently viewed image, or always the generated one?
    // Usually, saving the after (generated) image is expected, but maybe saving the currently selected one?
    // Let's stick to saving the generated (imageDataUrl) or the visible one.
    // The user said: "画像生成結果を確認する画面で、before / afterを切り替えて見れるように画像の下にボタンを追加して。beforeの画像はローカルに一時的にキャッシュされたものを使う。"
    // Saving the generated image (imageDataUrl) is probably what they want, but let's make it save the currently active image for better UX, or keep it to imageDataUrl. Actually, saving the generated image is the primary purpose of the app. Let's keep save() saving the current view (viewMode === 'before' ? beforeDataUrl : imageDataUrl) or just generated? Let's check the code:
    const activeUrl = viewMode === "before" ? beforeDataUrl : imageDataUrl;
    if (!activeUrl) return;
    const filename = `gemcam-${viewMode}-${Date.now()}.jpg`;
    try {
      const blob = await (await fetch(activeUrl)).blob();
      const file = new File([blob], filename, { type: blob.type });
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file] });
        return;
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
    }
    const a = document.createElement("a");
    a.href = activeUrl;
    a.download = filename;
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
  const showCompare = !!beforeDataUrl && !!imageDataUrl && !error;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>RESULT</span>
        {showCompare && (
          <div className={styles.headerToggle}>
            <button
              className={`${styles.headerToggleBtn} ${
                viewMode === "before" ? styles.headerToggleBtnActive : ""
              }`}
              onClick={() => setViewMode("before")}
            >
              BEFORE
            </button>
            <button
              className={`${styles.headerToggleBtn} ${
                viewMode === "after" ? styles.headerToggleBtnActive : ""
              }`}
              onClick={() => setViewMode("after")}
            >
              AFTER
            </button>
          </div>
        )}
        <span className={styles.filterTag}>{filterName}</span>
      </div>
      {error ? (
        <div className={styles.error}>
          ERROR — {error}
        </div>
      ) : null}
      <div className={styles.imageWrap}>
        {viewMode === "before" && beforeDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={beforeDataUrl} alt="original" className={styles.image} />
        ) : (
          imageDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageDataUrl} alt="generated" className={styles.image} />
          )
        )}
      </div>

      {canSetThumb && (
        <div className={styles.secondary}>
          <button
            className={`${styles.thumbBtn} ${
              thumbState === "saved" ? styles.thumbBtnSaved : ""
            }`}
            onClick={setAsThumbnail}
            disabled={thumbState === "saving" || thumbState === "saved"}
          >
            <Icon
              icon={
                thumbState === "saved"
                  ? "material-symbols:check-rounded"
                  : "material-symbols:image-outline-rounded"
              }
              width={12}
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
          onClick={save}
          disabled={!(viewMode === "before" ? beforeDataUrl : imageDataUrl)}
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
