"use client";

import type { ReactElement } from "react";
import { useId, useMemo, useState } from "react";

import {
  WIREFRAME_MOST_USED_CATEGORY_IDS,
  WIREFRAME_PRESET_COURSE_CATEGORIES
} from "../../wireframe-course-category-presets";
import styles from "./course-wireframe.module.css";

type CategoryTab = "all" | "mostUsed";

type CustomCategory = { id: string; label: string };

function ChevronUpIcon(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path fill="currentColor" d="M6 2.5L10.5 8h-9L6 2.5z" />
    </svg>
  );
}

function ChevronDownIcon(): ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path fill="currentColor" d="M6 9.5L1.5 4h9L6 9.5z" />
    </svg>
  );
}

function SmallTriangleIcon(): ReactElement {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path fill="currentColor" d="M5 1.5L9 8.5H1L5 1.5z" />
    </svg>
  );
}

function slugFromLabel(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base.length > 0 ? base : "category";
}

export function CourseCategoriesPanel(): ReactElement {
  const baseId = useId();
  const contentId = `${baseId}-categories-content`;
  const [expanded, setExpanded] = useState(true);
  const [tab, setTab] = useState<CategoryTab>("all");
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  const allCategories = useMemo(() => {
    const preset = WIREFRAME_PRESET_COURSE_CATEGORIES.map((c) => ({ id: c.id, label: c.label }));
    return [...preset, ...customCategories];
  }, [customCategories]);

  const visibleCategories = useMemo(() => {
    if (tab === "all") {
      return allCategories;
    }
    const order = new Map<string, number>(WIREFRAME_MOST_USED_CATEGORY_IDS.map((id, i) => [id, i]));
    return allCategories
      .filter((c) => order.has(c.id))
      .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  }, [allCategories, tab]);

  function toggle(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function addNewCategory(): void {
    const raw = window.prompt("New category name");
    if (raw === null) {
      return;
    }
    const label = raw.trim();
    if (label.length === 0) {
      return;
    }
    let id = slugFromLabel(label);
    const existingIds = new Set(allCategories.map((c) => c.id));
    let n = 2;
    while (existingIds.has(id)) {
      id = `${slugFromLabel(label)}-${n}`;
      n += 1;
    }
    setCustomCategories((prev) => [...prev, { id, label }]);
  }

  return (
    <section className={styles.publishMetabox} aria-label="Course categories">
      <header className={styles.publishMetaboxHeader}>
        <h2 className={styles.publishMetaboxHeading}>Course Categories</h2>
        <div className={styles.publishMetaboxHeaderActions}>
          <button
            type="button"
            className={styles.publishMetaboxIconBtn}
            aria-expanded={expanded}
            aria-controls={contentId}
            aria-label={expanded ? "Collapse panel" : "Expand panel"}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
          <button
            type="button"
            className={styles.publishMetaboxIconBtn}
            aria-hidden
            tabIndex={-1}
            title="Wireframe control (no action)"
          >
            <ChevronDownIcon />
          </button>
          <button
            type="button"
            className={styles.publishMetaboxIconBtn}
            aria-hidden
            tabIndex={-1}
            title="Wireframe control (no action)"
          >
            <SmallTriangleIcon />
          </button>
        </div>
      </header>

      <div id={contentId} hidden={!expanded}>
        <div className={styles.categoryMetaboxBody}>
          <div className={styles.categoryPicker}>
            <div className={styles.categoryTabsRow} role="tablist" aria-label="Category source">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "all"}
                id={`${baseId}-tab-all`}
                className={tab === "all" ? styles.categoryTabActive : styles.categoryTabLink}
                onClick={() => setTab("all")}
              >
                All Categories
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "mostUsed"}
                id={`${baseId}-tab-used`}
                className={tab === "mostUsed" ? styles.categoryTabActive : styles.categoryTabLink}
                onClick={() => setTab("mostUsed")}
              >
                Most Used
              </button>
            </div>

            <div
              className={styles.categoryListScroll}
              role="tabpanel"
              aria-labelledby={tab === "all" ? `${baseId}-tab-all` : `${baseId}-tab-used`}
            >
              {visibleCategories.length === 0 ? (
                <p className={styles.categoryEmptyText}>No categories in this view.</p>
              ) : (
                <ul className={styles.categoryCheckboxList}>
                  {visibleCategories.map((item) => {
                    const inputId = `${baseId}-${item.id}`;
                    return (
                      <li key={item.id}>
                        <label className={styles.categoryCheckboxItem} htmlFor={inputId}>
                          <input
                            id={inputId}
                            type="checkbox"
                            checked={selected.has(item.id)}
                            onChange={() => toggle(item.id)}
                          />
                          <span className={styles.categoryCheckboxLabel}>{item.label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className={styles.categoryAddFooter}>
            <button type="button" className={styles.categoryAddLink} onClick={addNewCategory}>
              + Add New Category
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
