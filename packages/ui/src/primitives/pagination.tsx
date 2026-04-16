import type { ReactElement } from "react";

import { cx } from "../internal/cx";
import styles from "./pagination.module.css";

export type PaginationProps = {
  /** 1-based current page */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  "aria-label"?: string;
  /** Max numbered buttons (excluding ellipsis). */
  siblingCount?: number;
};

function rangeWithEllipsis(page: number, pageCount: number, siblingCount: number): (number | "ellipsis")[] {
  if (pageCount <= 1) {
    return [1];
  }
  const pages = new Set<number>();
  pages.add(1);
  pages.add(pageCount);
  for (let i = page - siblingCount; i <= page + siblingCount; i += 1) {
    if (i >= 1 && i <= pageCount) {
      pages.add(i);
    }
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const p = sorted[i];
    const prev = sorted[i - 1];
    if (i > 0 && prev !== undefined && p - prev > 1) {
      out.push("ellipsis");
    }
    out.push(p);
  }
  return out;
}

/**
 * Page controls with `aria-current="page"` on the active page (§3.1 Pagination).
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  "aria-label": ariaLabel = "Pagination",
  siblingCount = 1,
}: PaginationProps): ReactElement | null {
  if (pageCount < 1) {
    return null;
  }

  const items = rangeWithEllipsis(page, pageCount, siblingCount);

  return (
    <nav className={styles.nav} aria-label={ariaLabel}>
      <button
        type="button"
        className={styles.edgeBtn}
        disabled={page <= 1}
        onClick={() => {
          onPageChange(page - 1);
        }}
      >
        Previous
      </button>
      <ol className={styles.list}>
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <li key={`e-${index}`} className={styles.ellipsis} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={cx(styles.pageBtn, item === page ? styles.pageBtnCurrent : undefined)}
                aria-current={item === page ? "page" : undefined}
                onClick={() => {
                  if (item !== page) {
                    onPageChange(item);
                  }
                }}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ol>
      <button
        type="button"
        className={styles.edgeBtn}
        disabled={page >= pageCount}
        onClick={() => {
          onPageChange(page + 1);
        }}
      >
        Next
      </button>
    </nav>
  );
}
