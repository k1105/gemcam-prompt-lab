"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { AspectRatioSelector } from "@/components/AspectRatioSelector/AspectRatioSelector";
import { CameraView } from "@/components/CameraView/CameraView";
import { FilterCreateModal } from "@/components/FilterCreateModal/FilterCreateModal";
import { FilterStrip } from "@/components/FilterStrip/FilterStrip";
import { ProcessingScreen } from "@/components/ProcessingScreen/ProcessingScreen";
import { ResultScreen } from "@/components/ResultScreen/ResultScreen";
import { ShutterBar } from "@/components/ShutterBar/ShutterBar";
import {
  captureFrame,
  type AspectRatio,
  type FacingMode,
} from "@/lib/camera";
import type { GenerateResponse, PromptFilter } from "@/lib/types";
import styles from "./page.module.css";

type Phase = "camera" | "processing" | "result";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [phase, setPhase] = useState<Phase>("camera");
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [cameraReady, setCameraReady] = useState(false);

  const [filters, setFilters] = useState<PromptFilter[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);

  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const selectedFilter =
    filters.find((f) => f.id === selectedFilterId) ?? null;
  const filterToEdit =
    filters.find((f) => f.id === editingFilterId) ?? undefined;

  const loadFilters = useCallback(async () => {
    setFiltersLoading(true);
    try {
      const res = await fetch("/api/filters");
      const json = await res.json();
      if (Array.isArray(json.filters)) {
        setFilters(json.filters);
        setSelectedFilterId((prev) => {
          if (prev && json.filters.some((f: PromptFilter) => f.id === prev)) {
            return prev;
          }
          return json.filters[0]?.id ?? null;
        });
      }
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  const handleShutter = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !selectedFilter) return;
    const dataUrl = captureFrame(video, aspectRatio);
    setCapturedDataUrl(dataUrl);
    setResultDataUrl(null);
    setGenerateError(null);
    setPhase("processing");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: dataUrl,
          filterId: selectedFilter.id,
          aspectRatio,
        }),
      });
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
  }, [aspectRatio, selectedFilter]);

  const handleRetake = useCallback(() => {
    setCapturedDataUrl(null);
    setResultDataUrl(null);
    setGenerateError(null);
    setPhase("camera");
  }, []);

  const updateVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vDevices = devices.filter((d) => d.kind === "videoinput" && d.deviceId);
      setVideoDevices(vDevices);
      
      // If we don't have a deviceId set but we found devices, optionally set it to the active one.
      // However, it's fine to just let the initial startCamera use facingMode, 
      // and only switch deviceId when flipped.
    } catch (err) {
      console.error("Failed to enumerate devices:", err);
    }
  }, []);

  useEffect(() => {
    if (phase === "camera") {
      navigator.mediaDevices.addEventListener("devicechange", updateVideoDevices);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", updateVideoDevices);
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
      // On smartphones, cycling through all 5+ lenses is frustrating.
      // Toggling facingMode tells the OS to switch between front and back naturally.
      setDeviceId(null);
      setFacingMode((m) => (m === "user" ? "environment" : "user"));
    } else {
      // On desktop, facingMode is often ignored, so we cycle through available webcams.
      if (videoDevices.length > 1) {
        setDeviceId((current) => {
          const currentIndex = current
            ? videoDevices.findIndex((d) => d.deviceId === current)
            : 0;
          const nextIndex = (Math.max(0, currentIndex) + 1) % videoDevices.length;
          return videoDevices[nextIndex].deviceId;
        });
      } else {
        setFacingMode((m) => (m === "user" ? "environment" : "user"));
      }
    }
  }, [videoDevices]);

  const handleFilterCreated = useCallback((filter: PromptFilter) => {
    setFilters((prev) => [...prev, filter]);
    setSelectedFilterId(filter.id);
  }, []);

  const handleFilterUpdated = useCallback((filter: PromptFilter) => {
    setFilters((prev) => prev.map((f) => (f.id === filter.id ? filter : f)));
  }, []);

  const handleFilterDeleted = useCallback((id: string) => {
    setFilters((prev) => {
      const next = prev.filter((f) => f.id !== id);
      // Automatically select the first filter if the selected one was deleted
      setSelectedFilterId((selected) => {
        if (selected === id) return next[0]?.id ?? null;
        return selected;
      });
      return next;
    });
  }, []);

  return (
    <main className={styles.app}>
      <AppHeader />
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
          />
        )}
        {phase === "processing" && capturedDataUrl && (
          <ProcessingScreen
            imageDataUrl={capturedDataUrl}
            filterName={selectedFilter?.name ?? ""}
          />
        )}
        {phase === "result" && (
          <ResultScreen
            imageDataUrl={resultDataUrl}
            filterName={selectedFilter?.name ?? ""}
            error={generateError}
            onRetake={handleRetake}
            onClose={handleRetake}
          />
        )}
      </div>
      {phase === "camera" && (
        <>
          <FilterStrip
            filters={filters}
            selectedId={selectedFilterId}
            onSelect={setSelectedFilterId}
            onAdd={() => setModalOpen(true)}
            onEdit={(id) => setEditingFilterId(id)}
            loading={filtersLoading}
          />
          <ShutterBar
            onShutter={handleShutter}
            onFlipCamera={handleFlipCamera}
            disabled={!selectedFilter || phase !== "camera"}
            flipDisabled={!cameraReady}
          />
        </>
      )}
      <FilterCreateModal
        open={modalOpen || !!editingFilterId}
        onClose={() => {
          setModalOpen(false);
          setEditingFilterId(null);
        }}
        onCreated={handleFilterCreated}
        filterToEdit={filterToEdit}
        onUpdated={handleFilterUpdated}
        onDeleted={handleFilterDeleted}
      />
    </main>
  );
}
