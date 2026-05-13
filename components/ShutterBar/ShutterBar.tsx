"use client";

import { Icon } from "@iconify/react";
import styles from "./ShutterBar.module.css";

type Props = {
  onShutter: () => void;
  onFlipCamera: () => void;
  onImport: () => void;
  disabled?: boolean;
  flipDisabled?: boolean;
  importDisabled?: boolean;
};

export function ShutterBar({
  onShutter,
  onFlipCamera,
  onImport,
  disabled,
  flipDisabled,
  importDisabled,
}: Props) {
  return (
    <div className={styles.bar}>
      <button
        className={styles.iconBtn}
        onClick={onFlipCamera}
        disabled={flipDisabled}
        aria-label="Flip camera"
      >
        <Icon icon="material-symbols:cameraswitch-outline" width={22} />
      </button>
      <button
        className={styles.shutter}
        onClick={onShutter}
        disabled={disabled}
        aria-label="Take photo"
      />
      <button
        className={styles.iconBtn}
        onClick={onImport}
        disabled={importDisabled}
        aria-label="Import from album"
      >
        <Icon icon="material-symbols:photo-library-outline-rounded" width={22} />
      </button>
    </div>
  );
}
