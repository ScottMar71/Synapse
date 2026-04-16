"use client";

import type { ReactElement, ReactNode } from "react";

import { cx } from "../internal/cx";
import { Skeleton } from "../primitives/skeleton";
import styles from "./data-table.module.css";

export type SortDirection = "asc" | "desc";

export type DataTableSortState = {
  columnId: string;
  direction: SortDirection;
} | null;

export type DataTableColumn<T> = {
  id: string;
  header: string;
  sortable?: boolean;
  cardLabel?: string;
  align?: "start" | "end";
  cell: (row: T) => ReactNode;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  sort?: DataTableSortState;
  onSortChange?: (next: DataTableSortState) => void;
  loading?: boolean;
  skeletonRows?: number;
  /** Shown when `rows` is empty and not loading */
  empty: ReactNode;
  /** `cards`: stacked cards below `md`; `scroll`: horizontal scroll + hint on narrow */
  responsiveMode?: "cards" | "scroll";
  "aria-label"?: string;
  pagination?: ReactNode;
};

function nextSort(prev: DataTableSortState, columnId: string): DataTableSortState {
  if (!prev || prev.columnId !== columnId) {
    return { columnId, direction: "asc" };
  }
  if (prev.direction === "asc") {
    return { columnId, direction: "desc" };
  }
  return null;
}

function sortAriaLabel(direction: SortDirection): string {
  return direction === "asc" ? "sorted ascending" : "sorted descending";
}

/**
 * Responsive table with optional sortable headers (`aria-sort` on active column),
 * sticky header row, loading skeleton (`aria-busy`), and empty slot.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  sort,
  onSortChange,
  loading = false,
  skeletonRows = 5,
  empty,
  responsiveMode = "cards",
  "aria-label": ariaLabel = "Data",
  pagination,
}: DataTableProps<T>): ReactElement {
  const showCards = responsiveMode === "cards";

  const tableSection = (
    <div className={styles.scrollOuter}>
      {responsiveMode === "scroll" ? (
        <p className={styles.scrollHint}>Scroll horizontally to view all columns.</p>
      ) : null}
      <table className={styles.table} aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((col) => {
              const colSort = sort && sort.columnId === col.id ? sort : null;
              const ariaSort =
                col.sortable && onSortChange
                  ? colSort
                    ? colSort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                  : undefined;
              const end = col.align === "end";
              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={ariaSort}
                  className={end ? styles.thEnd : undefined}
                >
                  {col.sortable && onSortChange ? (
                    <button
                      type="button"
                      className={styles.sortBtn}
                      onClick={() => {
                        onSortChange(nextSort(sort ?? null, col.id));
                      }}
                    >
                      {col.header}
                      {colSort ? (
                        <span className={styles.sortIcon} aria-hidden="true">
                          {colSort.direction === "asc" ? "▲" : "▼"}
                        </span>
                      ) : null}
                      {colSort ? (
                        <span className={styles.srOnly}>{` ${sortAriaLabel(colSort.direction)}`}</span>
                      ) : (
                        <span className={styles.srOnly}>, sortable</span>
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, r) => (
                <tr key={`sk-${r}`} className={styles.skeletonRow}>
                  {columns.map((col) => (
                    <td key={col.id}>
                      <Skeleton variant="line" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.length === 0
              ? (
                  <tr>
                    <td colSpan={columns.length} className={styles.emptyCell}>
                      {empty}
                    </td>
                  </tr>
                )
              : rows.map((row) => (
                  <tr key={getRowId(row)}>
                    {columns.map((col) => (
                      <td key={col.id} className={col.align === "end" ? styles.tdEnd : undefined}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  );

  const cardsSection =
    showCards && !loading && rows.length > 0 ? (
      <div className={styles.cardsMobile} aria-label={`${ariaLabel} cards`}>
        {rows.map((row) => (
          <article key={getRowId(row)} className={styles.card}>
            {columns.map((col) => (
              <div key={col.id} className={styles.cardRow}>
                <div className={styles.cardLabel}>{col.cardLabel ?? col.header}</div>
                <div>{col.cell(row)}</div>
              </div>
            ))}
          </article>
        ))}
      </div>
    ) : showCards && loading ? (
      <div className={styles.cardsMobile} aria-hidden="true">
        {Array.from({ length: Math.min(skeletonRows, 3) }).map((_, i) => (
          <div key={`csk-${i}`} className={styles.card}>
            <Skeleton variant="block" />
          </div>
        ))}
      </div>
    ) : showCards && rows.length === 0 ? (
      <div className={styles.cardsMobile}>{empty}</div>
    ) : null;

  return (
    <div
      className={cx(styles.region, showCards ? styles.modeCards : styles.modeScroll)}
      aria-busy={loading || undefined}
      aria-live={loading ? "polite" : undefined}
    >
      <div className={styles.tablePanel}>{tableSection}</div>
      {showCards ? cardsSection : null}
      {pagination}
    </div>
  );
}
