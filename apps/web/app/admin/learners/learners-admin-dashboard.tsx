"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { fetchLearners, probeAdminRoute, type LearnerSummary, type LmsApiSession } from "../../../lib/lms-api-client";
import { getSession } from "../../../lib/lms-session";
import styles from "../learners-wireframe/learners-wireframe.module.css";

function formatAddedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function LearnersAdminDashboard(): ReactElement {
  const searchParams = useSearchParams();
  const provisioned = searchParams.get("provisioned") === "1";

  const [session, setSession] = useState<LmsApiSession | null>(null);
  const [learners, setLearners] = useState<LearnerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [canAddLearners, setCanAddLearners] = useState(false);

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) {
      setSession(null);
      setLoading(false);
      return;
    }
    setSession(s);
    setLoading(true);
    setError(null);
    const [listRes, adminOk] = await Promise.all([fetchLearners(s), probeAdminRoute(s)]);
    setCanAddLearners(adminOk);
    if (!listRes.ok) {
      setError(listRes.error.message);
      setLoading(false);
      return;
    }
    setLearners(listRes.learners);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return learners;
    }
    return learners.filter(
      (row) =>
        row.email.toLowerCase().includes(q) ||
        row.displayName.toLowerCase().includes(q)
    );
  }, [learners, query]);

  if (!session && !loading) {
    return (
      <main className={styles.shell}>
        <p>
          Sign in from the{" "}
          <Link href="/sign-in">sign-in page</Link> as an instructor or admin to view learners.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={styles.shell} aria-busy="true">
        <p>Loading learners…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.shell}>
        <p role="alert">{error}</p>
        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => void load()}>
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <div className={styles.topBar}>
        <h1 className={styles.titleRow}>
          Learners{" "}
          <span className={styles.wireTag} style={{ opacity: 0.85 }}>
            Admin
          </span>
        </h1>
        <div className={styles.actionsRow}>
          <Link href="/admin/reports" className={`${styles.btn} ${styles.btnSecondary}`}>
            Progress reports
          </Link>
          {canAddLearners ? (
            <Link href="/admin/learners/add" className={`${styles.btn} ${styles.btnPrimary}`}>
              Add learner
            </Link>
          ) : (
            <span
              className={styles.caption}
              style={{ alignSelf: "center", maxWidth: "14rem", textAlign: "right" }}
              title="Only tenant admins can create learner accounts."
            >
              Add learner (admin only)
            </span>
          )}
        </div>
      </div>

      {provisioned ? (
        <p className={styles.csvFeedback} role="status">
          Learner saved. They can sign in with the email you added (tenant-scoped login id).
        </p>
      ) : null}

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <label htmlFor="learners-admin-search" className={styles.srOnly}>
            Filter learners by name or email
          </label>
          <input
            id="learners-admin-search"
            type="search"
            className={styles.searchInput}
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Added</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.tableEmpty}>
                  {learners.length === 0
                    ? "No learners yet. Use Add learner to invite someone by email (admins only)."
                    : "No learners match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.displayName}</td>
                  <td>
                    <a href={`mailto:${encodeURIComponent(row.email)}`} className={styles.emailLink}>
                      {row.email}
                    </a>
                  </td>
                  <td>{formatAddedAt(row.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
