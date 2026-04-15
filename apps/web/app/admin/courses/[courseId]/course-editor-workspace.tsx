"use client";

import type { CourseCategoryDto } from "@conductor/contracts";
import type { ReactElement } from "react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  fetchCourse,
  fetchCourseCategories,
  patchCourse,
  putCourseCategories,
  type LmsApiSession
} from "../../../../lib/lms-api-client";
import { getSession } from "../../../../lib/lms-session";
import { CourseCopyAssistant } from "./course-copy-assistant";
import { CourseDetailsFields } from "./course-details-fields";
import { DocumentUploadBlock } from "./document-upload-block";
import { ImageUploadBlock } from "./image-upload-block";
import { LearningTimeAssistant } from "./learning-time-assistant";
import { CourseEditorSummary } from "./course-editor-summary";
import { ScormUploadBlock } from "./scorm-upload-block";
import styles from "./course-wireframe.module.css";

type CourseEditorWorkspaceProps = {
  courseId: string;
};

export function CourseEditorWorkspace({ courseId }: CourseEditorWorkspaceProps): ReactElement {
  const [session, setSession] = useState<LmsApiSession | null>(null);
  const [categories, setCategories] = useState<CourseCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [courseSummary, setCourseSummary] = useState("");
  const [published, setPublished] = useState(false);
  const [archived, setArchived] = useState(false);
  const [publishedAtIso, setPublishedAtIso] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) {
      setSession(null);
      setLoading(false);
      return;
    }
    setSession(s);
    setLoading(true);
    setLoadError(null);
    const [courseRes, catRes] = await Promise.all([fetchCourse(s, courseId), fetchCourseCategories(s)]);
    if (!courseRes.ok) {
      setLoadError(courseRes.error.message);
      setLoading(false);
      return;
    }
    if (!catRes.ok) {
      setLoadError(catRes.error.message);
      setLoading(false);
      return;
    }
    const c = courseRes.course;
    setTitle(c.title);
    setDescription(c.description ?? "");
    setObjectives(c.objectives ?? "");
    setPublished(c.publishedAt != null);
    setArchived(c.archivedAt != null);
    setPublishedAtIso(c.publishedAt);
    setSelectedCategoryIds(new Set(c.categoryIds));
    setCategories(catRes.categories);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(): Promise<void> {
    if (!session) {
      return;
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setSaveError("Title is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    const publishedAt = published ? (publishedAtIso ?? new Date().toISOString()) : null;
    const patchRes = await patchCourse(session, courseId, {
      title: trimmedTitle,
      description: description.trim() === "" ? null : description,
      objectives: objectives.trim() === "" ? null : objectives,
      publishedAt,
      archived
    });
    if (!patchRes.ok) {
      setSaveError(patchRes.error.message);
      setSaving(false);
      return;
    }
    const merged = patchRes.course;
    setPublishedAtIso(merged.publishedAt);
    const catRes = await putCourseCategories(session, courseId, {
      categoryIds: [...selectedCategoryIds]
    });
    if (!catRes.ok) {
      setSaveError(catRes.error.message);
      setSaving(false);
      return;
    }
    setPublished(catRes.course.publishedAt != null);
    setArchived(catRes.course.archivedAt != null);
    setPublishedAtIso(catRes.course.publishedAt);
    setSelectedCategoryIds(new Set(catRes.course.categoryIds));
    setSaveMessage("Saved.");
    setSaving(false);
  }

  function toggleCategory(id: string): void {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (!session && !loading) {
    return (
      <p>
        Sign in from the{" "}
        <Link href="/login">login page</Link> (learner or instructor) to edit courses.
      </p>
    );
  }

  if (loading) {
    return (
      <p aria-busy="true">
        Loading course…
      </p>
    );
  }

  if (loadError) {
    return (
      <div>
        <p role="alert">{loadError}</p>
        <button type="button" className={styles.secondaryBtn} onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.grid}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <CourseDetailsFields
          title={title}
          description={description}
          objectives={objectives}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onObjectivesChange={setObjectives}
        />

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Course categories</h2>
          <p
            style={{
              margin: "0 0 var(--space-4)",
              fontSize: "0.875rem",
              color: "var(--color-text-muted)"
            }}
          >
            Multi-select categories for this course. Changes apply when you save.
          </p>
          {sortedCategories.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.875rem" }}>No categories yet. Create them under Admin → Categories.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {sortedCategories.map((cat) => {
                const id = `course-cat-${cat.id}`;
                return (
                  <li key={cat.id}>
                    <label
                      htmlFor={id}
                      style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={selectedCategoryIds.has(cat.id)}
                        onChange={() => {
                          toggleCategory(cat.id);
                        }}
                      />
                      <span>{cat.name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <ScormUploadBlock />
        <CourseEditorSummary value={courseSummary} onChange={setCourseSummary} />
      </div>

      <aside style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <CourseCopyAssistant
          courseTitle={title}
          onApplyDescription={setDescription}
          onApplyObjectives={setObjectives}
        />
        <DocumentUploadBlock />
        <ImageUploadBlock />
        <LearningTimeAssistant />
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Publish</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => {
                  setPublished(e.target.checked);
                }}
              />
              <span>Published (visible in catalog when not archived)</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={archived}
                onChange={(e) => {
                  setArchived(e.target.checked);
                }}
              />
              <span>Archived (hidden from default lists)</span>
            </label>
          </div>
          {saveError ? (
            <p role="alert" style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-danger, #b42318)" }}>
              {saveError}
            </p>
          ) : null}
          {saveMessage ? (
            <p role="status" style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              {saveMessage}
            </p>
          ) : null}
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={saving}
            onClick={() => void onSave()}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </aside>
    </div>
  );
}
