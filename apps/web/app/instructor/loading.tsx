import type { ReactElement } from "react";

export default function InstructorLoading(): ReactElement {
  return (
    <p role="status" aria-live="polite" style={{ margin: 0, color: "var(--color-text-muted)" }}>
      Loading…
    </p>
  );
}
