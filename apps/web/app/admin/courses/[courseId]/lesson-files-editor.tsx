"use client";

import type { LessonFileAttachmentDto, LessonFileUploadInstruction } from "@conductor/contracts";
import type { ChangeEvent, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@conductor/ui";

import {
  archiveLessonFileAttachment,
  fetchCourseLessonOutline,
  fetchLessonFileAttachments,
  fetchLessonFileDownload,
  formatTenantAdminError,
  initLessonFileUpload,
  patchLessonFileAttachment,
  reorderLessonFileAttachments,
  type ApiError,
  type LmsApiSession
} from "../../../../lib/lms-api-client";
import { AdminLoadError } from "../../admin-page-states";
import styles from "./course-wireframe.module.css";

const MAX_LESSON_FILE_BYTES = 100 * 1024 * 1024;

type LessonFilesEditorProps = {
  session: LmsApiSession;
  courseId: string;
};

type OutlineOption = {
  lessonId: string;
  label: string;
};

function sortLessonFiles(files: LessonFileAttachmentDto[]): LessonFileAttachmentDto[] {
  return [...files].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.id.localeCompare(b.id);
  });
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  }
  const gb = mb / 1024;
  return `${gb < 10 ? gb.toFixed(1) : Math.round(gb)} GB`;
}

function putPresignedUpload(
  instruction: LessonFileUploadInstruction,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(instruction.method, instruction.url);
    for (const [key, value] of Object.entries(instruction.headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => {
      reject(new Error("Network error during upload"));
    };
    xhr.send(file);
  });
}

