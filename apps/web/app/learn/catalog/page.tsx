"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

import { fetchCourses, postEnrollment } from "../../../lib/lms-api-client";
import { getSession } from "../../../lib/lms-session";

type CatalogState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | {
      status: "ready";
      courses: {
        id: string;
        title: string;
        code: string;
        published: boolean;
      }[];
    };

export default function CatalogPage(): ReactElement {
  const [state, setState] = useState<CatalogState>({ status: "loading" });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const session = getSession();
    if (!session) {
      setState({ status: "error", message: "No session. Sign in again." });
      return;
    }
    setState({ status: "loading" });
    const result = await fetchCourses(session);
    if (!result.ok) {
      setState({ status: "error", message: result.error.message });
      return;
    }
    if (result.courses.length === 0) {
      setState({ status: "empty" });
      return;
    }
    setState({
      status: "ready",
      courses: result.courses.map((c) => ({
        id: c.id,
        title: c.title,
        code: c.code,
        published: Boolean(c.publishedAt)
      }))
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enroll = useCallback(
    async (courseId: string) => {
      const session = getSession();
      if (!session) {
        setActionMessage("No session.");
        return;
      }
      setActionMessage(null);
      const result = await postEnrollment(session, courseId, session.userId);
      if (!result.ok) {
        setActionMessage(result.error.message);
        return;
      }
      setActionMessage("Enrolled. Open your dashboard to continue.");
    },
    []
  );

  if (state.status === "loading") {
    return (
      <p role="status" aria-live="polite" style={{ margin: 0, color: "var(--color-text-muted)" }}>
        Loading catalog…
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
      <section aria-labelledby="cat-empty">
        <h2 id="cat-empty" style={{ fontSize: "1rem", marginTop: 0 }}>
          No courses
        </h2>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          There are no published courses for this tenant yet.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="catalog-heading">
      <h2 id="catalog-heading" style={{ fontSize: "1rem", marginTop: 0 }}>
        Course catalog
      </h2>
      {actionMessage ? (
        <p role="status" style={{ margin: "0 0 var(--space-4)", fontSize: "0.875rem" }}>
          {actionMessage}
        </p>
      ) : null}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {state.courses.map((course) => (
          <li
            key={course.id}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "var(--space-3)"
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 var(--space-1)", fontSize: "1rem" }}>{course.title}</h3>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Code: {course.code}
                {course.published ? " · Published" : " · Unpublished"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <a
                href={`/learn/courses/${encodeURIComponent(course.id)}`}
                style={{ fontWeight: 600, fontSize: "0.875rem" }}
              >
                Open
              </a>
              <button
                type="button"
                disabled={!course.published}
                onClick={() => {
                  void enroll(course.id);
                }}
                aria-label={`Enroll in ${course.title}`}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  background: course.published ? "var(--color-primary-muted)" : "var(--color-surface-muted)",
                  cursor: course.published ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  fontSize: "0.875rem"
                }}
              >
                Enroll
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
