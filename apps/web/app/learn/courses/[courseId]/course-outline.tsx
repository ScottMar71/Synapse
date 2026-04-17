"use client";

import { LessonOutline } from "@conductor/ui";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { fetchCourseLessonOutline, fetchProgress } from "../../../../lib/lms-api-client";
import { getSession } from "../../../../lib/lms-session";
import { mapOutlineForLearner } from "./learner-outline-map";

function OutlineLink({
  href,
  className,
  children,
  "aria-current": ariaCurrent,
  "aria-label": ariaLabel
}: {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-current"?: "page" | boolean | undefined;
  "aria-label"?: string;
}): ReactElement {
  return (
    <Link href={href} className={className} aria-current={ariaCurrent} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

type OutlineState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; modules: ReturnType<typeof mapOutlineForLearner>["lessonOutlineModules"] };

export function CourseOutline({ courseId }: { courseId: string }): ReactElement {
  const [state, setState] = useState<OutlineState>({ status: "idle" });

  const load = useCallback(async () => {
    if (!courseId) {
      setState({ status: "error", message: "Missing course." });
      return;
    }
    const session = getSession();
    if (!session) {
      setState({ status: "error", message: "No session." });
      return;
    }
    setState({ status: "loading" });
    const [outlineRes, progressRes] = await Promise.all([
      fetchCourseLessonOutline(session, courseId),
      fetchProgress(session, session.userId)
    ]);
    if (!outlineRes.ok) {
      setState({ status: "error", message: outlineRes.error.message });
      return;
    }
    if (!progressRes.ok) {
      setState({ status: "error", message: progressRes.error.message });
      return;
    }
    const { lessonOutlineModules } = mapOutlineForLearner(outlineRes.outline, courseId, {
      progress: progressRes.progress
    });
    setState({ status: "ready", modules: lessonOutlineModules });
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "error") {
    return (
      <section
        role="alert"
        aria-labelledby="outline-heading"
        style={{
          marginBottom: "var(--space-6)",
          padding: "var(--space-4)",
          background: "#fef2f2",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)"
        }}
      >
        <h3 id="outline-heading" style={{ marginTop: 0, fontSize: "1rem" }}>
          Course outline
        </h3>
        <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem" }}>{state.message}</p>
        <button
          type="button"
          onClick={() => {
            void load();
          }}
          style={{
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </section>
    );
  }

  if (state.status === "loading" || state.status === "idle") {
    return (
      <section
        aria-labelledby="outline-heading"
        style={{
          marginBottom: "var(--space-6)",
          padding: "var(--space-4)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)"
        }}
      >
        <h3 id="outline-heading" style={{ marginTop: 0, fontSize: "1rem" }}>
          Course outline
        </h3>
        <p role="status" aria-live="polite" style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Loading lessons…
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="outline-heading"
      style={{
        marginBottom: "var(--space-6)",
        padding: "var(--space-4)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)"
      }}
    >
      <h3 id="outline-heading" style={{ marginTop: 0, fontSize: "1rem" }}>
        Course outline
      </h3>
      <LessonOutline modules={state.modules} aria-label="Course lessons" LinkComponent={OutlineLink} />
    </section>
  );
}
