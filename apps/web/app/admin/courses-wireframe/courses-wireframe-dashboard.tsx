"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import catStyles from "../categories-wireframe/categories-wireframe.module.css";
import {
  type DemoCategoryNode,
  type DemoCourseWithFolder,
  collectAllDemoCoursesWithFolders,
  findCategoryInNodes,
  flattenCategoryFolderOptionsFromRoots,
  getCategoryBreadcrumbInNodes
} from "../categories-wireframe/demo-category-data";
import { wireframeCustomCategoriesChangedEventName } from "../categories-wireframe/wireframe-custom-categories-storage";
import { getWireframeMergedCategoryTree } from "../categories-wireframe/wireframe-merge-category-tree";
import {
  clearWireframeSelectedCourseIds,
  readWireframeCourseFolderAssignments,
  readWireframeCourseStatusAssignments,
  readWireframeSelectedCourseIds,
  writeWireframeCourseFolderAssignment,
  writeWireframeCourseStatusAssignment,
  writeWireframeSelectedCourseIds
} from "../wireframe-course-assignments";

function courseStatusClass(visibility: DemoCourseWithFolder["visibility"]): string {
  if (visibility === "Published") {
    return `${catStyles.courseBadge} ${catStyles.coursePublished}`;
  }
  if (visibility === "Draft") {
    return `${catStyles.courseBadge} ${catStyles.courseDraft}`;
  }
  return `${catStyles.courseBadge} ${catStyles.courseRetired}`;
}

function visibilityBadgeClass(visibility: DemoCourseWithFolder["folderVisibility"]): string {
  if (visibility === "Catalog") {
    return `${catStyles.badge} ${catStyles.badgeOk}`;
  }
  if (visibility === "Admin only") {
    return `${catStyles.badge} ${catStyles.badgeWarn}`;
  }
  return `${catStyles.badge} ${catStyles.badgeMuted}`;
}

function applyFolderOverride(
  row: DemoCourseWithFolder,
  folderAssignments: Record<string, string>,
  categoryRoots: readonly DemoCategoryNode[]
): DemoCourseWithFolder {
  const override = folderAssignments[row.id];
  if (!override) {
    return row;
  }
  const cat = findCategoryInNodes(categoryRoots, override);
  if (!cat) {
    return row;
  }
  const path = getCategoryBreadcrumbInNodes(categoryRoots, override)
    .map((n) => n.name)
    .join(" / ");
  return {
    ...row,
    folderId: override,
    folderPath: path,
    folderVisibility: cat.visibility
  };
}

