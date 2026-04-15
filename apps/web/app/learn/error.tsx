"use client";

import type { ReactElement } from "react";

type LearnErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LearnError({ error, reset }: LearnErrorProps): ReactElement {
  return (
    <div role="alert" style={{ padding: "var(--space-4)", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--radius-md)" }}>
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Something went wrong</h2>
      <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem" }}>{error.message}</p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: "var(--space-2) var(--space-3)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          cursor: "pointer"
        }}
      >
        Try again
      </button>
    </div>
  );
}
