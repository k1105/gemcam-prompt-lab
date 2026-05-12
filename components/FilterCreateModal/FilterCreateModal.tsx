"use client";

import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import type { PromptFilter, ReferenceImage } from "@/lib/types";
import styles from "./FilterCreateModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (filter: PromptFilter) => void;
  filterToEdit?: PromptFilter;
  onUpdated?: (filter: PromptFilter) => void;
  onDeleted?: (id: string) => void;
};

export function FilterCreateModal({ open, onClose, onCreated, filterToEdit, onUpdated, onDeleted }: Props) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [existingRefs, setExistingRefs] = useState<ReferenceImage[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"manual" | "image">("manual");
  const [thinkImage, setThinkImage] = useState<File | null>(null);
  const [thinking, setThinking] = useState(false);
  const [genPhase, setGenPhase] = useState<0 | 1 | 2>(0);
  const [progress1, setProgress1] = useState(0);
  const [progress2, setProgress2] = useState(0);
  const thinkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (filterToEdit) {
        setName(filterToEdit.name);
        setPrompt(filterToEdit.prompt);
        setCreatedBy(filterToEdit.createdBy ?? "");
        setExistingRefs(filterToEdit.referenceImages ?? []);
      } else {
        setName("");
        setPrompt("");
        setCreatedBy("");
        setExistingRefs([]);
        setFiles([]);
        setError(null);
        setTab("manual");
        setThinkImage(null);
      }
    }
  }, [open, filterToEdit]);

  if (!open) return null;

  function reset() {
    setName("");
    setPrompt("");
    setCreatedBy("");
    setExistingRefs([]);
    setFiles([]);
    setError(null);
    setTab("manual");
    setThinkImage(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const added = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...added]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError(null);
    if (!name.trim() || !prompt.trim()) {
      setError("Name and prompt are required.");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("prompt", prompt.trim());
      if (createdBy.trim()) form.append("createdBy", createdBy.trim());
      
      if (filterToEdit) {
        for (const r of existingRefs) {
          form.append("existingReferenceUrls", r.url);
        }
      }
      
      for (const f of files) form.append("references", f);
      
      const method = filterToEdit ? "PUT" : "POST";
      const url = filterToEdit ? `/api/filters/${filterToEdit.id}` : "/api/filters";
      
      const res = await fetch(url, { method, body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed");
      
      if (filterToEdit && onUpdated) {
        onUpdated(json.filter);
      } else {
        onCreated(json.filter);
      }
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!filterToEdit) return;
    if (!window.confirm("このフィルターを削除しますか？ (Delete this filter?)")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/filters/${filterToEdit.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to delete filter");
      }
      onDeleted?.(filterToEdit.id);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleGeneratePrompt() {
    if (!thinkImage) return;
    setThinking(true);
    setGenPhase(1);
    setProgress1(0);
    setProgress2(0);
    setError(null);

    const interval1 = setInterval(() => {
      setProgress1((prev) => Math.min(prev + (100 / 15), 95));
    }, 1000);

    let interval2: NodeJS.Timeout | null = null;

    try {
      const form = new FormData();
      form.append("image", thinkImage);
      const res1 = await fetch("/api/generate-prompt/describe", {
        method: "POST",
        body: form,
      });
      const json1 = await res1.json();
      if (!res1.ok) throw new Error(json1.error ?? "Failed to analyze image");
      
      clearInterval(interval1);
      setProgress1(100);
      setGenPhase(2);

      interval2 = setInterval(() => {
        setProgress2((prev) => Math.min(prev + (100 / 15), 95));
      }, 1000);

      const res2 = await fetch("/api/generate-prompt/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: json1.description }),
      });
      const json2 = await res2.json();
      if (!res2.ok) throw new Error(json2.error ?? "Failed to generate prompt");

      clearInterval(interval2);
      setProgress2(100);
      
      setTimeout(() => {
        setPrompt(json2.prompt);
        setTab("manual");
        setThinkImage(null);
        setThinking(false);
        setGenPhase(0);
      }, 500);
    } catch (err) {
      clearInterval(interval1);
      if (interval2) clearInterval(interval2);
      setError(err instanceof Error ? err.message : "unknown error");
      setThinking(false);
      setGenPhase(0);
    }
  }

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>{filterToEdit ? "EDIT PROMPT FILTER" : "NEW PROMPT FILTER"}</span>
          <button
            className={styles.close}
            onClick={handleClose}
            aria-label="Close"
          >
            <Icon icon="material-symbols:close-rounded" width={20} />
          </button>
        </div>
        <div className={styles.body}>
          {!filterToEdit && (
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${tab === "manual" ? styles.tabActive : ""}`}
                onClick={() => setTab("manual")}
              >
                MANUAL
              </button>
              <button
                className={`${styles.tab} ${tab === "image" ? styles.tabActive : ""}`}
                onClick={() => setTab("image")}
              >
                FROM IMAGE
              </button>
            </div>
          )}

          {tab === "image" ? (
            <>
              <div className={styles.field}>
                <label className={styles.label}>IMAGE TO ANALYZE</label>
                {thinkImage ? (
                  <div className={styles.imagePreview}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(thinkImage)} alt="To analyze" />
                    <button
                      className="kodak-btn kodak-btn--ghost"
                      onClick={() => setThinkImage(null)}
                      style={{ marginTop: 8, width: "100%" }}
                    >
                      REMOVE IMAGE
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className={styles.dropzone}
                      onClick={() => thinkInputRef.current?.click()}
                      type="button"
                    >
                      <Icon
                        icon="material-symbols:add-photo-alternate-outline"
                        width={24}
                      />
                      <span>Tap to choose an image</span>
                    </button>
                    <input
                      ref={thinkInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setThinkImage(file);
                        e.target.value = "";
                      }}
                    />
                  </>
                )}
              </div>
              {error && <div className={styles.error}>{error}</div>}
              {thinking ? (
                <div className={styles.progressContainer}>
                  <div className={styles.phase}>
                    <div className={styles.phaseLabel}>
                      <span>1. Analyzing Image Style</span>
                      <span>{Math.round(progress1)}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${progress1}%` }} />
                    </div>
                  </div>
                  <div className={styles.phase}>
                    <div className={styles.phaseLabel}>
                      <span style={{ color: genPhase < 2 ? "var(--color-ink-mute)" : "var(--color-ink)" }}>2. Structuring Prompt</span>
                      <span>{Math.round(progress2)}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${progress2}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  className="kodak-btn"
                  onClick={handleGeneratePrompt}
                  disabled={!thinkImage}
                  style={{ marginTop: "auto" }}
                >
                  GENERATE PROMPT
                </button>
              )}
            </>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label}>NAME</label>
                <input
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: Kodak Portrait"
                  maxLength={60}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>PROMPT</label>
                <textarea
                  className={styles.textarea}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Geminiへの指示文を入力"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>REFERENCE IMAGES (optional)</label>
                <button
                  className={styles.dropzone}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Icon
                    icon="material-symbols:add-photo-alternate-outline"
                    width={24}
                  />
                  <span>Tap to choose images</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => addFiles(e.target.files)}
                />
                { (existingRefs.length > 0 || files.length > 0) && (
                  <div className={styles.thumbs}>
                    {existingRefs.map((f, i) => (
                      <div key={f.url} className={styles.thumb}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.url} alt="Reference" />
                        <button
                          className={styles.thumbRemove}
                          onClick={() => setExistingRefs((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {files.map((f, i) => (
                      <div key={i} className={styles.thumb}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(f)} alt={f.name} />
                        <button
                          className={styles.thumbRemove}
                          onClick={() => removeFile(i)}
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>YOUR NAME (optional)</label>
                <input
                  className={styles.input}
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  placeholder="作成者名"
                  maxLength={30}
                />
              </div>
              {error && <div className={styles.error}>{error}</div>}
            </>
          )}
        </div>
        {tab === "manual" && (
          <div className={styles.footer}>
            {filterToEdit && (
              <button
                className="kodak-btn kodak-btn--ghost"
                onClick={handleDelete}
                disabled={submitting || deleting}
                style={{ color: "var(--color-red)", flex: 0.5 }}
              >
                DELETE
              </button>
            )}
            <button
              className="kodak-btn kodak-btn--ghost"
              onClick={handleClose}
              disabled={submitting || deleting}
            >
              CANCEL
            </button>
            <button
              className="kodak-btn"
              onClick={handleSubmit}
              disabled={submitting || deleting}
            >
              {submitting ? "SAVING…" : "SAVE"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