export function CoursesWireframeDashboard(): ReactElement {
  const baseRows = useMemo(() => collectAllDemoCoursesWithFolders(), []);
  const [mergedTreeTick, setMergedTreeTick] = useState(0);
  const mergedCategoryRoots = useMemo(() => getWireframeMergedCategoryTree(), [mergedTreeTick]);
  const folderOptions = useMemo(
    () => flattenCategoryFolderOptionsFromRoots(mergedCategoryRoots),
    [mergedCategoryRoots]
  );
  const [folderAssignments, setFolderAssignments] = useState<Record<string, string>>({});
  const [statusAssignments, setStatusAssignments] = useState<
    Record<string, DemoCourseWithFolder["visibility"]>
  >({});

  useEffect(() => {
    setFolderAssignments(readWireframeCourseFolderAssignments());
    setStatusAssignments(readWireframeCourseStatusAssignments());
  }, []);

  useEffect(() => {
    const ev = wireframeCustomCategoriesChangedEventName();
    function bumpMergedTree(): void {
      setMergedTreeTick((n) => n + 1);
    }
    window.addEventListener(ev, bumpMergedTree);
    return () => {
      window.removeEventListener(ev, bumpMergedTree);
    };
  }, []);

  const rows = useMemo(() => {
    return baseRows.map((r) => {
      const withFolder = applyFolderOverride(r, folderAssignments, mergedCategoryRoots);
      const st = statusAssignments[r.id];
      return st ? { ...withFolder, visibility: st } : withFolder;
    });
  }, [baseRows, folderAssignments, mergedCategoryRoots, statusAssignments]);

  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [selectionHydrated, setSelectionHydrated] = useState(false);
  const [targetCategoryFolderId, setTargetCategoryFolderId] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const selectAllFilteredRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedIds(new Set(readWireframeSelectedCourseIds()));
    setSelectionHydrated(true);
  }, []);

  useEffect(() => {
    if (!selectionHydrated) {
      return;
    }
    if (pathname === "/admin/courses-wireframe") {
      setSelectedIds(new Set(readWireframeSelectedCourseIds()));
    }
  }, [pathname, selectionHydrated]);

  useEffect(() => {
    if (!selectionHydrated) {
      return;
    }
    writeWireframeSelectedCourseIds([...selectedIds]);
  }, [selectedIds, selectionHydrated]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.folderPath.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        row.skillTags.toLowerCase().includes(q)
    );
  }, [query, rows]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((row) => selectedIds.has(row.id));
  const someFilteredSelected = filtered.some((row) => selectedIds.has(row.id)) && !allFilteredSelected;

  useEffect(() => {
    const el = selectAllFilteredRef.current;
    if (el) {
      el.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  function toggleRowSelection(courseId: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  }

  function toggleSelectAllFiltered(): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const every = filtered.length > 0 && filtered.every((row) => next.has(row.id));
      if (every) {
        for (const row of filtered) {
          next.delete(row.id);
        }
      } else {
        for (const row of filtered) {
          next.add(row.id);
        }
      }
      return next;
    });
  }

  function onPublish(courseId: string, title: string): void {
    writeWireframeCourseStatusAssignment(courseId, "Published");
    setStatusAssignments((prev) => ({ ...prev, [courseId]: "Published" }));
    setStatusMessage(`Wireframe: marked “${title}” as Published (saved in this browser only).`);
  }

  function onAddSelectedToCategory(): void {
    if (selectedIds.size === 0) {
      setStatusMessage("Tick one or more courses, choose a category, then click Add selected to category.");
      return;
    }
    if (!targetCategoryFolderId) {
      setStatusMessage("Choose a category from the list first.");
      return;
    }
    const count = selectedIds.size;
    const cat = findCategoryInNodes(mergedCategoryRoots, targetCategoryFolderId);
    const label = cat
      ? getCategoryBreadcrumbInNodes(mergedCategoryRoots, targetCategoryFolderId)
          .map((n) => n.name)
          .join(" / ")
      : targetCategoryFolderId;
    for (const id of selectedIds) {
      writeWireframeCourseFolderAssignment(id, targetCategoryFolderId);
    }
    setFolderAssignments(readWireframeCourseFolderAssignments());
    clearWireframeSelectedCourseIds();
    setSelectedIds(new Set());
    setStatusMessage(`Assigned ${count} course(s) to “${label}” (wireframe: saved in this browser only).`);
  }

  return (
    <main className={catStyles.shell}>
      <div className={catStyles.topBar}>
        <h1 className={catStyles.titleRow}>
          Courses
          <span className={catStyles.wireTag}>Wireframe</span>
        </h1>
        <div className={catStyles.actionsRow}>
          <Link href="/admin/assignments-wireframe" className={`${catStyles.btn} ${catStyles.btnSecondary}`}>
            Assignments
          </Link>
          <Link href="/admin/reporting-wireframe" className={`${catStyles.btn} ${catStyles.btnSecondary}`}>
            Reporting
          </Link>
          <Link href="/admin/learners-wireframe" className={`${catStyles.btn} ${catStyles.btnSecondary}`}>
            Learners
          </Link>
          <Link href="/admin/categories-wireframe" className={`${catStyles.btn} ${catStyles.btnSecondary}`}>
            Course categories
          </Link>
          <Link href="/admin/courses/wireframe-demo" className={`${catStyles.btn} ${catStyles.btnPrimary}`}>
            New course
          </Link>
        </div>
      </div>

      {statusMessage ? (
        <p className={catStyles.caption} role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}

      <div className={catStyles.toolbar}>
        <div className={catStyles.searchWrap}>
          <label htmlFor="courses-wireframe-search" className={catStyles.srOnly}>
            Search courses
          </label>
          <svg className={catStyles.searchIcon} viewBox="0 0 16 16" aria-hidden>
            <path
              fill="currentColor"
              d="M11 6.5a4.5 4.5 0 1 0-1 2.8l3.2 3.2.7-.7-3.2-3.2A4.5 4.5 0 0 0 11 6.5Zm-4 0a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
            />
          </svg>
          <input
            id="courses-wireframe-search"
            type="search"
            className={catStyles.searchInput}
            placeholder="Search by title, category, or id"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
        </div>
      </div>

      <div className={catStyles.bulkAssignRow}>
        <div className={catStyles.bulkAssignField}>
          <label htmlFor="courses-wireframe-target-category" className={catStyles.bulkAssignLabel}>
            Selected category
          </label>
          <select
            id="courses-wireframe-target-category"
            className={catStyles.bulkAssignSelect}
            value={targetCategoryFolderId}
            onChange={(e) => {
              setTargetCategoryFolderId(e.target.value);
            }}
          >
            <option value="">Choose category…</option>
            {folderOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className={`${catStyles.btn} ${catStyles.btnPrimary}`} onClick={onAddSelectedToCategory}>
          Add selected to category
        </button>
      </div>

      <div className={catStyles.tableWrap}>
        <table className={catStyles.table}>
          <thead>
            <tr>
              <th scope="col" className={catStyles.tableSelectCol}>
                <span className={catStyles.srOnly}>Select rows</span>
                <input
                  ref={selectAllFilteredRef}
                  type="checkbox"
                  className={catStyles.checkbox}
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  disabled={filtered.length === 0}
                  aria-label="Select all courses in this filtered list"
                />
              </th>
              <th scope="col">Course</th>
              <th scope="col">Category</th>
              <th scope="col">Status</th>
              <th scope="col">Visibility</th>
              <th scope="col">Preview</th>
              <th scope="col">Assign learners</th>
              <th scope="col">Publish</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className={catStyles.tableEmpty}>
                  No courses match this search. Clear the filter or open{" "}
                  <Link href="/admin/categories-wireframe">course categories</Link> to review the demo catalog tree.
                </td>
              </tr>
            ) : null}
            {filtered.map((row) => {
              const editorHref = `/admin/courses/${encodeURIComponent(row.id)}?folder=${encodeURIComponent(row.folderId)}`;
              const isPublished = row.visibility === "Published";
              return (
                <tr key={row.id}>
                  <td className={catStyles.tableSelectCol}>
                    <input
                      type="checkbox"
                      className={catStyles.checkbox}
                      checked={selectedIds.has(row.id)}
                      onChange={() => {
                        toggleRowSelection(row.id);
                      }}
                      aria-label={`Select ${row.title}`}
                    />
                  </td>
                  <td>
                    <Link href={editorHref} className={catStyles.courseTitleLink}>
                      {row.title}
                    </Link>
                    <div className={catStyles.pill} style={{ marginTop: "var(--space-1)" }}>
                      {row.id}
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/admin/categories-wireframe/${encodeURIComponent(row.folderId)}`}
                      className={catStyles.courseTitleLink}
                      style={{ fontWeight: 500 }}
                    >
                      {row.folderPath}
                    </Link>
                  </td>
                  <td>
                    <span className={courseStatusClass(row.visibility)}>{row.visibility}</span>
                  </td>
                  <td>
                    <span className={visibilityBadgeClass(row.folderVisibility)}>{row.folderVisibility}</span>
                  </td>
                  <td>
                    <Link href={editorHref} className={`${catStyles.btn} ${catStyles.btnSecondary}`}>
                      Preview
                    </Link>
                  </td>
                  <td>
                    <Link
                      href={`/admin/assignments-wireframe?courseId=${encodeURIComponent(row.id)}`}
                      className={`${catStyles.btn} ${catStyles.btnSecondary}`}
                    >
                      Open
                    </Link>
                  </td>
                  <td>
                    {isPublished ? (
                      <span className={catStyles.pill}>Live</span>
                    ) : (
                      <button
                        type="button"
                        className={`${catStyles.btn} ${catStyles.btnPrimary}`}
                        onClick={() => {
                          onPublish(row.id, row.title);
                        }}
                      >
                        Publish
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={catStyles.caption}>
        Static wireframe: the table lists every demo course from the same hierarchy as{" "}
        <Link href="/admin/categories-wireframe">Course categories</Link>. <strong>Status</strong> is the course
        lifecycle; <strong>Visibility</strong> is the storefront rule from the folder the course sits in (Catalog /
        Admin only / Hidden).         <strong>Preview</strong> opens the admin course editor for that id with the{" "}
        <code className={catStyles.pill}>folder</code> query set. <strong>Assign learners</strong> opens the{" "}
        <Link href="/admin/assignments-wireframe">Assignments</Link> wireframe filtered to that course.{" "}
        <strong>Publish</strong> writes a Published status to{" "}
        <code className={catStyles.pill}>localStorage</code> in this browser. If you use{" "}
        <strong>Save category assignment</strong> in the editor, refresh this page to refresh the Category column.
        Use <strong>Selected category</strong> and <strong>Add selected to category</strong> to assign ticked rows; the
        same folder map is reflected on <Link href="/admin/categories-wireframe">Course categories</Link> and in the
        course editor <strong>Course Categories</strong> panel.
        {Object.keys(folderAssignments).length > 0 ? ` Saved folder overrides: ${Object.keys(folderAssignments).length}.` : ""}
      </p>
    </main>
  );
}
