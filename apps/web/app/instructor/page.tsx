"use client";

import type { CourseDto } from "@conductor/contracts";
import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

import { fetchCourses, fetchLearners, type LearnerSummary } from "../../lib/lms-api-client";
import { getSession, type LmsSession } from "../../lib/lms-session";

type InstructorState =
  | { status: "loading" }
  | { status: "forbidden"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; learners: LearnerSummary[]; courses: CourseDto[] };

export default function InstructorOverviewPage(): ReactElement {
  const [state, setState] = useState<InstructorState>({ status: "loading" });

  const load = useCallback(async (session: LmsSession) => {
    setState({ status: "loading" });
    const [learnersRes, coursesRes] = await Promise.all([fetchLearners(session), fetchCourses(session)]);
    if (!learnersRes.ok) {
      if (learnersRes.error.status === 403) {
        setState({
          status: "forbidden",
          message: "This account does not have instructor or admin access for this tenant."
        });
        return;
      }
      setState({ status: "error", message: learnersRes.error.message });
      return;
    }
    if (!coursesRes.ok) {
      setState({ status: "error", message: coursesRes.error.message });
      return;
    }
    setState({ status: "ready", learners: learnersRes.learners, courses: coursesRes.courses });
  }, []);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setState({ status: "error", message: "No session." });
      return;
    }
    if (session.portal !== "instructor") {
      setState({
        status: "forbidden",
        message: "You signed in as a learner. Use an instructor or admin membership to view this area."
      });
      return;
    }
    void load(session);
  }, [load]);

  if (state.status === "loading") {
    return (
      <p role="status" aria-live="polite" style={{ margin: 0, color: "var(--color-text-muted)" }}>
        Loading instructor overview…
      </p>
    );
  }

  if (state.status === "forbidden" || state.status === "error") {
    return (
      <div role="alert" style={{ padding: "var(--space-4)", background: "#fffbeb", borderRadius: "var(--radius-md)" }}>
        <p style={{ margin: 0 }}>{state.message}</p>
        <p style={{ margin: "var(--space-3) 0 0", fontSize: "0.875rem" }}>
          <Link href="/sign-in">Sign in again</Link> or <Link href="/learn">go to the learner dashboard</Link>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <section aria-labelledby="staff-learners">
        <h2 id="staff-learners" style={{ fontSize: "1rem", marginTop: 0 }}>
          Learners ({state.learners.length})
        </h2>
        {state.learners.length === 0 ? (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No learners found for this tenant.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {state.learners.map((learner) => (
              <li
                key={learner.id}
                style={{
                  padding: "var(--space-3)",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem"
                }}
              >
                <strong>{learner.displayName}</strong>
                <span style={{ color: "var(--color-text-muted)" }}> · {learner.email}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="staff-courses">
        <h2 id="staff-courses" style={{ fontSize: "1rem", marginTop: 0 }}>
          Courses ({state.courses.length})
        </h2>
        {state.courses.length === 0 ? (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No courses in this tenant.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {state.courses.map((course) => (
              <li
                key={course.id}
                style={{
                  padding: "var(--space-3)",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem"
                }}
              >
                <strong>{course.title}</strong>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {" "}
                  · {course.code}
                  {course.publishedAt ? " · Published" : " · Draft"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
