"use client";

import type { LessonContentKind, LessonVideoCaptionTrackDto } from "@conductor/contracts";
import { isSafeHttpUrl } from "@conductor/contracts";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchLessonForStaff,
  fetchStaffCourseLessonOutline,
  formatTenantAdminError,
  patchLessonForStaff,
  type ApiError,
  type LmsApiSession
} from "../../../../lib/lms-api-client";
import { AdminLoadError } from "../../admin-page-states";
import styles from "./course-wireframe.module.css";

const MAX_CAPTION_TRACKS = 32;

type VideoLessonEditorProps = {
  session: LmsApiSession;
  courseId: string;
};

type OutlineOption = {
  lessonId: string;
  label: string;
  contentKind: LessonContentKind;
};

function emptyCaption(): LessonVideoCaptionTrackDto {
  return { src: "", label: "", srclang: "" };
}

export function VideoLessonEditor({ session, courseId }: VideoLessonEditorProps): ReactElement {
  const lessonLoadSeq = useRef(0);

  const [outlineLoading, setOutlineLoading] = useState(true);
  const [outlineError, setOutlineError] = useState<ApiError | null>(null);
  const [options, setOptions] = useState<OutlineOption[]>([]);

  const [selectedId, setSelectedId] = useState<string>("");

  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonLoadError, setLessonLoadError] = useState<string | null>(null);

  const [lessonTitle, setLessonTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [captions, setCaptions] = useState<LessonVideoCaptionTrackDto[]>([]);

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
          const suffix =
            l.contentKind === "VIDEO" ? " (video)" : l.contentKind === "MIXED" ? " (mixed)" : "";
          flat.push({
            lessonId: l.id,
            label: `${m.title} — ${l.title}${suffix}`,
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

  const loadVideoLesson = useCallback(
    async (lessonId: string): Promise<void> => {
      const seq = ++lessonLoadSeq.current;
      setLessonLoading(true);
      setLessonLoadError(null);
      setSaveError(null);
      setSaveMessage(null);
      const res = await fetchLessonForStaff(session, courseId, lessonId);
      if (seq !== lessonLoadSeq.current) {
        return;
      }
      if (!res.ok) {
        setLessonLoadError(formatTenantAdminError(res.error));
        setLessonTitle("");
        setSourceUrl("");
        setPosterUrl("");
        setCaptions([]);
        setLessonLoading(false);
        return;
      }
      const lesson = res.lesson;
      if (lesson.contentKind !== "VIDEO") {
        setLessonLoadError(null);
        setLessonTitle("");
        setSourceUrl("");
        setPosterUrl("");
        setCaptions([]);
        setLessonLoading(false);
        return;
      }
      setLessonTitle(lesson.title);
      const asset = lesson.videoAsset;
      setSourceUrl(asset?.sourceUrl ?? "");
      setPosterUrl(asset?.posterUrl ?? "");
      setCaptions(asset?.captions?.map((c: LessonVideoCaptionTrackDto) => ({ ...c })) ?? []);
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
    if (selectedMeta.contentKind !== "VIDEO") {
      setLessonLoading(false);
      setLessonLoadError(null);
      setLessonTitle("");
      setSourceUrl("");
      setPosterUrl("");
      setCaptions([]);
      return;
    }
    void loadVideoLesson(selectedId);
  }, [selectedId, selectedMeta, loadVideoLesson]);

  function validate(): string | null {
    const src = sourceUrl.trim();
    if (src.length === 0) {
      return "Video URL is required.";
    }
    if (!isSafeHttpUrl(src)) {
      return "Video URL must start with http:// or https://.";
    }
    const poster = posterUrl.trim();
    if (poster.length > 0 && !isSafeHttpUrl(poster)) {
      return "Poster URL must start with http:// or https://.";
    }
    for (let i = 0; i < captions.length; i++) {
      const cap = captions[i];
      if (!cap) {
        continue;
      }
      if (!isSafeHttpUrl(cap.src.trim())) {
        return `Caption ${i + 1}: track file URL must use http or https.`;
      }
      if (cap.label.trim().length === 0 || cap.srclang.trim().length === 0) {
        return `Caption ${i + 1}: label and language code are required.`;
      }
    }
    return null;
  }

  async function onSave(): Promise<void> {
    if (!selectedId || selectedMeta?.contentKind !== "VIDEO") {
      return;
    }
    const msg = validate();
    if (msg) {
      setSaveError(msg);
      setSaveMessage(null);
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    const poster = posterUrl.trim();
    const caps =
      captions.length > 0
        ? captions.map((c) => ({
            src: c.src.trim(),
            label: c.label.trim(),
            srclang: c.srclang.trim(),
            ...(c.isDefault === true ? { isDefault: true as const } : {})
          }))
        : undefined;
    const res = await patchLessonForStaff(session, courseId, selectedId, {
      videoAsset: {
        sourceUrl: sourceUrl.trim(),
        posterUrl: poster === "" ? null : poster,
        captions: caps
      }
    });
    if (!res.ok) {
      setSaveError(formatTenantAdminError(res.error));
      setSaving(false);
      return;
    }
    const lesson = res.lesson;
    setLessonTitle(lesson.title);
    const asset = lesson.videoAsset;
    setSourceUrl(asset?.sourceUrl ?? "");
    setPosterUrl(asset?.posterUrl ?? "");
    setCaptions(asset?.captions?.map((c: LessonVideoCaptionTrackDto) => ({ ...c })) ?? []);
    setSaveMessage("Saved.");
    setSaving(false);
  }

  if (outlineLoading) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Video lessons</h2>
        <p style={{ margin: 0, fontSize: "0.875rem" }} aria-busy="true">
          Loading outline…
        </p>
      </div>
    );
  }

  if (outlineError) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Video lessons</h2>
        <AdminLoadError error={outlineError} onRetry={() => void loadOutline()} />
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Video lessons</h2>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          This course has no lessons yet. Add modules and lessons before configuring video sources here.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Video lesson source</h2>
      <p
        style={{
          margin: "0 0 var(--space-4)",
          fontSize: "0.875rem",
          color: "var(--color-text-muted)"
        }}
      >
        Set the primary video URL (and optional poster and captions) for lessons with content kind VIDEO. URLs must use
        http or https, matching mixed-lesson and resource link rules.
      </p>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label
          htmlFor="admin-video-lesson-picker"
          style={{ display: "block", fontSize: "0.875rem", marginBottom: "var(--space-2)" }}
        >
          Lesson
        </label>
        <select
          id="admin-video-lesson-picker"
          className={`${styles.select} ${styles.selectFullWidth}`}
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
          }}
        >
          {options.map((o) => (
            <option key={o.lessonId} value={o.lessonId}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {selectedMeta?.contentKind !== "VIDEO" ? (
        <p role="status" style={{ margin: 0, fontSize: "0.875rem" }}>
          This lesson is not a video lesson (content kind {selectedMeta?.contentKind ?? "unknown"}). Video source editing
          applies to VIDEO lessons only.
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
              Loading lesson…
            </p>
          ) : null}

          {!lessonLoading && !lessonLoadError ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <div>
                  <label
                    htmlFor="admin-video-source-url"
                    style={{ display: "block", fontSize: "0.8125rem", marginBottom: "var(--space-1)" }}
                  >
                    Video URL (https)
                  </label>
                  <input
                    id="admin-video-source-url"
                    className={styles.input}
                    type="url"
                    autoComplete="off"
                    value={sourceUrl}
                    onChange={(e) => {
                      setSourceUrl(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="admin-video-poster-url"
                    style={{ display: "block", fontSize: "0.8125rem", marginBottom: "var(--space-1)" }}
                  >
                    Poster image URL (optional)
                  </label>
                  <input
                    id="admin-video-poster-url"
                    className={styles.input}
                    type="url"
                    autoComplete="off"
                    value={posterUrl}
                    onChange={(e) => {
                      setPosterUrl(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.8125rem", fontWeight: 600 }}>Caption tracks</p>
                  <ul
                    style={{
                      margin: 0,
                      padding: 0,
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-2)"
                    }}
                  >
                    {captions.map((cap, capIdx) => (
                      <li
                        key={`cap-${capIdx}`}
                        style={{
                          display: "grid",
                          gap: "var(--space-2)",
                          gridTemplateColumns: "1fr 1fr",
                          alignItems: "end"
                        }}
                      >
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label
                            htmlFor={`admin-video-cap-src-${capIdx}`}
                            style={{ display: "block", fontSize: "0.75rem", marginBottom: "var(--space-1)" }}
                          >
                            WebVTT URL
                          </label>
                          <input
                            id={`admin-video-cap-src-${capIdx}`}
                            className={styles.input}
                            type="url"
                            value={cap.src}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCaptions((prev) => prev.map((c, i) => (i === capIdx ? { ...c, src: v } : c)));
                            }}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`admin-video-cap-label-${capIdx}`}
                            style={{ display: "block", fontSize: "0.75rem", marginBottom: "var(--space-1)" }}
                          >
                            Label
                          </label>
                          <input
                            id={`admin-video-cap-label-${capIdx}`}
                            className={styles.input}
                            type="text"
                            value={cap.label}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCaptions((prev) => prev.map((c, i) => (i === capIdx ? { ...c, label: v } : c)));
                            }}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`admin-video-cap-lang-${capIdx}`}
                            style={{ display: "block", fontSize: "0.75rem", marginBottom: "var(--space-1)" }}
                          >
                            Language
                          </label>
                          <input
                            id={`admin-video-cap-lang-${capIdx}`}
                            className={styles.input}
                            type="text"
                            inputMode="text"
                            autoComplete="off"
                            value={cap.srclang}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCaptions((prev) => prev.map((c, i) => (i === capIdx ? { ...c, srclang: v } : c)));
                            }}
                          />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={() => {
                              setCaptions((prev) => prev.filter((_, i) => i !== capIdx));
                            }}
                          >
                            Remove caption
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    style={{ marginTop: "var(--space-2)" }}
                    disabled={captions.length >= MAX_CAPTION_TRACKS}
                    onClick={() => {
                      setCaptions((prev) => (prev.length >= MAX_CAPTION_TRACKS ? prev : [...prev, emptyCaption()]));
                    }}
                  >
                    Add caption track
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
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
                <button type="button" className={styles.primaryBtn} disabled={saving} onClick={() => void onSave()}>
                  {saving ? "Saving…" : "Save video source"}
                </button>
              </div>

              <p style={{ margin: "var(--space-4) 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                {lessonTitle}
              </p>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
