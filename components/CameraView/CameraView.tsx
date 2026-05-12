"use client";

import { forwardRef, useEffect, useState } from "react";
import {
  aspectRatioToNumber,
  startCamera,
  stopCamera,
  type AspectRatio,
  type FacingMode,
} from "@/lib/camera";
import styles from "./CameraView.module.css";

type Props = {
  facingMode: FacingMode;
  deviceId?: string | null;
  aspectRatio: AspectRatio;
  onCameraStart?: () => void;
};

export const CameraView = forwardRef<HTMLVideoElement, Props>(
  function CameraView({ facingMode, deviceId, aspectRatio, onCameraStart }, ref) {
    const [error, setError] = useState<string | null>(null);
    const [frameSize, setFrameSize] = useState<{ w: number; h: number } | null>(
      null,
    );

    useEffect(() => {
      const video = (ref as React.RefObject<HTMLVideoElement>).current;
      if (!video) return;
      let stream: MediaStream | null = null;
      let cancelled = false;

      (async () => {
        try {
          stream = await startCamera(video, deviceId, facingMode);
          if (cancelled && stream) stopCamera(stream, video);
          if (!cancelled && stream && onCameraStart) {
            onCameraStart();
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "カメラを起動できません";
          setError(message);
        }
      })();

      return () => {
        cancelled = true;
        if (stream) stopCamera(stream, video);
      };
    }, [facingMode, deviceId, ref, onCameraStart]);

    useEffect(() => {
      function recompute() {
        const stage = document.getElementById("camera-stage");
        if (!stage) return;
        const padding = 32;
        const availW = stage.clientWidth - padding;
        const availH = stage.clientHeight - padding;
        const ratio = aspectRatioToNumber(aspectRatio);
        let w = availW;
        let h = w / ratio;
        if (h > availH) {
          h = availH;
          w = h * ratio;
        }
        setFrameSize({ w, h });
      }
      recompute();
      window.addEventListener("resize", recompute);
      return () => window.removeEventListener("resize", recompute);
    }, [aspectRatio]);

    return (
      <div id="camera-stage" className={styles.stage}>
        {frameSize && (
          <div
            className={styles.frame}
            style={{ width: frameSize.w, height: frameSize.h }}
          >
            <video
              ref={ref}
              className={styles.video}
              playsInline
              muted
              autoPlay
            />
            <span className={`${styles.cornerMark} ${styles.tl}`} />
            <span className={`${styles.cornerMark} ${styles.tr}`} />
            <span className={`${styles.cornerMark} ${styles.bl}`} />
            <span className={`${styles.cornerMark} ${styles.br}`} />
          </div>
        )}
        {error && <div className={styles.errorBanner}>{error}</div>}
      </div>
    );
  },
);
