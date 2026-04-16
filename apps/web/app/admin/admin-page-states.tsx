"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { ApiError } from "../../lib/lms-api-client";
import { formatTenantAdminError } from "../../lib/lms-api-client";

import styles from "./admin-page-states.module.css";

function signInHref(pathname: string | null, search: string): string {
  const next =
    pathname && pathname.startsWith("/admin")
      ? `${pathname}${search && search.length > 0 ? search : ""}`
      : "/admin";
  return `/sign-in?next=${encodeURIComponent(next)}`;
}

export function AdminSignInRequired(props: { context: string }): ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const qs = search.length > 0 ? `?${search}` : "";
  const href = signInHref(pathname, qs);

  return (
    <div className={styles.stateShell}>
      <p className={styles.muted}>
        Sign in from the{" "}
        <Link href={href}>sign-in page</Link> to {props.context}.
      </p>
    </div>
  );
}

export function AdminLoading(props: { label: string }): ReactElement {
  return (
    <div className={styles.stateShell} aria-busy="true" aria-live="polite">
      <p>{props.label}</p>
    </div>
  );
}

export function AdminLoadError(props: { error: ApiError; onRetry: () => void }): ReactElement {
  return (
    <div className={styles.stateShell}>
      <p role="alert">{formatTenantAdminError(props.error)}</p>
      <button type="button" className={styles.retryBtn} onClick={() => props.onRetry()}>
        Retry
      </button>
    </div>
  );
}

export function AdminStaffForbidden(): ReactElement {
  return (
    <div className={styles.stateShell}>
      <p role="alert">You need instructor or admin access for this section.</p>
      <p className={styles.muted} style={{ marginTop: "var(--space-3)" }}>
        Sign in with a staff account for this tenant, or go back to{" "}
        <Link href="/learn">learner home</Link>.
      </p>
    </div>
  );
}
