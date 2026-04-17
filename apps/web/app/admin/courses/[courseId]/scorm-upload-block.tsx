"use client";

import type { LessonContentKind, LessonScormPackageDto, LessonScormUploadInitBody } from "@conductor/contracts";
import { LESSON_SCORM_ZIP_MAX_BYTES } from "@conductor/contracts";
import type { ChangeEvent, DragEvent, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchLessonScormPackage,
  fetchStaffCourseLessonOutline,
  formatTenantAdminError,
  initLessonScormPackageUpload,
  patchLessonForStaff,
  postLessonScormPackageProcess,
  type ApiError,
  type LmsApiSession
} from "../../../../lib/lms-api-client";
import { AdminLoadError } from "../../admin-page-states";
import styles from "./course-wireframe.module.css";

type OutlineOption = {
  lessonId: string;
  label: string;
  contentKind: LessonContentKind;
};

type ScormUploadBlockProps = {
  session: LmsApiSession;
  courseId: string;
};

function contentKindSuffix(kind: LessonContentKind): string {
  switch (kind) {
    case "VIDEO":
      return " (video)";
    case "MIXED":
      return " (mixed)";
    case "SCORM":
      return " (scorm)";
    default:
      return "";
  }
}

function putScormZipUpload(url: string, headers: Record<string, string>, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [key, value] of Object.entries(headers)) {
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

export function ScormUploadBlock({ session, courseId }: ScormUploadBlockProps): ReactElement {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pkgLoadSeq = useRef(0);

  const [outlineLoading, setOutlineLoading] = useState(true);
  const [outlineError, setOutlineError] = useState<ApiError | null>(null);
  const [options, setOptions] = useState<OutlineOption[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const [pkgLoading, setPkgLoading] = useState(false);
  const [pkgError, setPkgError] = useState<string | null>(null);
  const [pkg, setPkg] = useState<LessonScormPackageDto | null>(null);

  const [convertLoading, setConvertLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
            label: `${m.title} — ${l.title}${contentKindSuffix(l.contentKind)}`,
            contentKind: l.contentKind
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

  useEffect(() => {
    void loadOutline();
  }, [loadOutline]);

  const selectedMeta = useMemo(() => options.find((o) => o.lessonId === selectedId), [options, selectedId]);

  const loadPackage = useCallback(
    async (lessonId: string): Promise<void> => {
      const seq = ++pkgLoadSeq.current;
      setPkgLoading(true);
      setPkgError(null);
      const res = await fetchLessonScormPackage(session, courseId, lessonId);
      if (seq !== pkgLoadSeq.current) {
        return;
      }
      if (!res.ok) {
        setPkgError(formatTenantAdminError(res.error));
        setPkg(null);
        setPkgLoading(false);
        return;
      }
      setPkg(res.pkg);
      setPkgLoading(false);
    },
    [session, courseId]
  );

  useEffect(() => {
    if (!selectedId) {
      setPkg(null);
      setPkgLoading(false);
      setPkgError(null);
      return;
    }
    void loadPackage(selectedId);
  }, [selectedId, loadPackage]);

  async function onConvertToScorm(): Promise<void> {
    if (!selectedId || selectedMeta?.contentKind === "SCORM") {
      return;
    }
    setConvertLoading(true);
    setActionError(null);
    setActionMessage(null);
    const res = await patchLessonForStaff(session, courseId, selectedId, { contentKind: "SCORM" });
    if (!res.ok) {
      setActionError(formatTenantAdminError(res.error));
      setConvertLoading(false);
      return;
    }
    await loadOutline({ quiet: true });
    setConvertLoading(false);
    setActionMessage("Lesson is now SCORM. Upload a package below.");
  }

  async function runUpload(file: File): Promise<void> {
    if (!selectedId || selectedMeta?.contentKind !== "SCORM") {
      setActionError("Pick a SCORM lesson first (or convert the selected lesson).");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setActionError("Choose a .zip SCORM package.");
      return;
    }
    if (file.size > LESSON_SCORM_ZIP_MAX_BYTES) {
      setActionError(`Package is too large (max ${Math.round(LESSON_SCORM_ZIP_MAX_BYTES / (1024 * 1024))} MB).`);
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setUploading(true);
    setUploadProgress(0);

    const body: LessonScormUploadInitBody = {
      fileName: file.name,
      mimeType: file.type && file.type.length > 0 ? file.type : "application/zip",
      sizeBytes: file.size
    };
    const init = await initLessonScormPackageUpload(session, courseId, selectedId, body);
    if (!init.ok) {
      setActionError(formatTenantAdminError(init.error));
      setUploading(false);
      setUploadProgress(null);
      return;
    }

    try {
      await putScormZipUpload(init.upload.url, init.upload.headers, file, (pct) => {
        setUploadProgress(pct);
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Upload failed.");
      setUploading(false);
      setUploadProgress(null);
      return;
    }

    setUploading(false);
    setUploadProgress(null);
    setProcessing(true);
    const proc = await postLessonScormPackageProcess(session, courseId, selectedId);
    setProcessing(false);
    if (!proc.ok) {
      setActionError(formatTenantAdminError(proc.error));
      await loadPackage(selectedId);
      return;
    }
    if (proc.pkg.status === "FAILED") {
      setActionError(proc.pkg.processingError ?? "Package processing failed.");
    } else {
      setActionMessage("Package processed. Learners can launch it when the lesson is published.");
    }
    await loadPackage(selectedId);
  }

  function onFileChange(ev: ChangeEvent<HTMLInputElement>): void {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (file) {
      void runUpload(file);
    }
  }

  function onDrop(ev: DragEvent): void {
    ev.preventDefault();
    const file = ev.dataTransfer.files[0];
    if (file) {
      void runUpload(file);
    }
  }

  if (outlineLoading) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>SCORM package</h2>
        <p className={styles.hint} role="status">
          Loading course outline…
        </p>
      </div>
    );
  }

  if (outlineError) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>SCORM package</h2>
        <AdminLoadError error={outlineError} onRetry={() => void loadOutline()} />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>SCORM package</h2>
      <p className={styles.hint} style={{ marginTop: 0 }}>
        Upload a SCORM 1.2 zip to a lesson. The manifest is validated on the server; SCORM 2004 packages are rejected.
      </p>

      <label className={styles.hint} htmlFor="scorm-lesson-select" style={{ display: "block", marginBottom: "var(--space-2)" }}>
        Lesson
      </label>
      <select
        id="scorm-lesson-select"
        value={selectedId}
        onChange={(e) => {
          setSelectedId(e.target.value);
        }}
        style={{ width: "100%", marginBottom: "var(--space-3)" }}
      >
        {options.map((o) => (
          <option key={o.lessonId} value={o.lessonId}>
            {o.label}
          </option>
        ))}
      </select>

      {selectedMeta?.contentKind !== "SCORM" ? (
        <div style={{ marginBottom: "var(--space-3)" }}>
          <p className={styles.hint} role="status">
            Selected lesson is <strong>{selectedMeta?.contentKind ?? "unknown"}</strong>. Convert it to SCORM before uploading
            a package.
          </p>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={convertLoading || !selectedId}
            onClick={() => void onConvertToScorm()}
          >
            {convertLoading ? "Converting…" : "Use lesson as SCORM"}
          </button>
        </div>
      ) : null}

      {selectedMeta?.contentKind === "SCORM" ? (
        <>
          {pkgLoading ? (
            <p className={styles.hint} role="status">
              Loading package status…
            </p>
          ) : pkgError ? (
            <p className={styles.hint} role="alert">
              {pkgError}
            </p>
          ) : pkg ? (
            <div className={styles.hint} role="status" style={{ marginBottom: "var(--space-3)" }}>
              <strong>Status:</strong> {pkg.status}
              {pkg.manifestProfile ? (
                <>
                  {" "}
                  · <strong>Manifest:</strong> {pkg.manifestProfile}
                </>
              ) : null}
              {pkg.launchPath ? (
                <>
                  {" "}
                  · <strong>Launch:</strong> {pkg.launchPath}
                </>
              ) : null}
              {pkg.processingError ? (
                <>
                  <br />
                  <span style={{ color: "var(--color-danger, #b42318)" }}>{pkg.processingError}</span>
                </>
              ) : null}
            </div>
          ) : (
            <p className={styles.hint} role="status">
              No package uploaded yet for this lesson.
            </p>
          )}

          <div
            className={styles.scormZone}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              void onDrop(e);
            }}
          >
            <input
              ref={inputRef}
              className={styles.fileInput}
              type="file"
              accept=".zip,application/zip"
              onChange={onFileChange}
            />
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={uploading || processing}
              onClick={() => {
                inputRef.current?.click();
              }}
            >
              {uploading ? "Uploading…" : processing ? "Processing…" : "Select or drop .zip"}
            </button>
            {uploadProgress != null ? (
              <p className={styles.hint} role="status">
                Upload {uploadProgress}%
              </p>
            ) : (
              <p className={styles.hint}>Max {Math.round(LESSON_SCORM_ZIP_MAX_BYTES / (1024 * 1024))} MB · replaces prior package</p>
            )}
          </div>
        </>
      ) : null}

      {actionError ? (
        <p className={styles.hint} role="alert" style={{ color: "var(--color-danger, #b42318)", marginTop: "var(--space-3)" }}>
          {actionError}
        </p>
      ) : null}
      {actionMessage ? (
        <p className={styles.hint} role="status" style={{ marginTop: "var(--space-3)" }}>
          {actionMessage}
        </p>
      ) : null}
    </div>
  );
}
