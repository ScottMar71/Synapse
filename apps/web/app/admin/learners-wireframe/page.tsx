"use client";

import type { ChangeEvent, ReactElement } from "react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AvatarTile } from "./avatar-tile";
import type { DemoLearnerRow } from "./demo-learners";
import { DEMO_LEARNERS } from "./demo-learners";
import styles from "./learners-wireframe.module.css";
import {
  getDeletedLearnerIds,
  markLearnerDeletedWireframe
} from "./wireframe-deleted-learners";
import {
  getSuspendedLearnerIds,
  markLearnerSuspendedWireframe,
  markLearnerUnsuspendedWireframe
} from "./wireframe-suspended-learners";

const ACTION_ITEMS_ACTIVE = ["View profile", "Edit", "Suspend", "Log in as", "Delete"] as const;
const ACTION_ITEMS_SUSPENDED = ["View profile", "Edit", "Unsuspend", "Log in as", "Delete"] as const;

function SearchIcon(): ReactElement {
  return (
    <svg className={styles.searchIcon} viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M11 6.5a4.5 4.5 0 1 0-1 2.8l3.2 3.2.7-.7-3.2-3.2A4.5 4.5 0 0 0 11 6.5Zm-4 0a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
      />
    </svg>
  );
}

function FilterIcon(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M2 3h12v1.2l-4.5 4.5V13H6.5V8.7L2 4.2V3Zm1.2 1v.3L7 8.4V12h2V8.4l3.8-3.8V4H3.2Z"
      />
    </svg>
  );
}

