"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  DataTable,
  EmptyState,
  Pagination,
  Tooltip,
  type DataTableColumn,
  type DataTableSortState,
} from "@conductor/ui";

import {
  fetchLearners,
  probeAdminRoute,
  type ApiError,
  type LearnerSummary,
  type LmsApiSession,
} from "../../../lib/lms-api-client";
import { getSession } from "../../../lib/lms-session";
import { AdminLoadError, AdminLoading, AdminSignInRequired } from "../admin-page-states";
import styles from "../admin-learners-shell.module.css";

const PAGE_SIZE = 10;

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
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [query, setQuery] = useState("");
  const [canAddLearners, setCanAddLearners] = useState(false);
  const [sort, setSort] = useState<DataTableSortState>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const s = getSession();
    if (!s) {
      setSession(null);
      setLoading(false);
      return;
    }
    setSession(s);
    setLoading(true);
    setLoadError(null);
    const [listRes, adminOk] = await Promise.all([fetchLearners(s), probeAdminRoute(s)]);
    setCanAddLearners(adminOk);
    if (!listRes.ok) {
      setLoadError(listRes.error);
      setLoading(false);
      return;
    }
    setLearners(listRes.learners);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [query, sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return learners;
    }
    return learners.filter(
      (row) => row.email.toLowerCase().includes(q) || row.displayName.toLowerCase().includes(q)
    );
  }, [learners, query]);

  const sortedRows = useMemo(() => {
    const list = [...filtered];
    if (!sort) {
      return list;
    }
    const { columnId, direction } = sort;
    const mul = direction === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (columnId === "name") {
        return mul * a.displayName.localeCompare(b.displayName);
      }
      if (columnId === "email") {
        return mul * a.email.localeCompare(b.email);
      }
      if (columnId === "added") {
        return mul * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      return 0;
    });
    return list;
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [sortedRows, safePage]);

  const columns = useMemo<DataTableColumn<LearnerSummary>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        sortable: true,
        cell: (row) => row.displayName,
      },
      {
        id: "email",
        header: "Email",
        sortable: true,
        cell: (row) => (
          <a href={`mailto:${encodeURIComponent(row.email)}`} className={styles.emailLink}>
            {row.email}
          </a>
        ),
      },
      {
        id: "added",
        header: "Added",
        sortable: true,
        align: "end",
        cell: (row) => formatAddedAt(row.createdAt),
      },
    ],
    []
  );

  const emptyState = (
    <EmptyState
      title={learners.length === 0 ? "No learners yet" : "No matches"}
      description={
        learners.length === 0
          ? "Use Add learner to invite someone by email (tenant admins only)."
          : "Try a different search term."
      }
    />
  );

  const paginationSlot =
    !loading && sortedRows.length > 0 ? (
      <Pagination
        page={safePage}
        pageCount={pageCount}
        onPageChange={setPage}
        aria-label="Learners list pages"
      />
    ) : null;

  if (!session && !loading) {
    return <AdminSignInRequired context="view the learners directory" />;
  }

  if (loadError) {
    return <AdminLoadError error={loadError} onRetry={() => void load()} />;
  }

  if (!session) {
    return <AdminLoading label="Loading learners…" />;
  }

  return (
    <div className={styles.shell}>
      <div className={styles.topBar}>
        <h2 className={styles.titleRow}>
          Learners{" "}
          <span className={styles.staffTag} style={{ opacity: 0.85 }}>
            Staff
          </span>
        </h2>
        <div className={styles.actionsRow}>
          <Link href="/admin/reports" className={`${styles.btn} ${styles.btnSecondary}`}>
            Progress reports
          </Link>
          {canAddLearners ? (
            <Link href="/admin/learners/add" className={`${styles.btn} ${styles.btnPrimary}`}>
              Add learner
            </Link>
          ) : (
            <Tooltip content="Only tenant admins can create learner accounts.">
              <span
                className={styles.caption}
                style={{ alignSelf: "center", maxWidth: "14rem", textAlign: "right" }}
              >
                Add learner (admin only)
              </span>
            </Tooltip>
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

      <div className={styles.dataTableBlock}>
        <DataTable<LearnerSummary>
          aria-label="Learners"
          columns={columns}
          rows={pageSlice}
          getRowId={(row) => row.id}
          sort={sort}
          onSortChange={setSort}
          loading={loading}
          skeletonRows={6}
          empty={emptyState}
          responsiveMode="cards"
          pagination={paginationSlot}
        />
      </div>
    </div>
  );
}
