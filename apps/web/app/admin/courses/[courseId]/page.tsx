import type { ReactElement } from "react";
import Link from "next/link";

import { CourseEditorWorkspace } from "./course-editor-workspace";
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
          Layout for authors and tenant admins: course metadata, SCORM ingestion, document
          and image uploads, an AI writing assistant for catalog copy, and a duration
          estimate.
        </p>
      </header>

      <div className="page-content">
        <CourseEditorWorkspace initialTitle={title} />
      </div>
    </main>
  );
}
