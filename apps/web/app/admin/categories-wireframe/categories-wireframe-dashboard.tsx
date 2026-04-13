"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./categories-wireframe.module.css";
import {
  type DemoCategoryNode,
  type DemoCourseRow,
  collectAllDemoCoursesWithFolders,
  DEMO_CATEGORY_TREE,
  findCategoryInNodes,
  getCategoryBreadcrumbInNodes,
  listCoursesEffectiveInFolder
} from "./demo-category-data";
import {
  appendWireframeCustomCategory,
  dispatchWireframeCustomCategoriesChanged,
  readWireframeCustomCategories,
  type WireframeCustomCategoryGrouping,
  type WireframeCustomCategoryVisibility,
  type WireframeStoredCustomCategory
} from "./wireframe-custom-categories-storage";
import { mergeDemoCategoryTreeWithCustom } from "./wireframe-merge-category-tree";
import { readWireframeCourseFolderAssignments } from "../wireframe-course-assignments";

type CategoriesWireframeDashboardProps = {
  initialCategoryId: string;
};

const COURSE_ACTION_ITEMS = [
  "Open in course editor (wireframe)",
  "Move to another category",
  "Duplicate assignment",
  "Remove from this category"
] as const;

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

function collectCategoryIds(nodes: DemoCategoryNode[]): string[] {
  const ids: string[] = [];
  function walk(list: DemoCategoryNode[]): void {
    for (const n of list) {
      ids.push(n.id);
      walk(n.children);
    }
  }
  walk(nodes);
  return ids;
}

function countCoursesInSubtree(node: DemoCategoryNode): number {
  let total = node.courses.length;
  for (const child of node.children) {
    total += countCoursesInSubtree(child);
  }
  return total;
}

function collectAllNodeIds(nodes: readonly DemoCategoryNode[]): Set<string> {
  const ids = new Set<string>();
  function walk(list: readonly DemoCategoryNode[]): void {
    for (const n of list) {
      ids.add(n.id);
      walk(n.children);
    }
  }
  walk(nodes);
  return ids;
}

function slugFromCategoryName(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base.length > 0 ? base : "folder";
}

