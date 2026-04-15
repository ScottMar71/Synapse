import type { ReactElement } from "react";
import Link from "next/link";

import { CourseEditorWorkspace } from "./course-editor-workspace";
import styles from "./course-wireframe.module.css";

type AdminCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function AdminCoursePage({ params }: AdminCoursePageProps): Promise<ReactElement> {
  const { courseId } = await params;

  return (
    <main className="page-container">
      <header className="page-header">
        <nav aria-label="Breadcrumb">
          <ol className={styles.breadcrumb}>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/admin/categories">Admin</Link>
            </li>
            <li>
              <span>Courses</span>
            </li>
            <li aria-current="page">Course editor</li>
          </ol>
        </nav>
        <h1>
          Course editor
          <span className={styles.wireTag}>Admin</span>
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-muted)", maxWidth: "52ch" }}>
          Course metadata, categories, and publish state are saved to the tenant API. Sign in with an instructor
          or admin account to load and edit.
        </p>
      </header>

      <div className="page-content">
        <CourseEditorWorkspace courseId={courseId} />
      </div>
    </main>
  );
}
