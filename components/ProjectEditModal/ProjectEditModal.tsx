"use client";

import { Icon } from "@iconify/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_PRIMARY_COLOR,
  normalizeHexColor,
  projectThemeStyle,
} from "@/lib/theme";
import type { Project } from "@/lib/types";
import styles from "./ProjectEditModal.module.css";

type Props = {
  project: Project | null;
  onClose: () => void;
  onUpdated: (project: Project) => void;
};

type ColorFieldProps = {
  label: string;
  value: string;
  fallback: string;
  onChange: (next: string) => void;
};

function ColorField({ label, value, fallback, onChange }: ColorFieldProps) {
  const effective = normalizeHexColor(value) ?? fallback;
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.colorRow}>
        <label className={styles.swatch} style={{ background: effective }}>
          <input
            type="color"
            value={effective}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} picker`}
          />
        </label>
        <input
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          maxLength={7}
          spellCheck={false}
        />
        <button
          className={styles.resetBtn}
          type="button"
          onClick={() => onChange("")}
          disabled={!value}
          aria-label={`Reset ${label}`}
          title="Reset to default"
        >
          <Icon icon="material-symbols:restart-alt-rounded" width={18} />
        </button>
      </div>
    </div>
  );
}

export function ProjectEditModal({ project, onClose, onUpdated }: Props) {
  if (!project) return null;
  // Keyed by id so the form state re-initialises when a different project
  // is opened, without needing an effect to sync it.
  return (
    <ProjectEditForm
      key={project.id}
      project={project}
      onClose={onClose}
      onUpdated={onUpdated}
    />
  );
}

type FormProps = {
  project: Project;
  onClose: () => void;
  onUpdated: (project: Project) => void;
};

function ProjectEditForm({ project, onClose, onUpdated }: FormProps) {
  const [name, setName] = useState(project.name);
  const [primaryColor, setPrimaryColor] = useState(project.primaryColor ?? "");
  const [accentColor, setAccentColor] = useState(project.accentColor ?? "");
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(
    project.logoUrl ?? null,
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Object URL for the picked logo file; revoked when replaced/unmounted.
  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : null),
    [logoFile],
  );
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const previewLogo = logoPreview ?? existingLogoUrl;
  const previewTheme = projectThemeStyle({
    primaryColor: normalizeHexColor(primaryColor) ?? undefined,
    accentColor: normalizeHexColor(accentColor) ?? undefined,
  });

  function handleLogoChosen(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("ロゴには画像ファイルを指定してください。");
      return;
    }
    setError(null);
    setLogoFile(file);
  }

  function handleRemoveLogo() {
    setLogoFile(null);
    setExistingLogoUrl(null);
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("名前を入力してください。");
      return;
    }
    for (const [label, value] of [
      ["Primary color", primaryColor],
      ["Accent color", accentColor],
    ] as const) {
      if (value.trim() && !normalizeHexColor(value)) {
        setError(`${label} は #rrggbb 形式で入力してください。`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("name", trimmed);
      form.append("primaryColor", normalizeHexColor(primaryColor) ?? "");
      form.append("accentColor", normalizeHexColor(accentColor) ?? "");
      if (logoFile) {
        form.append("logo", logoFile);
      } else if (!existingLogoUrl && project.logoUrl) {
        form.append("removeLogo", "1");
      }
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed to update project");
      onUpdated(json.project);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.backdrop} onClick={() => !saving && onClose()}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <span className={styles.dialogTitle}>EDIT PROJECT</span>
          <button
            className={styles.close}
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            type="button"
          >
            <Icon icon="material-symbols:close-rounded" width={20} />
          </button>
        </div>

        <div className={styles.dialogBody}>
          {/* Live header preview */}
          <div className={styles.preview} style={previewTheme}>
            <div className={styles.previewHeader}>
              {previewLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.previewLogo} src={previewLogo} alt="" />
              ) : (
                <span className={styles.previewMark}>G</span>
              )}
              <span className={styles.previewTitle}>
                {name.trim() || project.name}
              </span>
              <span className={styles.previewShutter} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>NAME</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoFocus
            />
          </div>

          <ColorField
            label="PRIMARY COLOR"
            value={primaryColor}
            fallback={DEFAULT_PRIMARY_COLOR}
            onChange={setPrimaryColor}
          />
          <ColorField
            label="ACCENT COLOR"
            value={accentColor}
            fallback={DEFAULT_ACCENT_COLOR}
            onChange={setAccentColor}
          />

          <div className={styles.field}>
            <label className={styles.label}>LOGO</label>
            <div className={styles.logoRow}>
              <div className={styles.logoBox}>
                {previewLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewLogo} alt="Project logo" />
                ) : (
                  <Icon
                    icon="material-symbols:image-outline"
                    width={24}
                    className={styles.logoPlaceholder}
                  />
                )}
              </div>
              <div className={styles.logoActions}>
                <button
                  className="kodak-btn kodak-btn--ghost"
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={saving}
                >
                  <Icon icon="material-symbols:upload-rounded" width={16} />
                  {previewLogo ? "REPLACE" : "UPLOAD"}
                </button>
                {previewLogo && (
                  <button
                    className={styles.textBtn}
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={saving}
                  >
                    ロゴを削除
                  </button>
                )}
              </div>
            </div>
            <p className={styles.hint}>
              PNG / JPEG / WebP / SVG、2MB まで。ヘッダーに高さ 30px で表示されます。
            </p>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              hidden
              onChange={(e) => {
                handleLogoChosen(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.dialogFooter}>
          <button
            className="kodak-btn kodak-btn--ghost"
            onClick={onClose}
            disabled={saving}
            type="button"
          >
            CANCEL
          </button>
          <button
            className="kodak-btn"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            type="button"
          >
            {saving ? "SAVING…" : "SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
}
