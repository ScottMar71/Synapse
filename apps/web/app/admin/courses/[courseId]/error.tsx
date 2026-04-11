"use client";

import type { ReactElement } from "react";

type AdminCourseErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminCourseError({
  error,
  reset
}: AdminCourseErrorProps): ReactElement {
  return (
    <main className="page-container">
      <h1 style={{ fontSize: "1.25rem", margin: "0 0 var(--space-3)" }}>
        This course page could not be rendered
      </h1>
      <p style={{ color: "var(--color-text-muted)" }}>{error.message}</p>
      <button
        type="button"
        onClick={() => {
          reset();
        }}
        style={{
          marginTop: "var(--space-4)",
          padding: "var(--space-3) var(--space-4)",
          font: "inherit",
          cursor: "pointer"
        }}
      >
        Try again
      </button>
    </main>
  );
}
