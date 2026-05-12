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
          // iOS Safari releases the camera hardware asynchronously after track.stop().
          // A short delay lets the previous stream fully release before re-acquiring,
          // preventing NotReadableError / black-screen on rapid facingMode flips.
          await new Promise((r) => setTimeout(r, 80));
          if (cancelled) return;

          stream = await startCamera(deviceId, facingMode);
          if (cancelled) {
            stopCamera(stream);
            return;
          }
          video.srcObject = stream;
          await video.play();

          if (onCameraStart) {
            onCameraStart();
          }
        } catch (err) {
          if (!cancelled) {
            const message =
              err instanceof Error ? err.message : "カメラを起動できません";
            setError(message);
          }
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
        <div
          className={styles.frame}
          style={
            frameSize
              ? { width: frameSize.w, height: frameSize.h }
              : { width: "100%", height: "100%", visibility: "hidden" }
          }
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
        {error && <div className={styles.errorBanner}>{error}</div>}
      </div>
    );
  },
);
