import type { ReactElement } from "react";

export function CourseOutline(): ReactElement {
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
        Outline
      </h3>
      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
        Module and lesson navigation will plug in here. For now this is a placeholder outline so the learning view has a
        structured landmark.
      </p>
      <ol style={{ margin: "var(--space-3) 0 0", paddingLeft: "var(--space-6)" }}>
        <li>Orientation</li>
        <li>Guided practice</li>
        <li>Checkpoint assessment</li>
      </ol>
    </section>
  );
}
