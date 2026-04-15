import type { ReactElement } from "react";

type CourseAssessmentPanelProps = {
  assessmentId: string;
  onAssessmentIdChange: (value: string) => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  assessmentMessage: string | null;
};

export function CourseAssessmentPanel({
  assessmentId,
  onAssessmentIdChange,
  onSaveDraft,
  onSubmit,
  assessmentMessage
}: CourseAssessmentPanelProps): ReactElement {
  return (
    <section
      aria-labelledby="assessment-heading"
      style={{
        padding: "var(--space-4)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)"
      }}
    >
      <h3 id="assessment-heading" style={{ marginTop: 0, fontSize: "1rem" }}>
        Assessment
      </h3>
      <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
        Enter an assessment identifier from your tenant (for example from seed data) to exercise draft and submit flows.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxWidth: "24rem" }}>
        <label htmlFor="assessment-id" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
          Assessment ID
        </label>
        <input
          id="assessment-id"
          value={assessmentId}
          onChange={(e) => {
            onAssessmentIdChange(e.target.value);
          }}
          autoComplete="off"
          style={{
            padding: "var(--space-2)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)"
          }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <button
            type="button"
            onClick={onSaveDraft}
            style={{
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-muted)",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={onSubmit}
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
            Submit attempt
          </button>
        </div>
      </div>
      {assessmentMessage ? (
        <p role="status" style={{ margin: "var(--space-3) 0 0", fontSize: "0.875rem" }}>
          {assessmentMessage}
        </p>
      ) : null}
    </section>
  );
}
