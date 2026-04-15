"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

import { fetchCourse, fetchEnrollments, fetchProgress } from "../../lib/lms-api-client";
import { getSession } from "../../lib/lms-session";

type DashboardRow = {
  courseId: string;
  title: string;
  enrollmentStatus: string;
  courseProgressPercent: number | null;
};

type DashboardState =
  | { status: "loading" }
  | { status: "empty"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; rows: DashboardRow[] };

export default function LearnerDashboardPage(): ReactElement {
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) {
      setState({ status: "error", message: "No session. Sign in again." });
      return;
    }
    setState({ status: "loading" });
    const enrollmentsResult = await fetchEnrollments(session, session.userId);
    if (!enrollmentsResult.ok) {
      setState({
        status: "error",
        message: enrollmentsResult.error.message
      });
      return;
    }
    const progressResult = await fetchProgress(session, session.userId);
    if (!progressResult.ok) {
      setState({
        status: "error",
        message: progressResult.error.message
      });
      return;
    }

    const courseProgress = new Map<string, number>();
    for (const row of progressResult.progress) {
      if (row.scope === "COURSE" && row.courseId) {
        courseProgress.set(row.courseId, row.percent);
      }
    }

    if (enrollmentsResult.enrollments.length === 0) {
      setState({
        status: "empty",
        message: "You are not enrolled in any courses yet. Browse the catalog to enroll."
      });
      return;
    }

    const rows: DashboardRow[] = [];
    for (const enrollment of enrollmentsResult.enrollments) {
      const courseRes = await fetchCourse(session, enrollment.courseId);
      if (!courseRes.ok) {
        setState({
          status: "error",
          message: courseRes.error.message
        });
        return;
      }
      rows.push({
        courseId: enrollment.courseId,
        title: courseRes.course.title,
        enrollmentStatus: enrollment.status,
        courseProgressPercent: courseProgress.get(enrollment.courseId) ?? null
      });
    }

    setState({ status: "ready", rows });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return (
      <p role="status" aria-live="polite" style={{ margin: 0, color: "var(--color-text-muted)" }}>
        Loading your dashboard…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" style={{ padding: "var(--space-4)", background: "#fef2f2", borderRadius: "var(--radius-md)" }}>
        <p style={{ margin: 0 }}>{state.message}</p>
        <button
          type="button"
          onClick={() => {
            void load();
          }}
          style={{
            marginTop: "var(--space-3)",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <section aria-labelledby="dash-empty">
        <h2 id="dash-empty" style={{ fontSize: "1rem" }}>
          No enrollments yet
        </h2>
        <p style={{ margin: "0 0 var(--space-4)", color: "var(--color-text-muted)" }}>{state.message}</p>
        <Link
          href="/learn/catalog"
          style={{ fontWeight: 600, fontSize: "0.875rem" }}
        >
          Open catalog →
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="enrolled-heading">
      <h2 id="enrolled-heading" style={{ fontSize: "1rem", marginTop: 0 }}>
        My courses
      </h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {state.rows.map((row) => (
          <li
            key={row.courseId}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)"
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "var(--space-3)" }}>
              <div>
                <h3 style={{ margin: "0 0 var(--space-2)", fontSize: "1rem" }}>{row.title}</h3>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                  Enrollment: {row.enrollmentStatus}
                  {row.courseProgressPercent !== null ? ` · Progress: ${row.courseProgressPercent}%` : ""}
                </p>
              </div>
              <Link
                href={`/learn/courses/${encodeURIComponent(row.courseId)}`}
                style={{ alignSelf: "center", fontWeight: 600, fontSize: "0.875rem" }}
              >
                Continue →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