export default function LearnersWireframePage(): ReactElement {
  const [rowForActions, setRowForActions] = useState<DemoLearnerRow | null>(null);
  const [csvPickMessage, setCsvPickMessage] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [suspendedIds, setSuspendedIds] = useState<string[]>([]);
  const [deletedBanner, setDeletedBanner] = useState(false);
  const rowActionsDialogRef = useRef<HTMLDialogElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDeletedIds(getDeletedLearnerIds());
    setSuspendedIds(getSuspendedLearnerIds());
    const url = new URL(window.location.href);
    if (url.searchParams.get("deleted") === "1") {
      setDeletedBanner(true);
      url.searchParams.delete("deleted");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }
  }, []);

  const visibleLearners = DEMO_LEARNERS.filter((row) => !deletedIds.includes(row.id));

  useEffect(() => {
    const el = rowActionsDialogRef.current;
    if (!el) {
      return;
    }
    if (rowForActions) {
      if (!el.open) {
        el.showModal();
      }
    } else if (el.open) {
      el.close();
    }
  }, [rowForActions]);

  function closeRowActionsDialog(): void {
    rowActionsDialogRef.current?.close();
  }

  function openCsvFilePicker(): void {
    setCsvPickMessage(null);
    csvFileInputRef.current?.click();
  }

  function onCsvFileInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      setCsvPickMessage(
        `Selected “${file.name}” (${file.size.toLocaleString()} bytes). Wireframe only — no upload.`
      );
    }
  }

  return (
    <main className={styles.shell}>
      <div className={styles.topBar}>
        <h1 className={styles.titleRow}>
          Learners
          <span className={styles.wireTag}>Wireframe</span>
        </h1>
        <div className={styles.actionsRow}>
          <input
            ref={csvFileInputRef}
            type="file"
            accept=".csv,text/csv"
            className={styles.srOnly}
            tabIndex={-1}
            aria-hidden
            onChange={onCsvFileInputChange}
          />
          <Link href="/admin/learners-wireframe/add" className={`${styles.btn} ${styles.btnPrimary}`}>
            Add learners
          </Link>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            aria-label="Upload learners CSV file"
            onClick={openCsvFilePicker}
          >
            CSV upload
          </button>
        </div>
      </div>

      {csvPickMessage ? (
        <p className={styles.csvFeedback} role="status">
          {csvPickMessage}
        </p>
      ) : null}

      {deletedBanner ? (
        <p className={styles.csvFeedback} role="status">
          Learner removed from this wireframe list (this browser tab only).{" "}
          <button
            type="button"
            className={styles.inlineTextButton}
            onClick={() => {
              setDeletedBanner(false);
            }}
          >
            Dismiss
          </button>
        </p>
      ) : null}

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <label htmlFor="learner-wireframe-search" className={styles.srOnly}>
            Search learners
          </label>
          <SearchIcon />
          <input
            id="learner-wireframe-search"
            type="search"
            className={styles.searchInput}
            placeholder="Search"
          />
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.filtersBtn}`}>
          <FilterIcon />
          <span style={{ marginLeft: "var(--space-2)" }}>FILTERS</span>
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" aria-label="Select row" />
              <th scope="col" aria-label="Avatar" />
              <th scope="col">Name</th>
              <th scope="col">Organization</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Created</th>
              <th scope="col">Last logged in</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleLearners.length === 0 ? (
              <tr>
                <td colSpan={10} className={styles.tableEmpty}>
                  No demo learners left in this tab’s wireframe list. Removals are kept in session storage across
                  refresh — use a private window or clear site data for this origin to see the demo rows again.
                </td>
              </tr>
            ) : null}
            {visibleLearners.map((row) => {
              const isSuspended = suspendedIds.includes(row.id);
              return (
              <tr key={row.id} className={isSuspended ? styles.tableRowSuspended : undefined}>
                <td>
                  <input type="checkbox" className={styles.checkbox} aria-label={`Select ${row.name}`} />
                </td>
                <td>
                  <AvatarTile seed={row.avatarId} />
                </td>
                <td>{row.name}</td>
                <td className={styles.organizationCell}>{row.organization}</td>
                <td>
                  <Link href={`mailto:${row.email}`} className={styles.emailLink}>
                    {row.email}
                  </Link>
                </td>
                <td>Learner</td>
                <td>{row.created}</td>
                <td className={row.lastLoggedIn ? undefined : styles.muted}>
                  {row.lastLoggedIn ?? "—"}
                </td>
                <td>
                  {isSuspended ? (
                    <span className={`${styles.badge} ${styles.badgeSuspended}`}>Suspended</span>
                  ) : (
                    <span
                      className={
                        row.status === "activated"
                          ? `${styles.badge} ${styles.badgeActivated}`
                          : `${styles.badge} ${styles.badgePending}`
                      }
                    >
                      {row.status === "activated" ? "Activated" : "Not activated"}
                    </span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.rowActionsBtn}
                    aria-label={`Open actions for ${row.name}`}
                    aria-haspopup="dialog"
                    onClick={() => {
                      setRowForActions(row);
                    }}
                  >
                    …
                  </button>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      <dialog
        ref={rowActionsDialogRef}
        className={styles.actionModal}
        aria-labelledby="learner-row-actions-title"
        onClose={() => {
          setRowForActions(null);
        }}
      >
        {rowForActions ? (
          <div className={styles.actionModalInner}>
            <h2 id="learner-row-actions-title" className={styles.actionModalTitle}>
              Learner actions
            </h2>
            <p className={styles.actionModalSubtitle}>{rowForActions.email}</p>
            <ul className={styles.actionModalList}>
              {(suspendedIds.includes(rowForActions.id)
                ? ACTION_ITEMS_SUSPENDED
                : ACTION_ITEMS_ACTIVE
              ).map((label) => (
                <li key={label}>
                  {label === "View profile" ? (
                    <Link
                      href={`/admin/learners-wireframe/${rowForActions.id}`}
                      className={styles.actionModalAction}
                      onClick={() => {
                        closeRowActionsDialog();
                      }}
                    >
                      {label}
                    </Link>
                  ) : label === "Edit" ? (
                    <Link
                      href={`/admin/learners-wireframe/${rowForActions.id}?edit=1`}
                      className={styles.actionModalAction}
                      onClick={() => {
                        closeRowActionsDialog();
                      }}
                    >
                      {label}
                    </Link>
                  ) : label === "Suspend" ? (
                    <button
                      type="button"
                      className={styles.actionModalAction}
                      onClick={() => {
                        markLearnerSuspendedWireframe(rowForActions.id);
                        setSuspendedIds(getSuspendedLearnerIds());
                        closeRowActionsDialog();
                      }}
                    >
                      {label}
                    </button>
                  ) : label === "Unsuspend" ? (
                    <button
                      type="button"
                      className={styles.actionModalAction}
                      onClick={() => {
                        markLearnerUnsuspendedWireframe(rowForActions.id);
                        setSuspendedIds(getSuspendedLearnerIds());
                        closeRowActionsDialog();
                      }}
                    >
                      {label}
                    </button>
                  ) : label === "Delete" ? (
                    <button
                      type="button"
                      className={`${styles.actionModalAction} ${styles.actionModalActionDanger}`}
                      onClick={() => {
                        if (
                          !window.confirm(
                            "Remove this learner from the wireframe demo list? Their profile URL will no longer work in this browser tab."
                          )
                        ) {
                          return;
                        }
                        markLearnerDeletedWireframe(rowForActions.id);
                        setDeletedIds(getDeletedLearnerIds());
                        closeRowActionsDialog();
                      }}
                    >
                      {label}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.actionModalAction}
                      onClick={() => {
                        closeRowActionsDialog();
                      }}
                    >
                      {label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div className={styles.actionModalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => {
                  closeRowActionsDialog();
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </dialog>

      <p className={styles.caption}>
        Static wireframe demo: “Add learners” opens the add-learner flow (same layout language as the profile
        page); “CSV upload” opens a file picker for .csv files and shows a short status line after you choose a
        file (nothing is uploaded); row “…” opens a modal; “View profile” opens the learner profile; “Edit”
        opens the same profile in edit mode; “Delete” removes the learner from this tab’s demo list and
        invalidates their profile URL; Jordan Smith starts as suspended (muted row and “Suspended” badge) for this
        browser tab; “Unsuspend” in the row menu clears suspension (stored in session storage with “Suspend” to
        restore); other controls are non-functional except mailto links on placeholder emails in the Email column.
      </p>
    </main>
  );
}
