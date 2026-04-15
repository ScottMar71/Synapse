import type { ReactElement } from "react";
import Link from "next/link";

import { CoursePlayerWireframe } from "./course-player-wireframe";
import styles from "../course-wireframe.module.css";

type PlayerWireframePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CoursePlayerWireframePage({ params }: PlayerWireframePageProps): Promise<ReactElement> {
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
              <Link href={`/admin/courses/${courseId}`}>Course editor</Link>
            </li>
            <li aria-current="page">Course player (wireframe)</li>
          </ol>
        </nav>
        <h1>
          Course player
          <span className={styles.wireTag}>Wireframe</span>
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-muted)", maxWidth: "56ch" }}>
          Preview of the learner-facing learning page: outline navigation, lesson stage, resources, and completion actions.
          Outline and content are sample data only. Return to the editor to change real course metadata.
        </p>
      </header>

      <div className="page-content">
        <CoursePlayerWireframe courseId={courseId} />
      </div>
    </main>
  );
}
