"use client";

import type { ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { probeInstructorRoute } from "../../lib/lms-api-client";
import { setSession, type LmsPortal } from "../../lib/lms-session";

function buildDevToken(tenantId: string, userId: string): string {
  return `dev|${tenantId}|${userId}`;
}

export function SignInForm(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/learn";

  const [tenantId, setTenantId] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      if (!tenantId.trim() || !userId.trim()) {
        setError("Tenant ID and User ID are required.");
        return;
      }
      if (tenantId.includes("|") || userId.includes("|")) {
        setError("Tenant ID and User ID cannot contain the “|” character.");
        return;
      }

      const token = buildDevToken(tenantId.trim(), userId.trim());
      const sessionBase = { tenantId: tenantId.trim(), userId: userId.trim(), token };

      setPending(true);
      try {
        const isStaff = await probeInstructorRoute(sessionBase);
        const portal: LmsPortal = isStaff ? "instructor" : "learn";
        setSession({ ...sessionBase, portal });

        const target =
          nextPath.startsWith("/") && !nextPath.startsWith("//")
            ? nextPath
            : portal === "instructor"
              ? "/instructor"
              : "/learn";
        router.replace(target);
      } catch {
        setError("Could not reach the API. Is it running (for example npm run dev in apps/api)?");
      } finally {
        setPending(false);
      }
    },
    [nextPath, router, tenantId, userId]
  );

  const previewToken =
    tenantId.trim() && userId.trim() && !tenantId.includes("|") && !userId.includes("|")
      ? buildDevToken(tenantId.trim(), userId.trim())
      : "";

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Sign in</h1>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          Development sign-in uses bearer tokens shaped as{" "}
          <code style={{ fontSize: "0.85em" }}>dev|&lt;tenantId&gt;|&lt;userId&gt;</code>.
        </p>
      </header>
      <main>
        <section
          aria-labelledby="sign-in-heading"
          style={{
            maxWidth: "28rem",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-6)",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <h2 id="sign-in-heading" style={{ marginTop: 0, fontSize: "1.125rem" }}>
            Tenant and user
          </h2>
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label htmlFor="tenant-id" style={{ display: "block", fontWeight: 600, marginBottom: "var(--space-2)" }}>
                Tenant ID
              </label>
              <input
                id="tenant-id"
                name="tenantId"
                autoComplete="organization"
                value={tenantId}
                onChange={(e) => {
                  setTenantId(e.target.value);
                }}
                required
                style={{
                  width: "100%",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)"
                }}
              />
            </div>
            <div>
              <label htmlFor="user-id" style={{ display: "block", fontWeight: 600, marginBottom: "var(--space-2)" }}>
                User ID
              </label>
              <input
                id="user-id"
                name="userId"
                autoComplete="username"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                }}
                required
                style={{
                  width: "100%",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)"
                }}
              />
            </div>
            {previewToken ? (
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Token preview: <code style={{ wordBreak: "break-all" }}>{previewToken}</code>
              </p>
            ) : null}
            {error ? (
              <p role="alert" style={{ margin: 0, color: "#b91c1c", fontSize: "0.875rem" }}>
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              style={{
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "var(--color-primary)",
                color: "#fff",
                fontWeight: 600,
                cursor: pending ? "wait" : "pointer"
              }}
            >
              {pending ? "Signing in…" : "Continue"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
