"use client";

import { Icon } from "@iconify/react";
import styles from "./ShutterBar.module.css";

type Props = {
  onShutter: () => void;
  onFlipCamera: () => void;
  disabled?: boolean;
};

export function ShutterBar({ onShutter, onFlipCamera, disabled }: Props) {
  return (
    <div className={styles.bar}>
      <button
        className={styles.iconBtn}
        onClick={onFlipCamera}
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
      <span className={styles.spacer} />
    </div>
  );
}
