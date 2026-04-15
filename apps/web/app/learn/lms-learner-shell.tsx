"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { useCallback } from "react";

import { clearSession } from "../../lib/lms-session";

type LmsLearnerShellProps = {
  children: ReactNode;
};

export function LmsLearnerShell({ children }: LmsLearnerShellProps): ReactElement {
  const router = useRouter();

  const signOut = useCallback(() => {
    clearSession();
    router.replace("/sign-in");
  }, [router]);

  return (
    <div className="page-container">
      <a
        href="#learner-main"
        style={{
          position: "absolute",
          left: "-9999px",
          zIndex: 999,
          padding: "var(--space-2)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)"
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = "var(--space-4)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = "-9999px";
        }}
      >
        Skip to content
      </a>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)"
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 var(--space-2)", fontSize: "1.25rem" }}>Learner</h1>
          <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Dashboard, catalog, and course study
          </p>
        </div>
        <nav aria-label="Learner navigation" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
          <Link href="/learn" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            Dashboard
          </Link>
          <Link href="/learn/catalog" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            Catalog
          </Link>
          <Link href="/" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            Home
          </Link>
          <button
            type="button"
            onClick={signOut}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              font: "inherit",
              color: "var(--color-primary)",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Sign out
          </button>
        </nav>
      </header>
      <main id="learner-main">{children}</main>
    </div>
  );
}
