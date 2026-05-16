"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { UserMenu } from "@/components/UserMenu/UserMenu";
import type { Project } from "@/lib/types";
import styles from "./page.module.css";

export default function ProjectsHomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                  <span className={styles.itemName}>{p.name}</span>
                  <Icon
                    icon="material-symbols:chevron-right-rounded"
                    width={22}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

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
