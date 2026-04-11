import type { ReactElement } from "react";
import Link from "next/link";

import { CourseDetailsEditor } from "./course-details-editor";
import { LearningTimeAssistant } from "./learning-time-assistant";
import { ScormUploadBlock } from "./scorm-upload-block";
import styles from "./course-wireframe.module.css";

type AdminCourseWireframePageProps = {
  params: Promise<{ courseId: string }>;
};

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function titleFromCourseId(courseId: string): string {
  const decoded = safeDecodeURIComponent(courseId);
  if (decoded === "wireframe-demo") {
    return "Onboarding essentials";
  }
  return decoded.replace(/-/g, " ");
}

export default async function AdminCourseWireframePage({
  params
}: AdminCourseWireframePageProps): Promise<ReactElement> {
  const { courseId } = await params;
  const title = titleFromCourseId(courseId);

  return (
    <main className="page-container">
      <header className="page-header">
        <nav aria-label="Breadcrumb">
          <ol className={styles.breadcrumb}>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <span>Admin</span>
            </li>
            <li>
              <span>Courses</span>
            </li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <h1>
          Course editor
          <span className={styles.wireTag}>Admin wireframe</span>
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-muted)", maxWidth: "52ch" }}>
          Layout for authors and tenant admins: metadata, an AI writing assistant for
          catalog copy, AI-assisted duration estimate, and SCORM ingestion.
        </p>
      </header>

      <div className="page-content">
        <div className={styles.grid}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <CourseDetailsEditor initialTitle={title} />

            <ScormUploadBlock />
          </div>

          <aside style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <LearningTimeAssistant />
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Publish</h2>
              <p style={{ margin: "0 0 var(--space-4)", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Draft / scheduled / live controls would live here.
              </p>
              <button type="button" className={styles.secondaryBtn}>
                Save draft
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
