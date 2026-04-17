"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchLessonReading,
  fetchStaffCourseLessonOutline,
  formatTenantAdminError,
  patchLessonReadingForStaff,
  type ApiError,
  type LmsApiSession
} from "../../../../lib/lms-api-client";
import { AdminLoadError } from "../../admin-page-states";
import styles from "./course-wireframe.module.css";

type ReadingLessonEditorProps = {
  session: LmsApiSession;
  courseId: string;
};

type OutlineOption = {
  lessonId: string;
  label: string;
  contentKind: "READING" | "VIDEO";
  lessonTitle: string;
};

export function ReadingLessonEditor({ session, courseId }: ReadingLessonEditorProps): ReactElement {
  const readingLoadSeq = useRef(0);

  const [outlineLoading, setOutlineLoading] = useState(true);
  const [outlineError, setOutlineError] = useState<ApiError | null>(null);
  const [options, setOptions] = useState<OutlineOption[]>([]);

  const [selectedId, setSelectedId] = useState<string>("");

  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonLoadError, setLessonLoadError] = useState<string | null>(null);

  const [draftHtml, setDraftHtml] = useState("");
  const [baselineUpdatedAt, setBaselineUpdatedAt] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");

  const [previewMode, setPreviewMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadOutline = useCallback(
    async (opts?: { quiet?: boolean }): Promise<boolean> => {
      const quiet = opts?.quiet ?? false;
      if (!quiet) {
        setOutlineLoading(true);
        setOutlineError(null);
      }
      const res = await fetchStaffCourseLessonOutline(session, courseId);
      if (!res.ok) {
        if (!quiet) {
          setOutlineError(res.error);
          setOutlineLoading(false);
        }
        return false;
      }
      const flat: OutlineOption[] = [];
      for (const m of res.outline.modules) {
        for (const l of m.lessons) {
          flat.push({
            lessonId: l.id,
            label: `${m.title} — ${l.title}`,
            contentKind: l.contentKind,
            lessonTitle: l.title
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
      if (!quiet) {
        setOutlineLoading(false);
      }
      return true;
    },
    [session, courseId]
  );

  const loadReadingForLesson = useCallback(
    async (lessonId: string): Promise<void> => {
      const seq = ++readingLoadSeq.current;
      setLessonLoading(true);
      setLessonLoadError(null);
      setSaveError(null);
      setSaveMessage(null);
      const res = await fetchLessonReading(session, courseId, lessonId);
      if (seq !== readingLoadSeq.current) {
        return;
      }
      if (!res.ok) {
        setLessonLoadError(formatTenantAdminError(res.error));
        setDraftHtml("");
        setBaselineUpdatedAt(null);
        setLessonTitle("");
        setLessonLoading(false);
        return;
      }
      const reading = res.reading;
      if (reading.contentKind !== "READING") {
        setLessonLoadError("This lesson is not a reading lesson.");
        setDraftHtml("");
        setBaselineUpdatedAt(null);
        setLessonTitle("");
        setLessonLoading(false);
        return;
      }
      setDraftHtml(reading.html ?? "");
      setLessonTitle(reading.title);
      setBaselineUpdatedAt(reading.updatedAt);
      setLessonLoading(false);
    },
    [session, courseId]
  );

  useEffect(() => {
    void loadOutline();
  }, [loadOutline]);

  const selectedMeta = useMemo(() => options.find((o) => o.lessonId === selectedId), [options, selectedId]);

  useEffect(() => {
    if (!selectedId || !selectedMeta) {
      return;
    }
    if (selectedMeta.contentKind !== "READING") {
      setLessonLoading(false);
      setLessonLoadError(null);
      setDraftHtml("");
      setBaselineUpdatedAt(null);
      setLessonTitle("");
      return;
    }
    void loadReadingForLesson(selectedId);
  }, [selectedId, selectedMeta, loadReadingForLesson]);

  async function onSave(): Promise<void> {
    if (!selectedId || selectedMeta?.contentKind !== "READING" || baselineUpdatedAt === null) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    const res = await patchLessonReadingForStaff(session, courseId, selectedId, {
      content: draftHtml.trim() === "" ? null : draftHtml,
      expectedUpdatedAt: baselineUpdatedAt
    });
    if (!res.ok) {
      if (res.error.status === 409) {
        await loadOutline({ quiet: true });
        await loadReadingForLesson(selectedId);
      }
      setSaveError(formatTenantAdminError(res.error));
      setSaving(false);
      return;
    }
    setBaselineUpdatedAt(res.reading.updatedAt);
    setDraftHtml(res.reading.html ?? "");
    setLessonTitle(res.reading.title);
    setSaveMessage("Saved.");
    setSaving(false);
  }

  if (outlineLoading) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Reading lessons</h2>
        <p style={{ margin: 0, fontSize: "0.875rem" }} aria-busy="true">
          Loading outline…
        </p>
      </div>
    );
  }

  if (outlineError) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Reading lessons</h2>
        <AdminLoadError error={outlineError} onRetry={() => void loadOutline()} />
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Reading lessons</h2>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          This course has no lessons yet. Add modules and lessons (for example via seed data) before editing reading
          content here.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Reading lesson content</h2>
      <p
        style={{
          margin: "0 0 var(--space-4)",
          fontSize: "0.875rem",
          color: "var(--color-text-muted)"
        }}
      >
        Edit HTML for reading lessons. Content is sanitized on save to match learner display rules. Saving checks the
        lesson version you loaded so concurrent edits return a clear conflict instead of silent overwrites.
      </p>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label
          htmlFor="admin-lesson-picker"
          style={{ display: "block", fontSize: "0.875rem", marginBottom: "var(--space-2)" }}
        >
          Lesson
        </label>
        <select
          id="admin-lesson-picker"
          className={`${styles.select} ${styles.selectFullWidth}`}
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
          }}
        >
          {options.map((o) => (
            <option key={o.lessonId} value={o.lessonId}>
              {o.label}
              {o.contentKind === "VIDEO" ? " (video)" : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedMeta?.contentKind === "VIDEO" ? (
        <p role="status" style={{ margin: 0, fontSize: "0.875rem" }}>
          This lesson is a video lesson. Reading body editing applies to lessons with content kind READING only.
        </p>
      ) : (
        <>
          {lessonLoadError ? (
            <p
              role="alert"
              style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-danger, #b42318)" }}
            >
              {lessonLoadError}
            </p>
          ) : null}
          {lessonLoading ? (
            <p style={{ margin: 0, fontSize: "0.875rem" }} aria-busy="true">
              Loading lesson content…
            </p>
          ) : null}
          <div
            role="tablist"
            aria-label="Editor view"
            style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)", flexWrap: "wrap" }}
          >
            <button
              type="button"
              className={previewMode ? styles.secondaryBtn : styles.primaryBtn}
              role="tab"
              aria-selected={!previewMode}
              onClick={() => {
                setPreviewMode(false);
              }}
            >
              Edit HTML
            </button>
            <button
              type="button"
              className={previewMode ? styles.primaryBtn : styles.secondaryBtn}
              role="tab"
              aria-selected={previewMode}
              onClick={() => {
                setPreviewMode(true);
              }}
            >
              Preview
            </button>
          </div>

          {!lessonLoading ? (
            !previewMode ? (
              <textarea
                className={styles.textarea}
                style={{ minHeight: "280px" }}
                aria-label="Reading lesson HTML"
                rows={14}
                value={draftHtml}
                disabled={lessonLoadError !== null}
                onChange={(e) => {
                  setDraftHtml(e.target.value);
                }}
              />
            ) : (
              <iframe
                title="Reading preview"
                sandbox=""
                srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:system-ui,Segoe UI,sans-serif;font-size:1rem;line-height:1.5;margin:16px">${draftHtml}</body></html>`}
                style={{
                  width: "100%",
                  minHeight: "280px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)"
                }}
              />
            )
          ) : null}

          <div style={{ marginTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {saveError ? (
              <p role="alert" style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-danger, #b42318)" }}>
                {saveError}
              </p>
            ) : null}
            {saveMessage ? (
              <p role="status" style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                {saveMessage}
              </p>
            ) : null}
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={saving || lessonLoading || lessonLoadError !== null || baselineUpdatedAt === null}
              onClick={() => void onSave()}
            >
              {saving ? "Saving…" : "Save reading body"}
            </button>
          </div>

          <p style={{ margin: "var(--space-4) 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {lessonTitle}
          </p>
        </>
      )}
    </div>
  );
}