export function LessonFilesEditor({ session, courseId }: LessonFilesEditorProps): ReactElement {
  const filesLoadSeq = useRef(0);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const addInputRef = useRef<HTMLInputElement | null>(null);

  const [outlineLoading, setOutlineLoading] = useState(true);
  const [outlineError, setOutlineError] = useState<ApiError | null>(null);
  const [options, setOptions] = useState<OutlineOption[]>([]);

  const [selectedId, setSelectedId] = useState<string>("");

  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<LessonFileAttachmentDto[]>([]);

  const [uploadDescription, setUploadDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const [replaceTarget, setReplaceTarget] = useState<LessonFileAttachmentDto | null>(null);
  const [replacing, setReplacing] = useState(false);

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

  const loadFilesForLesson = useCallback(
    async (lessonId: string): Promise<void> => {
      const seq = ++filesLoadSeq.current;
      setFilesLoading(true);
      setFilesError(null);
      setActionError(null);
      const res = await fetchLessonFileAttachments(session, courseId, lessonId);
      if (seq !== filesLoadSeq.current) {
        return;
      }
      if (!res.ok) {
        setFilesError(formatTenantAdminError(res.error));
        setAttachments([]);
        setFilesLoading(false);
        return;
      }
      setAttachments(res.attachments);
      setFilesLoading(false);
    },
    [session, courseId]
  );

  useEffect(() => {
    void loadOutline();
  }, [loadOutline]);

  useEffect(() => {
    if (!selectedId) {
      setAttachments([]);
      return;
    }
    void loadFilesForLesson(selectedId);
  }, [selectedId, loadFilesForLesson]);

  const sortedFiles = useMemo(() => sortLessonFiles(attachments), [attachments]);

  async function runUpload(
    file: File,
    description: string | null | undefined,
    oldAttachmentIdToArchive: string | null
  ): Promise<boolean> {
    if (!selectedId) {
      return false;
    }
    if (file.size < 1 || file.size > MAX_LESSON_FILE_BYTES) {
      setUploadError(`Files must be between 1 byte and ${formatByteSize(MAX_LESSON_FILE_BYTES)}.`);
      return false;
    }
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    setActionError(null);

    const mimeType = file.type.trim() || "application/octet-stream";
    const init = await initLessonFileUpload(session, courseId, selectedId, {
      fileName: file.name,
      mimeType,
      sizeBytes: file.size,
      description: description ?? null
    });
    if (!init.ok) {
      setUploadError(formatTenantAdminError(init.error));
      setUploading(false);
      setUploadProgress(null);
      return false;
    }

    try {
      await putPresignedUpload(init.upload, file, (pct) => {
        setUploadProgress(pct);
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setUploadError(
        `${message} The attachment record was still created; remove the failed attachment if it appears in the list, then try again.`
      );
      setUploading(false);
      setUploadProgress(null);
      await loadFilesForLesson(selectedId);
      return false;
    }

    if (oldAttachmentIdToArchive) {
      const arch = await archiveLessonFileAttachment(session, courseId, selectedId, oldAttachmentIdToArchive);
      if (!arch.ok) {
        setActionError(formatTenantAdminError(arch.error));
      }
    }

    await loadFilesForLesson(selectedId);
    setUploading(false);
    setUploadProgress(null);
    setReplaceTarget(null);
    return true;
  }

  function onPickAddFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const desc = uploadDescription.trim();
    void runUpload(file, desc.length > 0 ? desc : null, null).then((ok) => {
      if (ok) {
        setUploadDescription("");
      }
    });
  }

  function onPickReplaceFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !replaceTarget) {
      setReplaceTarget(null);
      return;
    }
    setReplacing(true);
    const desc = replaceTarget.description;
    const oldId = replaceTarget.id;
    void runUpload(file, desc, oldId).finally(() => {
      setReplacing(false);
      setReplaceTarget(null);
    });
  }

  function startEdit(row: LessonFileAttachmentDto): void {
    setEditingId(row.id);
    setEditFileName(row.fileName);
    setEditDescription(row.description ?? "");
    setActionError(null);
  }

  function cancelEdit(): void {
    setEditingId(null);
    setEditFileName("");
    setEditDescription("");
    setSavingEditId(null);
  }

  async function onSaveEdit(fileId: string): Promise<void> {
    const name = editFileName.trim();
    if (name.length === 0) {
      setActionError("File name is required.");
      return;
    }
    if (!selectedId) {
      return;
    }
    setSavingEditId(fileId);
    setActionError(null);
    const descTrim = editDescription.trim();
    const res = await patchLessonFileAttachment(session, courseId, selectedId, fileId, {
      fileName: name,
      description: descTrim.length === 0 ? null : descTrim
    });
    if (!res.ok) {
      setActionError(formatTenantAdminError(res.error));
      setSavingEditId(null);
      return;
    }
    setAttachments((prev) => prev.map((a) => (a.id === fileId ? res.attachment : a)));
    cancelEdit();
  }

  async function onRemove(fileId: string, label: string): Promise<void> {
    if (!selectedId) {
      return;
    }
    const ok = window.confirm(`Remove attachment “${label}” from this lesson?`);
    if (!ok) {
      return;
    }
    setActionError(null);
    const res = await archiveLessonFileAttachment(session, courseId, selectedId, fileId);
    if (!res.ok) {
      setActionError(formatTenantAdminError(res.error));
      return;
    }
    setAttachments((prev) => prev.filter((a) => a.id !== fileId));
    if (editingId === fileId) {
      cancelEdit();
    }
  }

  async function applyReorder(nextIds: string[]): Promise<void> {
    if (!selectedId) {
      return;
    }
    setReordering(true);
    setActionError(null);
    const res = await reorderLessonFileAttachments(session, courseId, selectedId, {
      orderedAttachmentIds: nextIds
    });
    if (!res.ok) {
      setActionError(formatTenantAdminError(res.error));
      void loadFilesForLesson(selectedId);
      setReordering(false);
      return;
    }
    setAttachments(res.attachments);
    setReordering(false);
  }

  async function swapOrder(fromIdx: number, toIdx: number): Promise<void> {
    if (!selectedId || fromIdx === toIdx) {
      return;
    }
    const sorted = sortLessonFiles(attachments);
    const next = sorted.map((a) => a.id);
    const a = next[fromIdx];
    const b = next[toIdx];
    if (a === undefined || b === undefined) {
      return;
    }
    next[fromIdx] = b;
    next[toIdx] = a;
    await applyReorder(next);
  }

  async function onStaffDownload(fileId: string): Promise<void> {
    if (!selectedId) {
      return;
    }
    setActionError(null);
    const res = await fetchLessonFileDownload(session, courseId, selectedId, fileId);
    if (!res.ok) {
      setActionError(formatTenantAdminError(res.error));
      return;
    }
    window.open(res.download.url, "_blank", "noopener,noreferrer");
  }

  function beginReplace(row: LessonFileAttachmentDto): void {
    setReplaceTarget(row);
    setActionError(null);
    replaceInputRef.current?.click();
  }

  if (outlineLoading) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Lesson file attachments</h2>
        <p style={{ margin: 0, fontSize: "0.875rem" }} aria-busy="true">
          Loading outline…
        </p>
      </div>
    );
  }

  if (outlineError) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Lesson file attachments</h2>
        <AdminLoadError error={outlineError} onRetry={() => void loadOutline()} />
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Lesson file attachments</h2>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          This course has no lessons yet. Add modules and lessons before attaching downloadable files.
        </p>
      </div>
    );
  }

  const busy = uploading || replacing || reordering;

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Lesson file attachments</h2>
      <p
        style={{
          margin: "0 0 var(--space-4)",
          fontSize: "0.875rem",
          color: "var(--color-text-muted)"
        }}
      >
        Uploads use secure object storage. Learners with enrollment see these files in the lesson Resources panel. Maximum
        size per file is {formatByteSize(MAX_LESSON_FILE_BYTES)}.
      </p>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label
          htmlFor="admin-files-lesson-picker"
          className={styles.label}
          style={{ display: "block", marginBottom: "var(--space-2)" }}
        >
          Lesson
        </label>
        <select
          id="admin-files-lesson-picker"
          className={`${styles.select} ${styles.selectFullWidth}`}
          value={selectedId}
          disabled={busy || savingEditId !== null}
          onChange={(e) => {
            setSelectedId(e.target.value);
            cancelEdit();
            setUploadDescription("");
            setUploadError(null);
            setUploadProgress(null);
          }}
        >
          {options.map((o) => (
            <option key={o.lessonId} value={o.lessonId}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {filesError ? (
        <p role="alert" style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-danger, #b42318)" }}>
          {filesError}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-danger, #b42318)" }}>
          {actionError}
        </p>
      ) : null}
      {uploadError ? (
        <p role="alert" style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-danger, #b42318)" }}>
          {uploadError}
        </p>
      ) : null}

      <input
        ref={replaceInputRef}
        type="file"
        className={styles.fileInput}
        aria-hidden
        tabIndex={-1}
        onChange={onPickReplaceFile}
      />

      {filesLoading ? (
        <p style={{ margin: "0 0 var(--space-4)", fontSize: "0.875rem" }} aria-busy="true">
          Loading attachments…
        </p>
      ) : sortedFiles.length === 0 ? (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <EmptyState
            title="No files yet"
            description="Add a file below. You can reorder items after there are at least two attachments."
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
          {sortedFiles.map((row, idx) => {
            const isEditing = editingId === row.id;
            const typeLabel = row.mimeType || "Unknown type";
            return (
              <li
                key={row.id}
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
                      <label className={styles.label} htmlFor={`file-name-${row.id}`}>
                        Display name
                      </label>
                      <input
                        id={`file-name-${row.id}`}
                        className={styles.input}
                        value={editFileName}
                        autoComplete="off"
                        onChange={(e) => {
                          setEditFileName(e.target.value);
                        }}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor={`file-desc-${row.id}`}>
                        Description (optional)
                      </label>
                      <textarea
                        id={`file-desc-${row.id}`}
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
                        onClick={() => void onSaveEdit(row.id)}
                      >
                        {savingEditId === row.id ? "Saving…" : "Save"}
                      </button>
                      <button type="button" className={styles.secondaryBtn} disabled={savingEditId !== null} onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{row.fileName}</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || idx === 0 || editingId !== null || busy}
                          aria-label={`Move ${row.fileName} up in the list`}
                          onClick={() => void swapOrder(idx, idx - 1)}
                        >
                          Move up
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || idx === sortedFiles.length - 1 || editingId !== null || busy}
                          aria-label={`Move ${row.fileName} down in the list`}
                          onClick={() => void swapOrder(idx, idx + 1)}
                        >
                          Move down
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || editingId !== null || busy}
                          onClick={() => void onStaffDownload(row.id)}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || editingId !== null || busy}
                          onClick={() => beginReplace(row)}
                        >
                          Replace file
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || editingId !== null || busy}
                          onClick={() => {
                            startEdit(row);
                          }}
                        >
                          Edit details
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={reordering || editingId !== null || busy}
                          onClick={() => void onRemove(row.id, row.fileName)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                      {formatByteSize(row.sizeBytes)} · {typeLabel}
                    </p>
                    {row.description ? (
                      <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.875rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {row.description}
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
          Add file
        </h3>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-files-upload-desc">
            Description (optional)
          </label>
          <textarea
            id="admin-files-upload-desc"
            className={styles.textarea}
            rows={2}
            value={uploadDescription}
            disabled={filesLoading || busy}
            onChange={(e) => {
              setUploadDescription(e.target.value);
            }}
          />
        </div>
        <input
          ref={addInputRef}
          id="admin-files-file-input"
          type="file"
          className={styles.fileInput}
          aria-hidden
          tabIndex={-1}
          disabled={filesLoading || busy}
          onChange={onPickAddFile}
        />
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={filesLoading || busy || !selectedId}
          aria-busy={uploading}
          onClick={() => addInputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Choose file"}
        </button>
        {uploadProgress !== null ? (
          <div style={{ marginTop: "var(--space-3)" }}>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadProgress}
              aria-label="Upload progress"
              style={{
                height: 8,
                borderRadius: 4,
                background: "var(--color-border)",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: "100%",
                  background: "var(--color-text-muted)",
                  transition: "width 120ms ease-out"
                }}
              />
            </div>
            <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              {uploadProgress}% uploaded
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
