import type { ReactElement } from "react";
import Link from "next/link";

import type { LmsPlatformContract } from "@conductor/contracts";

const runtimeContract: LmsPlatformContract = {
  apiBasePath: "/api/v1",
  tenantHeaderName: "x-tenant-id"
};

export default function HomePage(): ReactElement {
  return (
    <main className="page-container">
      <header className="page-header">
        <h1>Synapse LMS</h1>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          API base: {runtimeContract.apiBasePath}
        </p>
      </header>
      <div className="page-content">
        <section
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-5)",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <h2 style={{ margin: "0 0 var(--space-3)", fontSize: "1rem" }}>Admin</h2>
          <p style={{ margin: "0 0 var(--space-4)", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Course authoring wireframe: metadata, SCORM upload, and learning-time assistant.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <Link
              href="/admin/courses/wireframe-demo"
              style={{
                display: "inline-flex",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none"
              }}
            >
              Open admin course page →
            </Link>
            <Link
              href="/admin/learners"
              style={{
                display: "inline-flex",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none"
              }}
            >
              Learners directory (admin) →
            </Link>
            <Link
              href="/admin/learners-wireframe"
              style={{
                display: "inline-flex",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none"
              }}
            >
              Learners list wireframe →
            </Link>
            <Link
              href="/admin/categories"
              style={{
                display: "inline-flex",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none"
              }}
            >
              Course categories (admin) →
            </Link>
            <Link
              href="/admin/categories-wireframe"
              style={{
                display: "inline-flex",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none"
              }}
            >
              Course categories wireframe →
            </Link>
          </div>
        </section>
        <section style={{ marginTop: "var(--space-4)" }}>
          <h2 style={{ margin: "0 0 var(--space-3)", fontSize: "1rem" }}>Core journeys</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", alignItems: "flex-start" }}>
            <Link
              href="/sign-in"
              style={{
                display: "inline-flex",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none"
              }}
            >
              Sign in (dev token) →
            </Link>
            <Link
              href="/learn"
              style={{
                display: "inline-flex",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none"
              }}
            >
              Learner dashboard →
            </Link>
            <Link
              href="/instructor"
              style={{
                display: "inline-flex",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none"
              }}
            >
              Instructor overview →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
