"use client";

import type { ReactElement } from "react";
import { useState } from "react";

import {
  Button,
  Drawer,
  Modal,
  Progress,
  Spinner,
  Toast,
} from "@conductor/ui";

export function DesignSystemOverlaysShowcase(): ReactElement {
  const [modalOpen, setModalOpen] = useState(false);
  const [strictModalOpen, setStrictModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastDemo, setToastDemo] = useState<"none" | "neutral" | "success" | "error">("none");
  const [progress, setProgress] = useState(35);

  return (
    <section style={{ marginTop: "var(--space-4)" }}>
      <h2 style={{ fontSize: "1rem", margin: "0 0 var(--space-3)" }}>Overlays & feedback (demo)</h2>
      <p style={{ margin: "0 0 var(--space-4)", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
        Modal (focus trap, Esc, focus restore), drawer sheet, toast <code>role</code>, progressbar, and spinner.
        Strict modal uses explicit close only (no backdrop dismiss).
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
          Open modal
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setStrictModalOpen(true)}>
          Strict modal (no backdrop close)
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
          Open filter drawer
        </Button>
        <Button type="button" variant="tertiary" size="sm" onClick={() => setToastDemo("neutral")}>
          Toast neutral
        </Button>
        <Button type="button" variant="tertiary" size="sm" onClick={() => setToastDemo("success")}>
          Toast success
        </Button>
        <Button type="button" variant="tertiary" size="sm" onClick={() => setToastDemo("error")}>
          Toast error (alert)
        </Button>
        <Button type="button" variant="tertiary" size="sm" onClick={() => setProgress((p) => (p >= 100 ? 0 : p + 15))}>
          Bump progress
        </Button>
      </div>

      <div
        style={{
          padding: "var(--space-4)",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-md)",
          marginBottom: "var(--space-4)",
        }}
        aria-busy="false"
        aria-label="Demo content area"
      >
        <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.875rem" }}>Inline spinner (section not busy):</p>
        <Spinner label="Loading example" size="sm" />
      </div>

      <Progress value={progress} label="Course setup" />

      {toastDemo !== "none" ? (
        <div style={{ marginTop: "var(--space-4)", maxWidth: "24rem" }}>
          <Toast tone={toastDemo === "error" ? "error" : toastDemo === "success" ? "success" : "neutral"}>
            {toastDemo === "error"
              ? "Could not save — check your connection."
              : toastDemo === "success"
                ? "Saved successfully."
                : "Draft updated."}
          </Toast>
          <Button type="button" variant="tertiary" size="sm" onClick={() => setToastDemo("none")} style={{ marginTop: "var(--space-2)" }}>
            Dismiss sample
          </Button>
        </div>
      ) : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example dialog" width="sm">
        <p style={{ margin: "0 0 var(--space-4)" }}>
          Focus is trapped here. Press Escape or use the close control. Backdrop click also closes this dialog.
        </p>
        <Button type="button" variant="primary" size="sm" onClick={() => setModalOpen(false)}>
          Done
        </Button>
      </Modal>

      <Modal
        open={strictModalOpen}
        onClose={() => setStrictModalOpen(false)}
        title="Confirm action"
        width="sm"
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        <p style={{ margin: "0 0 var(--space-4)" }}>
          Destructive or high-impact flows should require an explicit choice — backdrop and Escape do nothing here.
        </p>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Button type="button" variant="secondary" size="sm" onClick={() => setStrictModalOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => setStrictModalOpen(false)}>
            Confirm
          </Button>
        </div>
      </Modal>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filters" placement="bottom">
        <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Example bottom sheet for narrow viewports (e.g. directory filters).
        </p>
        <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", fontSize: "0.875rem" }}>
          Status
          <select style={{ padding: "var(--space-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
            <option>Any</option>
            <option>Active</option>
            <option>Archived</option>
          </select>
        </label>
        <Button type="button" variant="primary" size="sm" onClick={() => setDrawerOpen(false)} style={{ marginTop: "var(--space-4)" }}>
          Apply
        </Button>
      </Drawer>
    </section>
  );
}
