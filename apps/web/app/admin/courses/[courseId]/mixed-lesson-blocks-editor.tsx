"use client";

import type { LessonContentKind, LessonMixedBlockLearner, LessonMixedBlockPutItem, LessonVideoCaptionTrackDto } from "@conductor/contracts";
import { isSafeHttpUrl } from "@conductor/contracts";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchLessonMixedBlocks,
  fetchStaffCourseLessonOutline,
  formatTenantAdminError,
  patchLessonForStaff,
  putLessonMixedBlocks,
  type ApiError,
  type LmsApiSession
} from "../../../../lib/lms-api-client";
import { AdminLoadError } from "../../admin-page-states";
import styles from "./course-wireframe.module.css";

const MAX_MIXED_BLOCKS = 64;
const MAX_READING_HTML = 500_000;

type OutlineOption = {
  lessonId: string;
  label: string;
  contentKind: LessonContentKind;
};

type DraftReading = { clientKey: string; kind: "READING"; html: string };
type DraftVideo = {
  clientKey: string;
  kind: "VIDEO";
  sourceUrl: string;
  posterUrl: string;
  captions: LessonVideoCaptionTrackDto[];
};
type DraftBlock = DraftReading | DraftVideo;

type MixedLessonBlocksEditorProps = {
  session: LmsApiSession;
  courseId: string;
};

function newClientKey(): string {
  return globalThis.crypto.randomUUID();
}

function learnerBlocksToDraft(blocks: LessonMixedBlockLearner[]): DraftBlock[] {
  return blocks.map((b) => {
    if (b.blockType === "READING") {
      return { clientKey: newClientKey(), kind: "READING", html: b.html ?? "" };
    }
    return {
      clientKey: newClientKey(),
      kind: "VIDEO",
      sourceUrl: b.video.src,
      posterUrl: b.video.poster ?? "",
      captions: b.video.captions.map((c) => ({ ...c }))
    };
  });
}

function draftsToPutItems(drafts: DraftBlock[]): LessonMixedBlockPutItem[] {
  return drafts.map((d) => {
    if (d.kind === "READING") {
      return { blockType: "READING", reading: { html: d.html } };
    }
    const poster = d.posterUrl.trim();
    return {
      blockType: "VIDEO",
      video: {
        sourceUrl: d.sourceUrl.trim(),
        posterUrl: poster === "" ? null : poster,
        captions: d.captions.length > 0 ? d.captions : undefined
      }
    };
  });
}

function validateDrafts(drafts: DraftBlock[]): string | null {
  if (drafts.length > MAX_MIXED_BLOCKS) {
    return `A mixed lesson can have at most ${MAX_MIXED_BLOCKS} segments.`;
  }
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    if (!d) {
      continue;
    }
    if (d.kind === "READING") {
      if (d.html.length > MAX_READING_HTML) {
        return `Segment ${i + 1} (reading): HTML is too large (max ${MAX_READING_HTML} characters).`;
      }
    } else {
      const url = d.sourceUrl.trim();
      if (url.length === 0) {
        return `Segment ${i + 1} (video): Video URL is required.`;
      }
      if (!isSafeHttpUrl(url)) {
        return `Segment ${i + 1} (video): Video URL must start with http:// or https://.`;
      }
      const poster = d.posterUrl.trim();
      if (poster.length > 0 && !isSafeHttpUrl(poster)) {
        return `Segment ${i + 1} (video): Poster URL must start with http:// or https://.`;
      }
      for (let c = 0; c < d.captions.length; c++) {
        const cap = d.captions[c];
        if (!cap) {
          continue;
        }
        if (!isSafeHttpUrl(cap.src.trim())) {
          return `Segment ${i + 1} (video), caption ${c + 1}: Caption file URL must use http or https.`;
        }
        if (cap.label.trim().length === 0 || cap.srclang.trim().length === 0) {
          return `Segment ${i + 1} (video), caption ${c + 1}: Label and language code are required.`;
        }
      }
    }
  }
  return null;
}