function CategoryTreeList(props: {
  nodes: DemoCategoryNode[];
  depth: number;
  selectedId: string;
  expandedIds: ReadonlySet<string>;
  onToggleExpand: (id: string) => void;
}): ReactElement {
  const { nodes, depth, selectedId, expandedIds, onToggleExpand } = props;

  return (
    <ul className={styles.treeList} style={{ marginLeft: depth > 0 ? "var(--space-2)" : 0 }}>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        return (
          <li key={node.id} className={styles.treeRow}>
            <div style={{ display: "flex", alignItems: "center", minHeight: "2rem" }}>
              {hasChildren ? (
                <button
                  type="button"
                  className={styles.treeToggle}
                  aria-expanded={isExpanded}
                  aria-controls={`cat-tree-children-${node.id}`}
                  onClick={() => {
                    onToggleExpand(node.id);
                  }}
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
              ) : (
                <span className={styles.treeToggleSpacer} aria-hidden />
              )}
              <Link
                href={`/admin/categories-wireframe/${node.id}`}
                className={`${styles.treeLink} ${node.id === selectedId ? styles.treeLinkActive : ""}`}
              >
                {node.name}
              </Link>
            </div>
            {hasChildren && isExpanded ? (
              <div id={`cat-tree-children-${node.id}`}>
                <CategoryTreeList
                  nodes={node.children}
                  depth={depth + 1}
                  selectedId={selectedId}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function visibilityBadgeClass(visibility: DemoCategoryNode["visibility"]): string {
  if (visibility === "Catalog") {
    return `${styles.badge} ${styles.badgeOk}`;
  }
  if (visibility === "Admin only") {
    return `${styles.badge} ${styles.badgeWarn}`;
  }
  return `${styles.badge} ${styles.badgeMuted}`;
}

function courseStatusClass(visibility: DemoCourseRow["visibility"]): string {
  if (visibility === "Published") {
    return `${styles.courseBadge} ${styles.coursePublished}`;
  }
  if (visibility === "Draft") {
    return `${styles.courseBadge} ${styles.courseDraft}`;
  }
  return `${styles.courseBadge} ${styles.courseRetired}`;
}

export function CategoriesWireframeDashboard({
  initialCategoryId
}: CategoriesWireframeDashboardProps): ReactElement {
  const router = useRouter();
  const [customCategories, setCustomCategories] = useState<WireframeStoredCustomCategory[]>([]);
  const [treeReady, setTreeReady] = useState(false);

  useEffect(() => {
    setCustomCategories(readWireframeCustomCategories());
    setTreeReady(true);
  }, []);

  const mergedTree = useMemo(
    () => mergeDemoCategoryTreeWithCustom(DEMO_CATEGORY_TREE, customCategories),
    [customCategories]
  );

  const selected = useMemo(
    () => findCategoryInNodes(mergedTree, initialCategoryId),
    [mergedTree, initialCategoryId]
  );
  const allWithFolders = useMemo(() => collectAllDemoCoursesWithFolders(), []);
  const [folderAssignments, setFolderAssignments] = useState<Record<string, string>>({});
  const [courseQuery, setCourseQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(collectCategoryIds(DEMO_CATEGORY_TREE))
  );
  const [rowForActions, setRowForActions] = useState<DemoCourseRow | null>(null);
  const rowActionsDialogRef = useRef<HTMLDialogElement>(null);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const newCategoryDialogRef = useRef<HTMLDialogElement>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPlacement, setNewCatPlacement] = useState<"sub" | "root">("sub");
  const [newCatDescription, setNewCatDescription] = useState("");
  const [newCatGrouping, setNewCatGrouping] = useState<WireframeCustomCategoryGrouping>("Topic");
  const [newCatVisibility, setNewCatVisibility] = useState<WireframeCustomCategoryVisibility>("Catalog");
  const [newCatFormError, setNewCatFormError] = useState<string | null>(null);

  useEffect(() => {
    setCourseQuery("");
    setFolderAssignments(readWireframeCourseFolderAssignments());
  }, [initialCategoryId]);

  useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const id of collectCategoryIds(mergedTree)) {
        next.add(id);
      }
      return next;
    });
  }, [mergedTree]);

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

  useEffect(() => {
    const el = newCategoryDialogRef.current;
    if (!el) {
      return;
    }
    if (newCategoryOpen) {
      if (!el.open) {
        el.showModal();
      }
    } else if (el.open) {
      el.close();
    }
  }, [newCategoryOpen]);

  function closeRowActionsDialog(): void {
    rowActionsDialogRef.current?.close();
  }

  function closeNewCategoryDialog(): void {
    newCategoryDialogRef.current?.close();
  }

  function openNewCategoryDialog(): void {
    setNewCatName("");
    setNewCatPlacement("sub");
    setNewCatDescription("");
    setNewCatGrouping("Topic");
    setNewCatVisibility("Catalog");
    setNewCatFormError(null);
    setNewCategoryOpen(true);
  }

  function submitNewCategory(): void {
    if (!selected) {
      return;
    }
    const name = newCatName.trim();
    if (name.length === 0) {
      setNewCatFormError("Enter a folder name.");
      return;
    }
    const slug = slugFromCategoryName(name);
    const existing = collectAllNodeIds(mergedTree);
    let id = `cat-custom-${slug}`;
    let n = 2;
    while (existing.has(id)) {
      id = `cat-custom-${slug}-${n}`;
      n += 1;
    }
    const parentId: string | "__root__" = newCatPlacement === "root" ? "__root__" : selected.id;
    const description =
      newCatDescription.trim().length > 0
        ? newCatDescription.trim()
        : "Custom wireframe folder (saved in this browser only).";
    const entry: WireframeStoredCustomCategory = {
      id,
      parentId,
      name,
      slug,
      description,
      grouping: newCatGrouping,
      visibility: newCatVisibility
    };
    appendWireframeCustomCategory(entry);
    setCustomCategories(readWireframeCustomCategories());
    dispatchWireframeCustomCategoriesChanged();
    setNewCategoryOpen(false);
    router.push(`/admin/categories-wireframe/${encodeURIComponent(id)}`);
  }

  function onToggleExpand(id: string): void {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const breadcrumb = selected ? getCategoryBreadcrumbInNodes(mergedTree, selected.id) : [];
  const subtreeCourseCount = selected ? countCoursesInSubtree(selected) : 0;

  const effectiveDirectCourses = useMemo(() => {
    if (!selected) {
      return [];
    }
    return listCoursesEffectiveInFolder(selected.id, selected, folderAssignments, allWithFolders);
  }, [selected, folderAssignments, allWithFolders]);

  const filteredCourses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    if (!q) {
      return effectiveDirectCourses;
    }
    return effectiveDirectCourses.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.skillTags.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
    );
  }, [effectiveDirectCourses, courseQuery]);

  if (!treeReady) {
    return (
      <main className={styles.shell}>
        <p className={styles.caption}>Loading category wireframe…</p>
      </main>
    );
  }

  if (!selected) {
    return (
      <main className={styles.shell}>
        <p className={styles.caption}>Category not found. Check the URL or create a folder from Course categories.</p>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <div className={styles.topBar}>
        <h1 className={styles.titleRow}>
          Course categories
          <span className={styles.wireTag}>Wireframe</span>
        </h1>
        <div className={styles.actionsRow}>
          <Link href="/admin/courses-wireframe" className={`${styles.btn} ${styles.btnSecondary}`}>
            All courses
          </Link>
          <Link href="/admin/assignments-wireframe" className={`${styles.btn} ${styles.btnSecondary}`}>
            Assignments
          </Link>
          <Link href="/admin/reporting-wireframe" className={`${styles.btn} ${styles.btnSecondary}`}>
            Reporting
          </Link>
          <Link href="/admin/learners-wireframe" className={`${styles.btn} ${styles.btnSecondary}`}>
            Learners
          </Link>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openNewCategoryDialog}>
            New category
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnSecondary}`}>
            Reorder
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnSecondary}`}>
            Import mapping
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <label htmlFor="category-global-search" className={styles.srOnly}>
            Search in hierarchy (wireframe)
          </label>
          <SearchIcon />
          <input
            id="category-global-search"
            type="search"
            className={styles.searchInput}
            placeholder="Search tree (wireframe)"
          />
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.filtersBtn}`}>
          <FilterIcon />
          <span style={{ marginLeft: "var(--space-2)" }}>Filters</span>
        </button>
      </div>

      <div className={styles.split}>
        <aside className={styles.treePanel} aria-label="Category hierarchy">
          <h2 className={styles.treeTitle}>Hierarchy</h2>
          <CategoryTreeList
            nodes={mergedTree}
            depth={0}
            selectedId={selected.id}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
          />
        </aside>

        <div className={styles.detail}>
          <nav aria-label="Breadcrumb">
            <ol className={styles.breadcrumb}>
              <li>
                <Link href="/admin/categories-wireframe">All categories</Link>
              </li>
              {breadcrumb.map((node, index) => (
                <li key={node.id}>
                  <span className={styles.breadcrumbSep} aria-hidden>
                    /
                  </span>
                  {index < breadcrumb.length - 1 ? (
                    <Link href={`/admin/categories-wireframe/${node.id}`}>{node.name}</Link>
                  ) : (
                    <span>{node.name}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <section className={styles.hero} aria-labelledby="category-hero-title">
            <h2 id="category-hero-title" className={styles.heroTitle}>
              {selected.name}
            </h2>
            <p className={styles.heroSlug}>/{selected.slug}</p>
            <p className={styles.heroBody}>{selected.description}</p>
            <div className={styles.metaRow}>
              <span className={visibilityBadgeClass(selected.visibility)}>{selected.visibility}</span>
              <span className={`${styles.badge} ${styles.badgeMuted}`}>{selected.grouping}</span>
            </div>
          </section>

          <section aria-labelledby="category-stats-title">
            <h3 id="category-stats-title" className={styles.sectionTitle}>
              Coverage
            </h3>
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <p className={styles.statValue}>{selected.children.length}</p>
                <p className={styles.statLabel}>Subfolders</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statValue}>{effectiveDirectCourses.length}</p>
                <p className={styles.statLabel}>Courses here</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statValue}>{subtreeCourseCount}</p>
                <p className={styles.statLabel}>Courses in subtree</p>
              </div>
            </div>
          </section>

          {selected.children.length > 0 ? (
            <section aria-labelledby="subcat-title">
              <h3 id="subcat-title" className={styles.sectionTitle}>
                Subcategories
              </h3>
              <div className={styles.subcatGrid}>
                {selected.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/admin/categories-wireframe/${child.id}`}
                    className={styles.subcatCard}
                  >
                    <p className={styles.subcatName}>{child.name}</p>
                    <p className={styles.subcatHint}>
                      {child.children.length} subfolders · {countCoursesInSubtree(child)} courses in subtree
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="courses-title">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-3)",
                marginBottom: "var(--space-3)"
              }}
            >
              <h3 id="courses-title" className={styles.sectionTitle} style={{ margin: 0 }}>
                Courses in this category
              </h3>
              <div className={styles.searchWrap} style={{ maxWidth: 260 }}>
                <label htmlFor="category-course-search" className={styles.srOnly}>
                  Filter courses in this category
                </label>
                <SearchIcon />
                <input
                  id="category-course-search"
                  type="search"
                  className={styles.searchInput}
                  placeholder="Filter listed courses"
                  value={courseQuery}
                  onChange={(event) => {
                    setCourseQuery(event.target.value);
                  }}
                />
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col" aria-label="Select row" />
                    <th scope="col">Course</th>
                    <th scope="col">Skills / tags</th>
                    <th scope="col">Status</th>
                    <th scope="col">Owners</th>
                    <th scope="col">Updated</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.tableEmpty}>
                        No courses match this filter in this category folder (subtree courses are not shown in this
                        table).
                      </td>
                    </tr>
                  ) : null}
                  {filteredCourses.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input type="checkbox" className={styles.checkbox} aria-label={`Select ${row.title}`} />
                      </td>
                      <td>
                        <Link
                          href={`/admin/courses/${encodeURIComponent(row.id)}?folder=${encodeURIComponent(selected.id)}`}
                          className={styles.courseTitleLink}
                          title="Wireframe — opens course editor with this category folder in context"
                        >
                          {row.title}
                        </Link>
                      </td>
                      <td>
                        <span className={styles.pill}>{row.skillTags}</span>
                      </td>
                      <td>
                        <span className={courseStatusClass(row.visibility)}>{row.visibility}</span>
                      </td>
                      <td>{row.owners}</td>
                      <td>{row.updated}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.rowActionsBtn}
                          aria-label={`Open actions for ${row.title}`}
                          aria-haspopup="dialog"
                          onClick={() => {
                            setRowForActions(row);
                          }}
                        >
                          …
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <dialog
        ref={newCategoryDialogRef}
        className={`${styles.actionModal} ${styles.actionModalWide}`}
        aria-labelledby="new-category-title"
        onClose={() => {
          setNewCategoryOpen(false);
        }}
      >
        <div className={styles.actionModalInner}>
          <h2 id="new-category-title" className={styles.actionModalTitle}>
            New category
          </h2>
          <p className={styles.actionModalSubtitle}>
            Creates a folder in this browser only (<code className={styles.pill}>localStorage</code>).
          </p>
          {newCatFormError ? (
            <p className={styles.modalFormError} role="alert">
              {newCatFormError}
            </p>
          ) : null}
          <div className={styles.modalForm}>
            <div className={styles.modalFormField}>
              <label htmlFor="new-cat-name" className={styles.modalFormLabel}>
                Name
              </label>
              <input
                id="new-cat-name"
                className={styles.modalFormInput}
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                }}
                placeholder="e.g. Partner certification"
                autoComplete="off"
              />
            </div>
            <fieldset className={styles.modalFormField}>
              <legend className={styles.modalFormLabel}>Placement</legend>
              <div className={styles.modalRadioRow}>
                <label className={styles.modalRadioLabel}>
                  <input
                    type="radio"
                    name="new-cat-placement"
                    checked={newCatPlacement === "sub"}
                    onChange={() => {
                      setNewCatPlacement("sub");
                    }}
                  />
                  <span>Subfolder of “{selected.name}”</span>
                </label>
                <label className={styles.modalRadioLabel}>
                  <input
                    type="radio"
                    name="new-cat-placement"
                    checked={newCatPlacement === "root"}
                    onChange={() => {
                      setNewCatPlacement("root");
                    }}
                  />
                  <span>Top-level folder (next to Compliance, Sales, …)</span>
                </label>
              </div>
            </fieldset>
            <div className={styles.modalFormField}>
              <label htmlFor="new-cat-grouping" className={styles.modalFormLabel}>
                Grouping
              </label>
              <select
                id="new-cat-grouping"
                className={styles.modalFormSelect}
                value={newCatGrouping}
                onChange={(e) => {
                  setNewCatGrouping(e.target.value as WireframeCustomCategoryGrouping);
                }}
              >
                <option value="Topic">Topic</option>
                <option value="Skill track">Skill track</option>
                <option value="Department">Department</option>
              </select>
            </div>
            <div className={styles.modalFormField}>
              <label htmlFor="new-cat-visibility" className={styles.modalFormLabel}>
                Visibility
              </label>
              <select
                id="new-cat-visibility"
                className={styles.modalFormSelect}
                value={newCatVisibility}
                onChange={(e) => {
                  setNewCatVisibility(e.target.value as WireframeCustomCategoryVisibility);
                }}
              >
                <option value="Catalog">Catalog</option>
                <option value="Admin only">Admin only</option>
                <option value="Hidden">Hidden</option>
              </select>
            </div>
            <div className={styles.modalFormField}>
              <label htmlFor="new-cat-desc" className={styles.modalFormLabel}>
                Description (optional)
              </label>
              <textarea
                id="new-cat-desc"
                className={styles.modalFormTextarea}
                value={newCatDescription}
                onChange={(e) => {
                  setNewCatDescription(e.target.value);
                }}
                placeholder="Shown on the category hero"
              />
            </div>
          </div>
          <div className={styles.actionModalFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => {
                closeNewCategoryDialog();
              }}
            >
              Cancel
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={submitNewCategory}>
              Create folder
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={rowActionsDialogRef}
        className={styles.actionModal}
        aria-labelledby="course-row-actions-title"
        onClose={() => {
          setRowForActions(null);
        }}
      >
        {rowForActions ? (
          <div className={styles.actionModalInner}>
            <h2 id="course-row-actions-title" className={styles.actionModalTitle}>
              Course actions
            </h2>
            <p className={styles.actionModalSubtitle}>{rowForActions.title}</p>
            <ul className={styles.actionModalList}>
              {COURSE_ACTION_ITEMS.map((label) => (
                <li key={label}>
                  <button
                    type="button"
                    className={styles.actionModalAction}
                    onClick={() => {
                      closeRowActionsDialog();
                    }}
                  >
                    {label}
                  </button>
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
        Static wireframe: top-level tree nodes use the same ids and labels as the “Course Categories” box on the course
        editor; nested folders are example subcategories for admin hierarchy (not shown in the editor checkbox list). The
        “Courses in this category” table lists demo courses in this folder plus any folder overrides from the{" "}
        <Link href="/admin/courses-wireframe">Courses</Link> wireframe or the course editor (saved in{" "}
        <code className={styles.pill}>localStorage</code> for this browser). The table filter applies to that list; the top search and Filters control are non-functional
        placeholders; row “…” opens a modal whose actions close the dialog without persisting changes.{" "}
        <strong>New category</strong> saves custom folders to <code className={styles.pill}>localStorage</code>. “Reorder”
        and “Import mapping” are visual placeholders.
      </p>
    </main>
  );
}
