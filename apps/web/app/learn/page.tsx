"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

import { ContinueLearningRow, DashboardNumericSummaryRow, LearnerDeadlinesList } from "@conductor/ui";

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

  const percents = state.rows
    .map((r) => r.courseProgressPercent)
    .filter((p): p is number => p !== null);
  const avgRaw =
    percents.length > 0 ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : null;
  const inProgressCount = state.rows.filter(
    (r) =>
      r.courseProgressPercent !== null && r.courseProgressPercent > 0 && r.courseProgressPercent < 100
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <DashboardNumericSummaryRow
        items={[
          {
            id: "enrolled",
            value: String(state.rows.length),
            label: "Enrolled courses",
            caption: "Active enrollments",
          },
          {
            id: "avg-progress",
            value: avgRaw === null ? "—" : `${String(avgRaw)}%`,
            label: "Average progress",
            caption: "Across courses with progress recorded",
          },
          {
            id: "in-progress",
            value: String(inProgressCount),
            label: "In progress",
            caption: "Started but not complete",
          },
        ]}
      />

      <ContinueLearningRow
        description="Pick up where you left off."
        items={state.rows.map((row) => ({
          id: row.courseId,
          title: row.title,
          meta: `Enrollment: ${row.enrollmentStatus}${
            row.courseProgressPercent !== null ? ` · Progress: ${row.courseProgressPercent}%` : ""
          }`,
          action: (
            <Link
              href={`/learn/courses/${encodeURIComponent(row.courseId)}`}
              style={{ fontWeight: 600, fontSize: "0.875rem" }}
            >
              Continue →
            </Link>
          ),
        }))}
      />

      <LearnerDeadlinesList
        description="Due dates from your courses appear here when the LMS schedules them."
        items={[]}
      />
    </div>
  );
}