export function MixedLessonBlocksEditor({ session, courseId }: MixedLessonBlocksEditorProps): ReactElement {
  const blocksLoadSeq = useRef(0);

  const [outlineLoading, setOutlineLoading] = useState(true);
  const [outlineError, setOutlineError] = useState<ApiError | null>(null);
  const [options, setOptions] = useState<OutlineOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const [blocksLoading, setBlocksLoading] = useState(false);
  const [blocksLoadError, setBlocksLoadError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftBlock[]>([]);

  const [convertLoading, setConvertLoading] = useState(false);
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

  const loadBlocksForLesson = useCallback(
    async (lessonId: string): Promise<void> => {
      const seq = ++blocksLoadSeq.current;
      setBlocksLoading(true);
      setBlocksLoadError(null);
      setSaveError(null);
      setSaveMessage(null);
      const res = await fetchLessonMixedBlocks(session, courseId, lessonId);
      if (seq !== blocksLoadSeq.current) {
        return;
      }
      if (!res.ok) {
        setBlocksLoadError(formatTenantAdminError(res.error));
        setDrafts([]);
        setBlocksLoading(false);
        return;
      }
      setDrafts(learnerBlocksToDraft(res.blocks));
      setBlocksLoading(false);
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
    if (selectedMeta.contentKind !== "MIXED") {
      setBlocksLoading(false);
      setBlocksLoadError(null);
      setDrafts([]);
      return;
    }
    void loadBlocksForLesson(selectedId);
  }, [selectedId, selectedMeta, loadBlocksForLesson]);

  async function onConvertToMixed(): Promise<void> {
    if (!selectedId || selectedMeta?.contentKind === "MIXED") {
      return;
    }
    setConvertLoading(true);
    setSaveError(null);
    setSaveMessage(null);
    const res = await patchLessonForStaff(session, courseId, selectedId, { contentKind: "MIXED" });
    if (!res.ok) {
      setSaveError(formatTenantAdminError(res.error));
      setConvertLoading(false);
      return;
    }
    await loadOutline({ quiet: true });
    setConvertLoading(false);
    setSaveMessage("Lesson is now mixed. Add segments below, then save.");
  }

  function moveBlock(index: number, direction: -1 | 1): void {
    setDrafts((prev) => {
      const next = [...prev];
      const j = index + direction;
      if (j < 0 || j >= next.length) {
        return prev;
      }
      const a = next[index];
      const b = next[j];
      if (!a || !b) {
        return prev;
      }
      next[index] = b;
      next[j] = a;
      return next;
    });
  }

  function removeBlock(index: number): void {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function addReading(): void {
    setDrafts((prev) => {
      if (prev.length >= MAX_MIXED_BLOCKS) {
        return prev;
      }
      return [...prev, { clientKey: newClientKey(), kind: "READING", html: "" }];
    });
  }

  function addVideo(): void {
    setDrafts((prev) => {
      if (prev.length >= MAX_MIXED_BLOCKS) {
        return prev;
      }
      return [...prev, { clientKey: newClientKey(), kind: "VIDEO", sourceUrl: "", posterUrl: "", captions: [] }];
    });
  }

  async function onSaveSegments(): Promise<void> {
    if (!selectedId || selectedMeta?.contentKind !== "MIXED") {
      return;
    }
    const err = validateDrafts(drafts);
    if (err) {
      setSaveError(err);
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    const res = await putLessonMixedBlocks(session, courseId, selectedId, draftsToPutItems(drafts));
    if (!res.ok) {
      setSaveError(formatTenantAdminError(res.error));
      setSaving(false);
      return;
    }
    setDrafts(learnerBlocksToDraft(res.blocks));
    setSaveMessage("Segments saved.");
    setSaving(false);
  }

  if (outlineLoading) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Mixed lesson segments</h2>
        <p style={{ margin: 0, fontSize: "0.875rem" }} aria-busy="true">
          Loading outline…
        </p>
      </div>
    );
  }

  if (outlineError) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Mixed lesson segments</h2>
        <AdminLoadError error={outlineError} onRetry={() => void loadOutline()} />
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Mixed lesson segments</h2>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          This course has no lessons yet. Add modules and lessons before assembling mixed content here.
        </p>
      </div>
    );
  }

  const isMixed = selectedMeta?.contentKind === "MIXED";

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Mixed lesson segments</h2>
      <p
        style={{
          margin: "0 0 var(--space-4)",
          fontSize: "0.875rem",
          color: "var(--color-text-muted)"
        }}
      >
        Build an ordered list of reading and video segments for mixed lessons. The learner player shows them in order.
        Changing a lesson away from mixed in the API removes all segments. Converting a video lesson to mixed clears the
        top-level video fields; re-add video as a segment below.
      </p>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label
          htmlFor="admin-mixed-lesson-picker"
          style={{ display: "block", fontSize: "0.875rem", marginBottom: "var(--space-2)" }}
        >
          Lesson
        </label>
        <select
          id="admin-mixed-lesson-picker"
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

      {!isMixed ? (
        <div
          style={{
            padding: "var(--space-4)",
            border: "1px dashed var(--color-border-strong)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-surface-subtle, var(--color-surface))"
          }}
        >
          <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem" }}>
            This lesson is <strong>{selectedMeta?.contentKind ?? "unknown"}</strong>. Convert it to mixed to author
            segments here.
          </p>
          {selectedMeta?.contentKind === "VIDEO" ? (
            <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              Note: converting from video clears the lesson-level video configuration. Add one or more video segments
              after conversion if you still need playback.
            </p>
          ) : null}
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={convertLoading || !selectedId}
            onClick={() => void onConvertToMixed()}
          >
            {convertLoading ? "Converting…" : "Convert lesson to mixed"}
          </button>
        </div>
      ) : (
        <>
          {blocksLoadError ? (
            <p role="alert" style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-danger, #b42318)" }}>
              {blocksLoadError}
            </p>
          ) : null}
          {blocksLoading ? (
            <p style={{ margin: "0 0 var(--space-4)", fontSize: "0.875rem" }} aria-busy="true">
              Loading segments…
            </p>
          ) : (
            <section>
              <ol
                aria-label="Lesson segments in playback order"
                style={{ margin: "0 0 var(--space-4)", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
              >
                {drafts.map((block, index) => (
                  <li
                    key={block.clientKey}
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "var(--space-4)"
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center", marginBottom: "var(--space-3)" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        Segment {index + 1} — {block.kind === "READING" ? "Reading" : "Video"}
                      </span>
                      <span style={{ flex: "1 1 auto" }} />
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        aria-label={`Move segment ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => {
                          moveBlock(index, -1);
                        }}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        aria-label={`Move segment ${index + 1} down`}
                        disabled={index >= drafts.length - 1}
                        onClick={() => {
                          moveBlock(index, 1);
                        }}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        aria-label={`Remove segment ${index + 1}`}
                        onClick={() => {
                          removeBlock(index);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    {block.kind === "READING" ? (
                      <textarea
                        className={styles.textarea}
                        style={{ minHeight: "160px" }}
                        aria-label={`Reading HTML for segment ${index + 1}`}
                        rows={8}
                        value={block.html}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDrafts((prev) =>
                            prev.map((b) => (b.clientKey === block.clientKey && b.kind === "READING" ? { ...b, html: v } : b))
                          );
                        }}
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                        <div>
                          <label
                            htmlFor={`mixed-v-src-${block.clientKey}`}
                            style={{ display: "block", fontSize: "0.8125rem", marginBottom: "var(--space-1)" }}
                          >
                            Video URL (https)
                          </label>
                          <input
                            id={`mixed-v-src-${block.clientKey}`}
                            className={styles.input}
                            type="url"
                            autoComplete="off"
                            value={block.sourceUrl}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDrafts((prev) =>
                                prev.map((b) => (b.clientKey === block.clientKey && b.kind === "VIDEO" ? { ...b, sourceUrl: v } : b))
                              );
                            }}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`mixed-v-poster-${block.clientKey}`}
                            style={{ display: "block", fontSize: "0.8125rem", marginBottom: "var(--space-1)" }}
                          >
                            Poster image URL (optional)
                          </label>
                          <input
                            id={`mixed-v-poster-${block.clientKey}`}
                            className={styles.input}
                            type="url"
                            autoComplete="off"
                            value={block.posterUrl}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDrafts((prev) =>
                                prev.map((b) => (b.clientKey === block.clientKey && b.kind === "VIDEO" ? { ...b, posterUrl: v } : b))
                              );
                            }}
                          />
                        </div>
                        <div>
                          <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.8125rem", fontWeight: 600 }}>Caption tracks</p>
                          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                            {block.captions.map((cap, capIdx) => (
                              <li
                                key={`${block.clientKey}-cap-${capIdx}`}
                                style={{
                                  display: "grid",
                                  gap: "var(--space-2)",
                                  gridTemplateColumns: "1fr 1fr",
                                  alignItems: "end"
                                }}
                              >
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <label
                                    htmlFor={`cap-src-${block.clientKey}-${capIdx}`}
                                    style={{ display: "block", fontSize: "0.75rem", marginBottom: "var(--space-1)" }}
                                  >
                                    WebVTT URL
                                  </label>
                                  <input
                                    id={`cap-src-${block.clientKey}-${capIdx}`}
                                    className={styles.input}
                                    type="url"
                                    value={cap.src}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setDrafts((prev) =>
                                        prev.map((b) => {
                                          if (b.clientKey !== block.clientKey || b.kind !== "VIDEO") {
                                            return b;
                                          }
                                          const caps = b.captions.map((c, i) => (i === capIdx ? { ...c, src: v } : c));
                                          return { ...b, captions: caps };
                                        })
                                      );
                                    }}
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor={`cap-label-${block.clientKey}-${capIdx}`}
                                    style={{ display: "block", fontSize: "0.75rem", marginBottom: "var(--space-1)" }}
                                  >
                                    Label
                                  </label>
                                  <input
                                    id={`cap-label-${block.clientKey}-${capIdx}`}
                                    className={styles.input}
                                    type="text"
                                    value={cap.label}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setDrafts((prev) =>
                                        prev.map((b) => {
                                          if (b.clientKey !== block.clientKey || b.kind !== "VIDEO") {
                                            return b;
                                          }
                                          const caps = b.captions.map((c, i) => (i === capIdx ? { ...c, label: v } : c));
                                          return { ...b, captions: caps };
                                        })
                                      );
                                    }}
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor={`cap-lang-${block.clientKey}-${capIdx}`}
                                    style={{ display: "block", fontSize: "0.75rem", marginBottom: "var(--space-1)" }}
                                  >
                                    Language
                                  </label>
                                  <input
                                    id={`cap-lang-${block.clientKey}-${capIdx}`}
                                    className={styles.input}
                                    type="text"
                                    inputMode="text"
                                    autoComplete="off"
                                    value={cap.srclang}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setDrafts((prev) =>
                                        prev.map((b) => {
                                          if (b.clientKey !== block.clientKey || b.kind !== "VIDEO") {
                                            return b;
                                          }
                                          const caps = b.captions.map((c, i) => (i === capIdx ? { ...c, srclang: v } : c));
                                          return { ...b, captions: caps };
                                        })
                                      );
                                    }}
                                  />
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <button
                                    type="button"
                                    className={styles.secondaryBtn}
                                    onClick={() => {
                                      setDrafts((prev) =>
                                        prev.map((b) => {
                                          if (b.clientKey !== block.clientKey || b.kind !== "VIDEO") {
                                            return b;
                                          }
                                          return { ...b, captions: b.captions.filter((_, i) => i !== capIdx) };
                                        })
                                      );
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
                            disabled={block.captions.length >= 32}
                            onClick={() => {
                              setDrafts((prev) =>
                                prev.map((b) => {
                                  if (b.clientKey !== block.clientKey || b.kind !== "VIDEO") {
                                    return b;
                                  }
                                  if (b.captions.length >= 32) {
                                    return b;
                                  }
                                  return {
                                    ...b,
                                    captions: [...b.captions, { src: "", label: "", srclang: "" }]
                                  };
                                })
                              );
                            }}
                          >
                            Add caption track
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={drafts.length >= MAX_MIXED_BLOCKS || blocksLoading}
              onClick={addReading}
            >
              Add reading segment
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={drafts.length >= MAX_MIXED_BLOCKS || blocksLoading}
              onClick={addVideo}
            >
              Add video segment
            </button>
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
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={saving || blocksLoading || blocksLoadError !== null}
              onClick={() => void onSaveSegments()}
            >
              {saving ? "Saving…" : "Save segments"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
