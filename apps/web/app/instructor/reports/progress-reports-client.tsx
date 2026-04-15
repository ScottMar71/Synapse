"use client";

import type { CourseDto } from "@conductor/contracts";
import type { ProgressReportRowDto, ProgressReportSharedQuery, ProgressReportSummaryDto } from "@conductor/contracts";
import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

import {
  fetchCourses,
  fetchLearners,
  fetchProgressReportRows,
  fetchProgressReportSummary,
  type LearnerSummary,
  type LmsApiSession
} from "../../../lib/lms-api-client";
import { getSession, type LmsSession } from "../../../lib/lms-session";

type ProgressReportsClientProps = {
  variant: "instructor" | "admin";
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "forbidden"; message: string }
  | { status: "error"; message: string }
  | { status: "ready" };

function formatIso(iso: string, withTime: boolean): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      ...(withTime ? { timeStyle: "short" } : {})
    });
  } catch {
    return iso;
  }
}

export function ProgressReportsClient({ variant }: ProgressReportsClientProps): ReactElement {
  const [session, setSession] = useState<LmsSession | null>(null);
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [learners, setLearners] = useState<LearnerSummary[]>([]);
  const [summary, setSummary] = useState<ProgressReportSummaryDto | null>(null);
  const [rows, setRows] = useState<ProgressReportRowDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [courseId, setCourseId] = useState<string>("");
  const [learnerId, setLearnerId] = useState<string>("");
  const [enrolledFrom, setEnrolledFrom] = useState<string>("");
  const [enrolledTo, setEnrolledTo] = useState<string>("");

  const collectFilters = useCallback((): ProgressReportSharedQuery => {
    const q: ProgressReportSharedQuery = {};
    if (courseId.trim()) {
      q.courseId = courseId.trim();
    }
    if (learnerId.trim()) {
      q.learnerId = learnerId.trim();
    }
    if (enrolledFrom) {
      q.enrolledFrom = new Date(`${enrolledFrom}T00:00:00.000Z`).toISOString();
    }
    if (enrolledTo) {
      q.enrolledTo = new Date(`${enrolledTo}T23:59:59.999Z`).toISOString();
    }
    return q;
  }, [courseId, learnerId, enrolledFrom, enrolledTo]);

  const refresh = useCallback(async (apiSession: LmsApiSession, filters: ProgressReportSharedQuery) => {
      setLoadState({ status: "loading" });
      setNextCursor(null);
      const [coursesRes, learnersRes, sumRes, rowRes] = await Promise.all([
        fetchCourses(apiSession),
        fetchLearners(apiSession),
        fetchProgressReportSummary(apiSession, filters),
        fetchProgressReportRows(apiSession, { ...filters, limit: 25 })
      ]);
      if (!coursesRes.ok) {
        if (coursesRes.error.status === 403) {
          setLoadState({
            status: "forbidden",
            message: "This account cannot access staff reports for this tenant."
          });
          return;
        }
        setLoadState({ status: "error", message: coursesRes.error.message });
        return;
      }
      if (!learnersRes.ok) {
        setLoadState({ status: "error", message: learnersRes.error.message });
        return;
      }
      if (!sumRes.ok) {
        if (sumRes.error.status === 403) {
          setLoadState({
            status: "forbidden",
            message: "This account cannot access staff reports for this tenant."
          });
          return;
        }
        setLoadState({ status: "error", message: sumRes.error.message });
        return;
      }
      if (!rowRes.ok) {
        if (rowRes.error.status === 403) {
          setLoadState({
            status: "forbidden",
            message: "This account cannot access staff reports for this tenant."
          });
          return;
        }
        setLoadState({ status: "error", message: rowRes.error.message });
        return;
      }
      setCourses(coursesRes.courses);
      setLearners(learnersRes.learners);
      setSummary(sumRes.summary);
      setRows(rowRes.rows);
      setNextCursor(rowRes.nextCursor);
      setLoadState({ status: "ready" });
  }, []);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      setSession(null);
      setLoadState({ status: "error", message: "No session." });
      return;
    }
    if (s.portal !== "instructor") {
      setSession(s);
      setLoadState({
        status: "forbidden",
        message: "You signed in as a learner. Use an instructor or admin membership to view reports."
      });
      return;
    }
    setSession(s);
    void refresh(s, {});
  }, [refresh]);

  const onApplyFilters = useCallback(() => {
    if (!session || session.portal !== "instructor") {
      return;
    }
    void refresh(session, collectFilters());
  }, [collectFilters, refresh, session]);

  const onLoadMore = useCallback(async () => {
    if (!session || session.portal !== "instructor" || !nextCursor) {
      return;
    }
    setLoadingMore(true);
    const rowRes = await fetchProgressReportRows(session, {
      ...collectFilters(),
      limit: 25,
      cursor: nextCursor
    });
    setLoadingMore(false);
    if (!rowRes.ok) {
      setLoadState({ status: "error", message: rowRes.error.message });
      return;
    }
    setRows((prev) => [...prev, ...rowRes.rows]);
    setNextCursor(rowRes.nextCursor);
  }, [collectFilters, nextCursor, session]);

  const shellIntro =
    variant === "admin" ? (
      <nav aria-label="Breadcrumb" style={{ marginBottom: "var(--space-4)", fontSize: "0.875rem" }}>
        <Link href="/">Home</Link>
        <span style={{ color: "var(--color-text-muted)" }} aria-hidden>
          {" "}
          ·{" "}
        </span>
        <Link href="/">Site hub</Link>
        <span style={{ color: "var(--color-text-muted)" }} aria-hidden>
          {" "}
          · Progress reports
        </span>
      </nav>
    ) : null;

  if (loadState.status === "forbidden" || loadState.status === "error") {
    return (
      <div>
        {shellIntro}
        <div role="alert" style={{ padding: "var(--space-4)", background: "#fffbeb", borderRadius: "var(--radius-md)" }}>
          <p style={{ margin: 0 }}>{loadState.message}</p>
          <p style={{ margin: "var(--space-3) 0 0", fontSize: "0.875rem" }}>
            <Link href="/sign-in">Sign in again</Link> or <Link href="/learn">go to the learner dashboard</Link>.
          </p>
        </div>
      </div>
    );
  }

  if (loadState.status === "loading" || loadState.status === "idle" || !summary) {
    return (
      <div>
        {shellIntro}
        <p role="status" aria-live="polite" style={{ margin: 0, color: "var(--color-text-muted)" }}>
          Loading progress reports…
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {shellIntro}
      <header>
        <h2 style={{ margin: "0 0 var(--space-2)", fontSize: "1.125rem" }}>Progress & completion</h2>
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.875rem", maxWidth: "52ch" }}>
          Tenant-scoped enrollment and course-level progress from the API. Adjust filters and apply to refresh the
          summary and table.
        </p>
      </header>

      <section aria-label="Report filters">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(12rem, 1fr))",
            gap: "var(--space-3)",
            alignItems: "end"
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", fontSize: "0.8125rem" }}>
            Course
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
              }}
              style={{ padding: "var(--space-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code})
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", fontSize: "0.8125rem" }}>
            Learner
            <select
              value={learnerId}
              onChange={(e) => {
                setLearnerId(e.target.value);
              }}
              style={{ padding: "var(--space-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
            >
              <option value="">All learners</option>
              {learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.displayName} — {l.email}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", fontSize: "0.8125rem" }}>
            Enrolled from
            <input
              type="date"
              value={enrolledFrom}
              onChange={(e) => {
                setEnrolledFrom(e.target.value);
              }}
              style={{ padding: "var(--space-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", fontSize: "0.8125rem" }}>
            Enrolled to
            <input
              type="date"
              value={enrolledTo}
              onChange={(e) => {
                setEnrolledTo(e.target.value);
              }}
              style={{ padding: "var(--space-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              onApplyFilters();
            }}
            style={{
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "var(--color-primary)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Apply filters
          </button>
        </div>
      </section>

      <section aria-labelledby="report-kpis">
        <h3 id="report-kpis" style={{ fontSize: "1rem", marginTop: 0 }}>
          Summary
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(9rem, 1fr))",
            gap: "var(--space-3)"
          }}
        >
          <Kpi label="Enrollments" value={summary.totalEnrollments} />
          <Kpi label="Active" value={summary.activeEnrollments} />
          <Kpi label="Completed" value={summary.completedEnrollments} />
          <Kpi label="Learners" value={summary.distinctLearners} />
          <Kpi
            label="Avg course progress"
            value={summary.averageCourseProgressPercent === null ? "—" : `${summary.averageCourseProgressPercent}%`}
          />
        </div>
      </section>

      <section aria-labelledby="report-rows">
        <h3 id="report-rows" style={{ fontSize: "1rem", marginTop: 0 }}>
          Detail
        </h3>
        {rows.length === 0 ? (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            No enrollments match these filters yet.
          </p>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem"
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                    <th scope="col" style={{ padding: "var(--space-2)" }}>
                      Learner
                    </th>
                    <th scope="col" style={{ padding: "var(--space-2)" }}>
                      Course
                    </th>
                    <th scope="col" style={{ padding: "var(--space-2)" }}>
                      Status
                    </th>
                    <th scope="col" style={{ padding: "var(--space-2)" }}>
                      Progress
                    </th>
                    <th scope="col" style={{ padding: "var(--space-2)" }}>
                      Enrolled
                    </th>
                    <th scope="col" style={{ padding: "var(--space-2)" }}>
                      Last activity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.enrollmentId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "var(--space-2)" }}>
                        <strong>{r.userDisplayName}</strong>
                        <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>{r.userEmail}</div>
                      </td>
                      <td style={{ padding: "var(--space-2)" }}>
                        {r.courseTitle}
                        <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>{r.courseCode}</div>
                      </td>
                      <td style={{ padding: "var(--space-2)" }}>{r.enrollmentStatus}</td>
                      <td style={{ padding: "var(--space-2)" }}>{r.courseProgressPercent}%</td>
                      <td style={{ padding: "var(--space-2)" }}>{formatIso(r.enrolledAt, false)}</td>
                      <td style={{ padding: "var(--space-2)" }}>
                        {r.lastProgressAt ? formatIso(r.lastProgressAt, true) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {nextCursor ? (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void onLoadMore()}
                style={{
                  marginTop: "var(--space-3)",
                  padding: "var(--space-2) var(--space-4)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  cursor: loadingMore ? "wait" : "pointer"
                }}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function Kpi(props: { label: string; value: number | string }): ReactElement {
  return (
    <div
      style={{
        padding: "var(--space-3)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)"
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>
        {props.label}
      </div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "var(--space-1)" }}>{props.value}</div>
    </div>
  );
}
