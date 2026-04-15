import type { ReactElement } from "react";
import Link from "next/link";
import { Suspense } from "react";

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
              <Link href="/">Site hub</Link>
            </li>
            <li>
              <span>Courses</span>
            </li>
            <li aria-current="page">Course editor</li>
          </ol>
        </nav>
        <h1>
          Course editor
          <span className={styles.staffTag}>Staff</span>
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-muted)", maxWidth: "52ch" }}>
          Course metadata, categories, and publish state are saved to the tenant-scoped API. Instructor and admin
          roles can load and edit; access is enforced on every request.
        </p>
        <p style={{ margin: "var(--space-3) 0 0", fontSize: "0.875rem" }}>
          <Link href={`/admin/courses/${courseId}/player-wireframe`}>Preview course player layout (demo content)</Link>
          <span style={{ color: "var(--color-text-muted)" }} aria-hidden>
            {" "}
            — learner-style shell; outline is sample data only.
          </span>
        </p>
      </header>

      <div className="page-content">
        <Suspense
          fallback={
            <p aria-busy="true" style={{ margin: 0 }}>
              Loading…
            </p>
          }
        >
          <CourseEditorWorkspace courseId={courseId} />
        </Suspense>
      </div>
    </main>
  );
}
