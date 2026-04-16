import type { ReactElement, ReactNode } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader } from "@conductor/ui";

/** Demo course id for local deep-linking; use a real course id from your tenant when testing saves. */
const SAMPLE_ADMIN_COURSE_ID = "wireframe-demo";

function publicBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

const linkStyle = {
  display: "inline-flex" as const,
  fontWeight: 600,
  fontSize: "0.875rem",
  textDecoration: "none" as const,
};

const linkStack = { display: "flex", flexDirection: "column" as const, gap: "var(--space-2)" };

function DashLink({ href, children }: { href: string; children: ReactNode }): ReactElement {
  return (
    <Link href={href} style={linkStyle}>
      {children}
    </Link>
  );
}

export default function AdminDashboardPage(): ReactElement {
  const base = publicBaseUrl();
  const sampleCourseEditor = `/admin/courses/${SAMPLE_ADMIN_COURSE_ID}`;
  const samplePlayerPreview = `${sampleCourseEditor}/player-wireframe`;

  return (
    <main className="page-container">
      <header className="page-header">
        <h1>Admin dashboard</h1>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          Jump to staff tools. This page:{" "}
          <strong>
            <code>{base}/admin</code>
          </strong>{" "}
          (override base with <code>NEXT_PUBLIC_SITE_URL</code> when needed).
        </p>
      </header>
      <div className="page-content">
        <Card variant="outlined">
          <CardHeader
            title="Learners and reports"
            description="Directory, provisioning, and progress summaries."
          />
          <CardContent style={linkStack}>
            <DashLink href="/admin/learners">Learners directory →</DashLink>
            <DashLink href="/admin/learners/add">Add learner →</DashLink>
            <DashLink href="/admin/reports">Progress reports →</DashLink>
          </CardContent>
        </Card>

        <Card variant="outlined" style={{ marginTop: "var(--space-4)" }}>
          <CardHeader
            title="Catalog and categories"
            description="Tenant category tree and drill-in editing from the categories list."
          />
          <CardContent style={linkStack}>
            <DashLink href="/admin/categories">Course categories →</DashLink>
          </CardContent>
        </Card>

        <Card variant="outlined" style={{ marginTop: "var(--space-4)" }}>
          <CardHeader
            title="Course authoring"
            description={`Sample course id for local links: ${SAMPLE_ADMIN_COURSE_ID}. Use a real id from your tenant when testing saves.`}
          />
          <CardContent style={linkStack}>
            <DashLink href={sampleCourseEditor}>Course editor (sample id) →</DashLink>
            <DashLink href={samplePlayerPreview}>Course player layout preview (demo content) →</DashLink>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
