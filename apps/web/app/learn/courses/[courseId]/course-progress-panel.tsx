import type { ReactElement } from "react";

type CourseProgressPanelProps = {
  coursePercent: number | null;
  percentInput: string;
  onPercentChange: (value: string) => void;
  onSave: () => void;
  progressMessage: string | null;
};

export function CourseProgressPanel({
  coursePercent,
  percentInput,
  onPercentChange,
  onSave,
  progressMessage
}: CourseProgressPanelProps): ReactElement {
  return (
    <section
      aria-labelledby="progress-heading"
      style={{
        marginBottom: "var(--space-6)",
        padding: "var(--space-4)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)"
      }}
    >
      <h3 id="progress-heading" style={{ marginTop: 0, fontSize: "1rem" }}>
        Course progress
      </h3>
      <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
        {coursePercent !== null ? `Stored progress: ${coursePercent}%` : "No progress recorded yet."}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}>
        <label htmlFor="course-percent" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
          Percent complete (0–100)
        </label>
        <input
          id="course-percent"
          type="number"
          min={0}
          max={100}
          value={percentInput}
          onChange={(e) => {
            onPercentChange(e.target.value);
          }}
          style={{
            width: "5rem",
            padding: "var(--space-2)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)"
          }}
        />
        <button
          type="button"
          onClick={onSave}
          style={{
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: "var(--color-primary)",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Save progress
        </button>
      </div>
      {progressMessage ? (
        <p role="status" style={{ margin: "var(--space-3) 0 0", fontSize: "0.875rem" }}>
          {progressMessage}
        </p>
      ) : null}
    </section>
  );
}
