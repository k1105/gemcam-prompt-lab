"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { AspectRatioSelector } from "@/components/AspectRatioSelector/AspectRatioSelector";
import { CameraView } from "@/components/CameraView/CameraView";
import { ProcessingScreen } from "@/components/ProcessingScreen/ProcessingScreen";
import { ResultScreen } from "@/components/ResultScreen/ResultScreen";
import { ShutterBar } from "@/components/ShutterBar/ShutterBar";
import {
  captureFrame,
  readFileAsCroppedDataUrl,
  type AspectRatio,
  type FacingMode,
} from "@/lib/camera";
import type { GenerateResponse } from "@/lib/types";
import styles from "./page.module.css";

type Phase = "camera" | "processing" | "result";

export type ShareFilter = {
  shareSlug: string;
  name: string;
  thumbnailUrl: string | null;
};

type Props = {
  slug: string;
  filter: ShareFilter;
};

export function ShareCameraClient({ slug, filter }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("camera");
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [cameraReady, setCameraReady] = useState(false);

  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const runGenerate = useCallback(
    async (dataUrl: string) => {
      setCapturedDataUrl(dataUrl);
      setResultDataUrl(null);
      setGenerateError(null);
      setPhase("processing");

      try {
        const res = await fetch(
          `/api/share/${encodeURIComponent(slug)}/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageDataUrl: dataUrl, aspectRatio }),
          },
        );
        const json = (await res.json()) as GenerateResponse;
        if (!json.ok) {
          setGenerateError(json.error);
        } else {
          setResultDataUrl(json.imageDataUrl);
        }
      } catch (err) {
        setGenerateError(err instanceof Error ? err.message : "request failed");
      } finally {
        setPhase("result");
      }
    },
    [aspectRatio, slug],
  );

  const handleShutter = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    for (let n = 3; n >= 1; n--) {
      setCountdown(n);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);

    const dataUrl = captureFrame(video, aspectRatio);
    await runGenerate(dataUrl);
  }, [aspectRatio, runGenerate]);

  const handleImportClick = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleImportChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const dataUrl = await readFileAsCroppedDataUrl(file, aspectRatio);
      await runGenerate(dataUrl);
    },
    [aspectRatio, runGenerate],
  );

  const handleRetake = useCallback(() => {
    setCapturedDataUrl(null);
    setResultDataUrl(null);
    setGenerateError(null);
    setPhase("camera");
  }, []);

  const updateVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vDevices = devices.filter(
        (d) => d.kind === "videoinput" && d.deviceId,
      );
      setVideoDevices(vDevices);
    } catch (err) {
      console.error("Failed to enumerate devices:", err);
    }
  }, []);

  useEffect(() => {
    if (phase === "camera") {
      navigator.mediaDevices.addEventListener(
        "devicechange",
        updateVideoDevices,
      );
      return () => {
        navigator.mediaDevices.removeEventListener(
          "devicechange",
          updateVideoDevices,
        );
      };
    }
  }, [phase, updateVideoDevices]);

  const handleCameraStart = useCallback(() => {
    setCameraReady(true);
    updateVideoDevices();
  }, [updateVideoDevices]);

  const handleFlipCamera = useCallback(() => {
    setCameraReady(false);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      setDeviceId(null);
      setFacingMode((m) => (m === "user" ? "environment" : "user"));
    } else {
      if (videoDevices.length > 1) {
        setDeviceId((current) => {
          const currentIndex = current
            ? videoDevices.findIndex((d) => d.deviceId === current)
            : 0;
          const nextIndex =
            (Math.max(0, currentIndex) + 1) % videoDevices.length;
          return videoDevices[nextIndex].deviceId;
        });
      } else {
        setFacingMode((m) => (m === "user" ? "environment" : "user"));
      }
    }
  }, [videoDevices]);

  return (
    <main className={styles.app}>
      <AppHeader title={filter.name} />
      {phase === "camera" && (
        <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
      )}
      <div className={styles.body}>
        {phase === "camera" && (
          <CameraView
            ref={videoRef}
            facingMode={facingMode}
            deviceId={deviceId}
            aspectRatio={aspectRatio}
            onCameraStart={handleCameraStart}
            countdown={countdown}
          />
        )}
        {phase === "processing" && capturedDataUrl && (
          <ProcessingScreen
            imageDataUrl={capturedDataUrl}
            filterName={filter.name}
          />
        )}
        {phase === "result" && (
          <ResultScreen
            imageDataUrl={resultDataUrl}
            filterName={filter.name}
            error={generateError}
            onRetake={handleRetake}
            onClose={handleRetake}
          />
        )}
      </div>
      {phase === "camera" && (
        <ShutterBar
          onShutter={handleShutter}
          onFlipCamera={handleFlipCamera}
          onImport={handleImportClick}
          disabled={phase !== "camera" || countdown != null}
          flipDisabled={!cameraReady || countdown != null}
          importDisabled={countdown != null}
        />
      )}
      <input
        ref={importInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleImportChange}
      />
    </main>
  );
}
