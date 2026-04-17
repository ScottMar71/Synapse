"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { LessonExternalLinkDto } from "@conductor/contracts";
import { EmptyState } from "@conductor/ui";

import {
  archiveLessonExternalLink,
  createLessonExternalLink,
  fetchCourseLessonOutline,
  fetchLessonExternalLinks,
  formatTenantAdminError,
  patchLessonExternalLink,
  type ApiError,
  type LmsApiSession
} from "../../../../lib/lms-api-client";
import { AdminLoadError } from "../../admin-page-states";
import styles from "./course-wireframe.module.css";

type LessonLinksEditorProps = {
  session: LmsApiSession;
  courseId: string;
};

type OutlineOption = {
  lessonId: string;
  label: string;
};

function sortLessonLinks(links: LessonExternalLinkDto[]): LessonExternalLinkDto[] {
  return [...links].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.id.localeCompare(b.id);
  });
}

function isAllowedHttpUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) {
    return false;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return false;
  }
  return Boolean(parsed.hostname);
}

export function LessonLinksEditor({ session, courseId }: LessonLinksEditorProps): ReactElement {
  const linksLoadSeq = useRef(0);

  const [outlineLoading, setOutlineLoading] = useState(true);
  const [outlineError, setOutlineError] = useState<ApiError | null>(null);
  const [options, setOptions] = useState<OutlineOption[]>([]);

  const [selectedId, setSelectedId] = useState<string>("");

  const [linksLoading, setLinksLoading] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [links, setLinks] = useState<LessonExternalLinkDto[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const loadOutline = useCallback(async (): Promise<boolean> => {
    setOutlineLoading(true);
    setOutlineError(null);
    const res = await fetchCourseLessonOutline(session, courseId);
    if (!res.ok) {
      setOutlineError(res.error);
      setOutlineLoading(false);
      return false;
    }
    const flat: OutlineOption[] = [];
    for (const m of res.outline.modules) {
      for (const l of m.lessons) {
        flat.push({
          lessonId: l.id,
          label: `${m.title} — ${l.title}`
        });
      }
    }
    setOptions(flat);
    setSelectedId((prev) => {
      if (prev && flat.some((o) => o.lessonId === prev)) {
        return prev;
      }
      return flat[0]?.lessonId ?? "";
    });
    setOutlineLoading(false);
    return true;
  }, [session, courseId]);

  const loadLinksForLesson = useCallback(
    async (lessonId: string): Promise<void> => {
      const seq = ++linksLoadSeq.current;
      setLinksLoading(true);
      setLinksError(null);
      setActionError(null);
      const res = await fetchLessonExternalLinks(session, courseId, lessonId);
      if (seq !== linksLoadSeq.current) {
        return;
      }
      if (!res.ok) {
        setLinksError(formatTenantAdminError(res.error));
        setLinks([]);
        setLinksLoading(false);
        return;
      }
      setLinks(res.links);
      setLinksLoading(false);
    },
    [session, courseId]
  );

  useEffect(() => {
    void loadOutline();
  }, [loadOutline]);

  useEffect(() => {
    if (!selectedId) {
      setLinks([]);
      return;
    }
    void loadLinksForLesson(selectedId);
  }, [selectedId, loadLinksForLesson]);

  const sortedLinks = useMemo(() => sortLessonLinks(links), [links]);

  function startEdit(link: LessonExternalLinkDto): void {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditDescription(link.description ?? "");
    setActionError(null);
  }

  function cancelEdit(): void {
    setEditingId(null);
    setEditTitle("");
    setEditUrl("");
    setEditDescription("");
    setSavingEditId(null);
  }

  async function onSaveEdit(linkId: string): Promise<void> {
    const title = editTitle.trim();
    const url = editUrl.trim();
    if (title.length === 0) {
      setActionError("Title is required.");
      return;
    }
    if (!isAllowedHttpUrl(url)) {
      setActionError("Enter a valid http or https URL with a host (for example https://example.com/resource).");
      return;
    }
    if (!selectedId) {
      return;
    }
    setSavingEditId(linkId);
    setActionError(null);
    const descTrim = editDescription.trim();
    const res = await patchLessonExternalLink(session, courseId, selectedId, linkId, {
      title,
      url,
      description: descTrim.length === 0 ? null : descTrim
    });
    if (!res.ok) {
      setActionError(formatTenantAdminError(res.error));
      setSavingEditId(null);
      return;
    }
    setLinks((prev) => prev.map((l) => (l.id === linkId ? res.link : l)));
    cancelEdit();
  }

  async function onAdd(): Promise<void> {
    const title = newTitle.trim();
    const url = newUrl.trim();
    if (title.length === 0) {
      setActionError("Enter a title before adding.");
      return;
    }
    if (!isAllowedHttpUrl(url)) {
      setActionError("Enter a valid http or https URL with a host (for example https://example.com/resource).");
      return;
    }
    if (!selectedId) {
      return;
    }
    setAdding(true);
    setActionError(null);
    const descTrim = newDescription.trim();
    const res = await createLessonExternalLink(session, courseId, selectedId, {
      title,
      url,
      description: descTrim.length === 0 ? null : descTrim
    });
    if (!res.ok) {
      setActionError(formatTenantAdminError(res.error));
      setAdding(false);
      return;
    }
    setLinks((prev) => [...prev, res.link]);
    setNewTitle("");
    setNewUrl("");
    setNewDescription("");
    setAdding(false);
  }

  async function onRemove(linkId: string, titleLabel: string): Promise<void> {
    if (!selectedId) {
      return;
    }
    const ok = window.confirm(`Remove link “${titleLabel}” from this lesson?`);
    if (!ok) {
      return;
    }
    setActionError(null);
    const res = await archiveLessonExternalLink(session, courseId, selectedId, linkId);
    if (!res.ok) {
      setActionError(formatTenantAdminError(res.error));
      return;
    }
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
    if (editingId === linkId) {
      cancelEdit();
    }
  }

  async function swapSortOrders(fromIdx: number, toIdx: number): Promise<void> {
    if (!selectedId || fromIdx === toIdx) {
      return;
    }
    const sorted = sortLessonLinks(links);
    const a = sorted[fromIdx];
    const b = sorted[toIdx];
    if (!a || !b) {
      return;
    }
    const orderA = a.sortOrder;
    const orderB = b.sortOrder;
    const staging = Math.max(...sorted.map((l) => l.sortOrder), -1) + 1000;

    setReordering(true);
    setActionError(null);

    let r = await patchLessonExternalLink(session, courseId, selectedId, a.id, { sortOrder: staging });
    if (!r.ok) {
      setActionError(formatTenantAdminError(r.error));
      setReordering(false);
      return;
    }
    r = await patchLessonExternalLink(session, courseId, selectedId, b.id, { sortOrder: orderA });
    if (!r.ok) {
      setActionError(formatTenantAdminError(r.error));
      void loadLinksForLesson(selectedId);
      setReordering(false);
      return;
    }
    r = await patchLessonExternalLink(session, courseId, selectedId, a.id, { sortOrder: orderB });
    if (!r.ok) {
      setActionError(formatTenantAdminError(r.error));
      void loadLinksForLesson(selectedId);
      setReordering(false);
      return;
    }
    await loadLinksForLesson(selectedId);
    setReordering(false);
  }

  if (outlineLoading) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Lesson external links</h2>
        <p style={{ margin: 0, fontSize: "0.875rem" }} aria-busy="true">
          Loading outline…
        </p>
      </div>
    );
  }

  if (outlineError) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Lesson external links</h2>
        <AdminLoadError error={outlineError} onRetry={() => void loadOutline()} />
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Lesson external links</h2>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          This course has no lessons yet. Add modules and lessons before attaching external links.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Lesson external links</h2>
      <p
        style={{
          margin: "0 0 var(--space-4)",
          fontSize: "0.875rem",
          color: "var(--color-text-muted)"
        }}
      >
        Curated URLs appear in the lesson Resources panel for enrolled learners. Only http and https links are allowed;
        unsafe schemes are rejected by the API.
      </p>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label
          htmlFor="admin-links-lesson-picker"
          className={styles.label}
          style={{ display: "block", marginBottom: "var(--space-2)" }}
        >
          Lesson
        </label>
        <select
          id="admin-links-lesson-picker"
          className={`${styles.select} ${styles.selectFullWidth}`}
          value={selectedId}
          disabled={reordering || adding || savingEditId !== null}
          onChange={(e) => {
            setSelectedId(e.target.value);
            cancelEdit();
            setNewTitle("");
            setNewUrl("");
            setNewDescription("");
          }}
        >
          {options.map((o) => (
            <option key={o.lessonId} value={o.lessonId}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {linksError ? (
        <p role="alert" style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-danger, #b42318)" }}>
          {linksError}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-danger, #b42318)" }}>
          {actionError}
        </p>
      ) : null}

      {linksLoading ? (
        <p style={{ margin: "0 0 var(--space-4)", fontSize: "0.875rem" }} aria-busy="true">
          Loading links…
        </p>
      ) : sortedLinks.length === 0 ? (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <EmptyState
            title="No external links yet"
            description="Add a title and URL below. You can reorder links after you create at least two."
          />
        </div>
      ) : (
        <ul
          style={{
            margin: "0 0 var(--space-4)",
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)"
          }}
        >
          {sortedLinks.map((link, idx) => {
            const isEditing = editingId === link.id;
            return (
              <li
                key={link.id}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-4)",
                  background: "var(--color-surface-muted)"
                }}
              >
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor={`link-title-${link.id}`}>
                        Title
                      </label>
                      <input
                        id={`link-title-${link.id}`}
                        className={styles.input}
                        value={editTitle}
                        autoComplete="off"
                        onChange={(e) => {
                          setEditTitle(e.target.value);
                        }}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor={`link-url-${link.id}`}>
                        URL
                      </label>
                      <input
                        id={`link-url-${link.id}`}
                        className={styles.input}
                        type="url"
                        inputMode="url"
                        value={editUrl}
                        autoComplete="off"
                        onChange={(e) => {
                          setEditUrl(e.target.value);
                        }}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor={`link-desc-${link.id}`}>
                        Description (optional)
                      </label>
                      <textarea
                        id={`link-desc-${link.id}`}
                        className={styles.textarea}
                        rows={3}
                        value={editDescription}
                        onChange={(e) => {
                          setEditDescription(e.target.value);
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        disabled={savingEditId !== null || reordering}
                        onClick={() => void onSaveEdit(link.id)}
                      >
                        {savingEditId === link.id ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        disabled={savingEditId !== null}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{link.title}</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || idx === 0 || editingId !== null}
                          aria-label={`Move link ${link.title} up`}
                          onClick={() => void swapSortOrders(idx, idx - 1)}
                        >
                          Move up
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || idx === sortedLinks.length - 1 || editingId !== null}
                          aria-label={`Move link ${link.title} down`}
                          onClick={() => void swapSortOrders(idx, idx + 1)}
                        >
                          Move down
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || editingId !== null}
                          onClick={() => {
                            startEdit(link);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || editingId !== null}
                          onClick={() => void onRemove(link.id, link.title)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.875rem" }}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.url}
                      </a>
                    </p>
                    {link.description ? (
                      <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.875rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {link.description}
                      </p>
                    ) : null}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          paddingTop: "var(--space-4)"
        }}
      >
        <h3 className={styles.panelTitle} style={{ marginBottom: "var(--space-3)" }}>
          Add link
        </h3>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-links-new-title">
            Title
          </label>
          <input
            id="admin-links-new-title"
            className={styles.input}
            value={newTitle}
            autoComplete="off"
            disabled={linksLoading || reordering}
            onChange={(e) => {
              setNewTitle(e.target.value);
            }}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-links-new-url">
            URL
          </label>
          <input
            id="admin-links-new-url"
            className={styles.input}
            type="url"
            inputMode="url"
            value={newUrl}
            autoComplete="off"
            disabled={linksLoading || reordering}
            onChange={(e) => {
              setNewUrl(e.target.value);
            }}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-links-new-desc">
            Description (optional)
          </label>
          <textarea
            id="admin-links-new-desc"
            className={styles.textarea}
            rows={3}
            value={newDescription}
            disabled={linksLoading || reordering}
            onChange={(e) => {
              setNewDescription(e.target.value);
            }}
          />
        </div>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={adding || linksLoading || reordering || !selectedId}
          onClick={() => void onAdd()}
        >
          {adding ? "Adding…" : "Add link"}
        </button>
      </div>
    </div>
  );
}
