import type { ReactElement, ReactNode } from "react";
import Link from "next/link";

import type { LmsPlatformContract } from "@conductor/contracts";

const runtimeContract: LmsPlatformContract = {
  apiBasePath: "/api/v1",
  tenantHeaderName: "x-tenant-id"
};

/** Demo IDs for wireframes and local deep-linking; replace learner/course slugs with tenant data when exercising API-backed views. */
const SAMPLE_ADMIN_COURSE_ID = "wireframe-demo";
const SAMPLE_LEARNER_WIREFRAME_ID = "1";
const SAMPLE_CATEGORY_WIREFRAME_ID = "cat-sales";

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
  textDecoration: "none" as const
};

const muted = { margin: 0, color: "var(--color-text-muted)", fontSize: "0.875rem" };

const sectionCard = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: "var(--space-5)",
  boxShadow: "var(--shadow-sm)"
};

const linkStack = { display: "flex", flexDirection: "column" as const, gap: "var(--space-2)" };

function HubLink({ href, children }: { href: string; children: ReactNode }): ReactElement {
  return (
    <Link href={href} style={linkStyle}>
      {children}
    </Link>
  );
}

function RouteLine({ path, note }: { path: string; note?: string }): ReactElement {
  const base = publicBaseUrl();
  return (
    <li style={{ fontSize: "0.8125rem", lineHeight: 1.45 }}>
      <code style={{ wordBreak: "break-all" }}>
        {base}
        {path}
      </code>
      {note ? <span style={{ color: "var(--color-text-muted)" }}> — {note}</span> : null}
    </li>
  );
}

export default function HomePage(): ReactElement {
  const base = publicBaseUrl();

  return (
    <main className="page-container">
      <header className="page-header">
        <h1>Synapse LMS</h1>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          API base: {runtimeContract.apiBasePath}
        </p>
        <p style={{ ...muted, marginTop: "var(--space-2)" }}>
          Site hub — full URLs use base{" "}
          <strong>
            <code>{base}</code>
          </strong>{" "}
          (override with <code>NEXT_PUBLIC_SITE_URL</code> when needed).
        </p>
      </header>
      <div className="page-content">
        <section style={sectionCard}>
          <h2 style={{ margin: "0 0 var(--space-3)", fontSize: "1rem" }}>Authentication</h2>
          <p style={{ ...muted, margin: "0 0 var(--space-4)" }}>
            Dev token sign-in for learner, instructor, and admin roles.
          </p>
          <div style={linkStack}>
            <HubLink href="/sign-in">Sign in (dev token) →</HubLink>
            <HubLink href="/protected">Protected entry (redirects to learner) →</HubLink>
          </div>
        </section>

        <section style={{ ...sectionCard, marginTop: "var(--space-4)" }}>
          <h2 style={{ margin: "0 0 var(--space-3)", fontSize: "1rem" }}>Learner</h2>
          <p style={{ ...muted, margin: "0 0 var(--space-4)" }}>
            Catalog and course player call the tenant API; session required for course detail.
          </p>
          <div style={linkStack}>
            <HubLink href="/learn">Learner dashboard →</HubLink>
            <HubLink href="/learn/catalog">Course catalog →</HubLink>
            <HubLink href={`/learn/courses/${SAMPLE_ADMIN_COURSE_ID}`}>
              Learner course view (sample id: {SAMPLE_ADMIN_COURSE_ID}) →
            </HubLink>
          </div>
        </section>

        <section style={{ ...sectionCard, marginTop: "var(--space-4)" }}>
          <h2 style={{ margin: "0 0 var(--space-3)", fontSize: "1rem" }}>Instructor</h2>
          <div style={linkStack}>
            <HubLink href="/instructor">Instructor overview →</HubLink>
            <HubLink href="/instructor/reports">Progress reports (instructor) →</HubLink>
          </div>
        </section>

        <section style={{ ...sectionCard, marginTop: "var(--space-4)" }}>
          <h2 style={{ margin: "0 0 var(--space-3)", fontSize: "1rem" }}>Admin (API-backed)</h2>
          <p style={{ ...muted, margin: "0 0 var(--space-4)" }}>
            Requires admin or instructor session. Category detail URLs use ids returned from the API.
          </p>
          <div style={linkStack}>
            <HubLink href="/admin/categories">Course categories →</HubLink>
            <HubLink href="/admin/learners">Learners directory →</HubLink>
            <HubLink href="/admin/learners/add">Add learner →</HubLink>
            <HubLink href={`/admin/courses/${SAMPLE_ADMIN_COURSE_ID}`}>
              Course editor (sample id: {SAMPLE_ADMIN_COURSE_ID}) →
            </HubLink>
            <HubLink href={`/admin/courses/${SAMPLE_ADMIN_COURSE_ID}/player-wireframe`}>
              Course player wireframe (preview) →
            </HubLink>
            <HubLink href="/admin/reports">Progress reports (admin) →</HubLink>
          </div>
        </section>

        <section style={{ ...sectionCard, marginTop: "var(--space-4)" }}>
          <h2 style={{ margin: "0 0 var(--space-3)", fontSize: "1rem" }}>Admin wireframes</h2>
          <p style={{ ...muted, margin: "0 0 var(--space-4)" }}>
            Static UX prototypes with demo data; safe to click without API setup.
          </p>
          <div style={linkStack}>
            <HubLink href="/admin/categories-wireframe">Categories dashboard wireframe →</HubLink>
            <HubLink href={`/admin/categories-wireframe/${SAMPLE_CATEGORY_WIREFRAME_ID}`}>
              Category detail wireframe ({SAMPLE_CATEGORY_WIREFRAME_ID}) →
            </HubLink>
            <HubLink href="/admin/learners-wireframe">Learners list wireframe →</HubLink>
            <HubLink href="/admin/learners-wireframe/add">Add learner wireframe →</HubLink>
            <HubLink href={`/admin/learners-wireframe/${SAMPLE_LEARNER_WIREFRAME_ID}`}>
              Learner profile wireframe ({SAMPLE_LEARNER_WIREFRAME_ID}) →
            </HubLink>
          </div>
        </section>

        <section style={{ ...sectionCard, marginTop: "var(--space-4)" }}>
          <h2 style={{ margin: "0 0 var(--space-3)", fontSize: "1rem" }}>Outstanding routes and gaps</h2>
          <p style={{ ...muted, margin: "0 0 var(--space-3)" }}>
            These are not separate pages, need real tenant identifiers, or are tracked improvements — not broken hub links.
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <RouteLine
              path="/admin/categories/:categoryId"
              note="production category drill-in; open a row from /admin/categories after sign-in (id comes from API)."
            />
            <RouteLine
              path={`/learn/courses/:courseId`}
              note="needs a course that exists for the signed-in tenant; sample slug above may 404 until seeded."
            />
            <RouteLine
              path={`/admin/courses/:courseId`}
              note="same as learner course — editor loads from API; use a real course id from your tenant when testing saves."
            />
            <RouteLine path="/admin" note="no dedicated admin landing route yet; this hub at / is the navigation index." />
            <RouteLine path="/protected" note="server redirect only — ends on /learn, not a standalone screen." />
            <RouteLine path="/login" note="removed from product; use /sign-in (some copy previously pointed here — updated to sign-in)." />
          </ul>
        </section>
      </div>
    </main>
  );
}
