"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { ProjectEditModal } from "@/components/ProjectEditModal/ProjectEditModal";
import { UserMenu } from "@/components/UserMenu/UserMenu";
import { DEFAULT_PRIMARY_COLOR } from "@/lib/theme";
import type { Project } from "@/lib/types";
import styles from "./page.module.css";

export default function ProjectsHomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editingProject = projects.find((p) => p.id === editingId) ?? null;

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed to load projects");
      setProjects(Array.isArray(json.projects) ? json.projects : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "failed to create project");
      setProjects((prev) => [...prev, json.project]);
      setNewName("");
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setCreating(false);
    }
  }, [newName]);

  const handleProjectUpdated = useCallback((project: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? project : p)),
    );
  }, []);

  return (
    <main className={styles.app}>
      <AppHeader rightSlot={<UserMenu />} />
      <div className={styles.body}>
        <div className={styles.head}>
          <h1 className={styles.heading}>PROJECTS</h1>
          <button
            className="kodak-btn"
            type="button"
            onClick={() => setModalOpen(true)}
          >
            <Icon icon="material-symbols:add-rounded" width={18} />
            NEW
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {loading ? (
          <div className={styles.muted}>読み込み中…</div>
        ) : projects.length === 0 ? (
          <div className={styles.muted}>
            プロジェクトがまだありません。右上の「NEW」から作成してください。
          </div>
        ) : (
          <ul className={styles.list}>
            {projects.map((p) => (
              <li key={p.id} className={styles.item}>
                <Link href={`/projects/${p.id}`} className={styles.itemLink}>
                  <span className={styles.itemMark}>
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logoUrl} alt="" />
                    ) : (
                      <span
                        className={styles.itemSwatch}
                        style={{
                          background: p.primaryColor ?? DEFAULT_PRIMARY_COLOR,
                        }}
                      />
                    )}
                  </span>
                  <span className={styles.itemName}>{p.name}</span>
                  <Icon
                    icon="material-symbols:chevron-right-rounded"
                    width={22}
                  />
                </Link>
                <button
                  className={styles.editBtn}
                  type="button"
                  onClick={() => setEditingId(p.id)}
                  aria-label={`Edit ${p.name}`}
                  title="Edit project"
                >
                  <Icon icon="material-symbols:edit-outline-rounded" width={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ProjectEditModal
        project={editingProject}
        onClose={() => setEditingId(null)}
        onUpdated={handleProjectUpdated}
      />

      {modalOpen && (
        <div
          className={styles.backdrop}
          onClick={() => !creating && setModalOpen(false)}
        >
          <div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dialogHeader}>
              <span className={styles.dialogTitle}>NEW PROJECT</span>
              <button
                className={styles.close}
                onClick={() => setModalOpen(false)}
                disabled={creating}
                aria-label="Close"
                type="button"
              >
                <Icon icon="material-symbols:close-rounded" width={20} />
              </button>
            </div>
            <div className={styles.dialogBody}>
              <label className={styles.label}>NAME</label>
              <input
                className={styles.input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: 2026 春キャンペーン"
                maxLength={60}
                autoFocus
              />
            </div>
            <div className={styles.dialogFooter}>
              <button
                className="kodak-btn kodak-btn--ghost"
                onClick={() => setModalOpen(false)}
                disabled={creating}
                type="button"
              >
                CANCEL
              </button>
              <button
                className="kodak-btn"
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                type="button"
              >
                {creating ? "CREATING…" : "CREATE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
