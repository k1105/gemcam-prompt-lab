"use client";

import { Icon } from "@iconify/react";
import type { PromptFilter } from "@/lib/types";
import styles from "./FilterStrip.module.css";

type Props = {
  filters: PromptFilter[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit?: (id: string) => void;
  loading?: boolean;
};

export function FilterStrip({
  filters,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  loading,
}: Props) {
  return (
    <div className={styles.strip}>
      <button
        className={styles.empty}
        onClick={onAdd}
        aria-label="Add new filter"
      >
        <Icon icon="material-symbols:add-rounded" width={22} />
        <span>NEW</span>
      </button>
      {loading && filters.length === 0 && (
        <div className={styles.empty}>LOADING…</div>
      )}
      {filters.map((f) => {
        const active = f.id === selectedId;
        const thumbSrc = f.thumbnailUrl ?? f.referenceImages[0]?.url ?? null;
        return (
          <div
            key={f.id}
            className={`${styles.card} ${active ? styles.cardActive : ""}`}
            onClick={() => onSelect(f.id)}
            aria-pressed={active}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(f.id);
              }
            }}
          >
            {active && onEdit && (
              <button
                className={styles.editBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(f.id);
                }}
                aria-label="Edit filter"
              >
                <Icon icon="material-symbols:edit-outline-rounded" width={16} />
              </button>
            )}
            <div className={styles.thumb}>
              {thumbSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbSrc} alt={f.name} />
              ) : (
                <div className={styles.thumbEmpty}>NO REF</div>
              )}
              {f.referenceImages.length > 1 && (
                <span className={styles.refCount}>
                  ×{f.referenceImages.length}
                </span>
              )}
            </div>
            <span className={styles.name}>{f.name}</span>
          </div>
        );
      })}
    </div>
  );
}
