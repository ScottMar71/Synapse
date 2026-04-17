"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { LessonGlossaryEntryDto } from "@conductor/contracts";
import { EmptyState } from "@conductor/ui";

import {
  archiveLessonGlossaryEntry,
  createLessonGlossaryEntry,
  fetchCourseLessonOutline,
  fetchLessonGlossaryEntries,
  formatTenantAdminError,
  patchLessonGlossaryEntry,
  type ApiError,
  type LmsApiSession
} from "../../../../lib/lms-api-client";
import { AdminLoadError } from "../../admin-page-states";
import styles from "./course-wireframe.module.css";

type LessonGlossaryEditorProps = {
  session: LmsApiSession;
  courseId: string;
};

type OutlineOption = {
  lessonId: string;
  label: string;
};

function sortGlossaryEntries(entries: LessonGlossaryEntryDto[]): LessonGlossaryEntryDto[] {
  return [...entries].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.id.localeCompare(b.id);
  });
}

export function LessonGlossaryEditor({ session, courseId }: LessonGlossaryEditorProps): ReactElement {
  const glossaryLoadSeq = useRef(0);

  const [outlineLoading, setOutlineLoading] = useState(true);
  const [outlineError, setOutlineError] = useState<ApiError | null>(null);
  const [options, setOptions] = useState<OutlineOption[]>([]);

  const [selectedId, setSelectedId] = useState<string>("");

  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LessonGlossaryEntryDto[]>([]);

  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState("");
  const [editDefinition, setEditDefinition] = useState("");
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

  const loadGlossaryForLesson = useCallback(
    async (lessonId: string): Promise<void> => {
      const seq = ++glossaryLoadSeq.current;
      setEntriesLoading(true);
      setEntriesError(null);
      setActionError(null);
      const res = await fetchLessonGlossaryEntries(session, courseId, lessonId);
      if (seq !== glossaryLoadSeq.current) {
        return;
      }
      if (!res.ok) {
        setEntriesError(formatTenantAdminError(res.error));
        setEntries([]);
        setEntriesLoading(false);
        return;
      }
      setEntries(res.entries);
      setEntriesLoading(false);
    },
    [session, courseId]
  );

  useEffect(() => {
    void loadOutline();
  }, [loadOutline]);

  useEffect(() => {
    if (!selectedId) {
      setEntries([]);
      return;
    }
    void loadGlossaryForLesson(selectedId);
  }, [selectedId, loadGlossaryForLesson]);

  const sortedEntries = useMemo(() => sortGlossaryEntries(entries), [entries]);

  function startEdit(entry: LessonGlossaryEntryDto): void {
    setEditingId(entry.id);
    setEditTerm(entry.term);
    setEditDefinition(entry.definition);
    setActionError(null);
  }

  function cancelEdit(): void {
    setEditingId(null);
    setEditTerm("");
    setEditDefinition("");
    setSavingEditId(null);
  }

  async function onSaveEdit(entryId: string): Promise<void> {
    const term = editTerm.trim();
    const definition = editDefinition.trim();
    if (term.length === 0 || definition.length === 0) {
      setActionError("Term and definition are required.");
      return;
    }
    if (!selectedId) {
      return;
    }
    setSavingEditId(entryId);
    setActionError(null);
    const res = await patchLessonGlossaryEntry(session, courseId, selectedId, entryId, {
      term,
      definition
    });
    if (!res.ok) {
      setActionError(formatTenantAdminError(res.error));
      setSavingEditId(null);
      return;
    }
    setEntries((prev) => prev.map((e) => (e.id === entryId ? res.entry : e)));
    cancelEdit();
  }

  async function onAdd(): Promise<void> {
    const term = newTerm.trim();
    const definition = newDefinition.trim();
    if (term.length === 0 || definition.length === 0) {
      setActionError("Enter a term and definition before adding.");
      return;
    }
    if (!selectedId) {
      return;
    }
    setAdding(true);
    setActionError(null);
    const res = await createLessonGlossaryEntry(session, courseId, selectedId, { term, definition });
    if (!res.ok) {
      setActionError(formatTenantAdminError(res.error));
      setAdding(false);
      return;
    }
    setEntries((prev) => [...prev, res.entry]);
    setNewTerm("");
    setNewDefinition("");
    setAdding(false);
  }

  async function onRemove(entryId: string, termLabel: string): Promise<void> {
    if (!selectedId) {
      return;
    }
    const ok = window.confirm(`Remove glossary entry “${termLabel}” from this lesson?`);
    if (!ok) {
      return;
    }
    setActionError(null);
    const res = await archiveLessonGlossaryEntry(session, courseId, selectedId, entryId);
    if (!res.ok) {
      setActionError(formatTenantAdminError(res.error));
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    if (editingId === entryId) {
      cancelEdit();
    }
  }

  async function swapSortOrders(fromIdx: number, toIdx: number): Promise<void> {
    if (!selectedId || fromIdx === toIdx) {
      return;
    }
    const sorted = sortGlossaryEntries(entries);
    const a = sorted[fromIdx];
    const b = sorted[toIdx];
    if (!a || !b) {
      return;
    }
    const orderA = a.sortOrder;
    const orderB = b.sortOrder;
    const staging = Math.max(...sorted.map((e) => e.sortOrder), -1) + 1000;

    setReordering(true);
    setActionError(null);

    let r = await patchLessonGlossaryEntry(session, courseId, selectedId, a.id, { sortOrder: staging });
    if (!r.ok) {
      setActionError(formatTenantAdminError(r.error));
      setReordering(false);
      return;
    }
    r = await patchLessonGlossaryEntry(session, courseId, selectedId, b.id, { sortOrder: orderA });
    if (!r.ok) {
      setActionError(formatTenantAdminError(r.error));
      void loadGlossaryForLesson(selectedId);
      setReordering(false);
      return;
    }
    r = await patchLessonGlossaryEntry(session, courseId, selectedId, a.id, { sortOrder: orderB });
    if (!r.ok) {
      setActionError(formatTenantAdminError(r.error));
      void loadGlossaryForLesson(selectedId);
      setReordering(false);
      return;
    }
    await loadGlossaryForLesson(selectedId);
    setReordering(false);
  }

  if (outlineLoading) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Lesson glossary</h2>
        <p style={{ margin: 0, fontSize: "0.875rem" }} aria-busy="true">
          Loading outline…
        </p>
      </div>
    );
  }

  if (outlineError) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Lesson glossary</h2>
        <AdminLoadError error={outlineError} onRetry={() => void loadOutline()} />
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Lesson glossary</h2>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          This course has no lessons yet. Add modules and lessons before attaching glossary entries.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Lesson glossary</h2>
      <p
        style={{
          margin: "0 0 var(--space-4)",
          fontSize: "0.875rem",
          color: "var(--color-text-muted)"
        }}
      >
        Glossary entries are stored per lesson. Learners see them in the lesson Resources panel when enrolled.
        Terms and definitions are plain text.
      </p>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label
          htmlFor="admin-glossary-lesson-picker"
          className={styles.label}
          style={{ display: "block", marginBottom: "var(--space-2)" }}
        >
          Lesson
        </label>
        <select
          id="admin-glossary-lesson-picker"
          className={`${styles.select} ${styles.selectFullWidth}`}
          value={selectedId}
          disabled={reordering || adding || savingEditId !== null}
          onChange={(e) => {
            setSelectedId(e.target.value);
            cancelEdit();
            setNewTerm("");
            setNewDefinition("");
          }}
        >
          {options.map((o) => (
            <option key={o.lessonId} value={o.lessonId}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {entriesError ? (
        <p role="alert" style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-danger, #b42318)" }}>
          {entriesError}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-danger, #b42318)" }}>
          {actionError}
        </p>
      ) : null}

      {entriesLoading ? (
        <p style={{ margin: "0 0 var(--space-4)", fontSize: "0.875rem" }} aria-busy="true">
          Loading glossary…
        </p>
      ) : sortedEntries.length === 0 ? (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <EmptyState
            title="No glossary entries yet"
            description="Add a term and definition below. You can reorder entries after you create at least two."
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
          {sortedEntries.map((entry, idx) => {
            const isEditing = editingId === entry.id;
            return (
              <li
                key={entry.id}
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
                      <label className={styles.label} htmlFor={`glossary-term-${entry.id}`}>
                        Term
                      </label>
                      <input
                        id={`glossary-term-${entry.id}`}
                        className={styles.input}
                        value={editTerm}
                        autoComplete="off"
                        onChange={(e) => {
                          setEditTerm(e.target.value);
                        }}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor={`glossary-def-${entry.id}`}>
                        Definition
                      </label>
                      <textarea
                        id={`glossary-def-${entry.id}`}
                        className={styles.textarea}
                        rows={4}
                        value={editDefinition}
                        onChange={(e) => {
                          setEditDefinition(e.target.value);
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        disabled={savingEditId !== null || reordering}
                        onClick={() => void onSaveEdit(entry.id)}
                      >
                        {savingEditId === entry.id ? "Saving…" : "Save"}
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
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{entry.term}</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || idx === 0 || editingId !== null}
                          aria-label={`Move glossary term ${entry.term} up`}
                          onClick={() => void swapSortOrders(idx, idx - 1)}
                        >
                          Move up
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || idx === sortedEntries.length - 1 || editingId !== null}
                          aria-label={`Move glossary term ${entry.term} down`}
                          onClick={() => void swapSortOrders(idx, idx + 1)}
                        >
                          Move down
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || editingId !== null}
                          onClick={() => {
                            startEdit(entry);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || editingId !== null}
                          onClick={() => void onRemove(entry.id, entry.term)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: "var(--space-3) 0 0", fontSize: "0.875rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {entry.definition}
                    </p>
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
          Add entry
        </h3>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-glossary-new-term">
            Term
          </label>
          <input
            id="admin-glossary-new-term"
            className={styles.input}
            value={newTerm}
            autoComplete="off"
            disabled={entriesLoading || reordering}
            onChange={(e) => {
              setNewTerm(e.target.value);
            }}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-glossary-new-definition">
            Definition
          </label>
          <textarea
            id="admin-glossary-new-definition"
            className={styles.textarea}
            rows={4}
            value={newDefinition}
            disabled={entriesLoading || reordering}
            onChange={(e) => {
              setNewDefinition(e.target.value);
            }}
          />
        </div>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={adding || entriesLoading || reordering || !selectedId}
          onClick={() => void onAdd()}
        >
          {adding ? "Adding…" : "Add glossary entry"}
        </button>
      </div>
    </div>
  );
}
