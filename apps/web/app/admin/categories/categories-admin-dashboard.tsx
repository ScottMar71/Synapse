"use client";

import type { CourseCategoryDto, CourseDto } from "@conductor/contracts";
import type { ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  deleteCourseCategory,
  deleteCourseFromCategory,
  fetchCourseCategories,
  fetchCourses,
  fetchCoursesInCategory,
  formatTenantAdminError,
  patchCourseCategory,
  postCourseCategory,
  putCourseCategories,
  type ApiError,
  type LmsApiSession
} from "../../../lib/lms-api-client";
import { getSession } from "../../../lib/lms-session";
import { AdminLoadError, AdminLoading, AdminSignInRequired } from "../admin-page-states";
import styles from "../admin-categories-shell.module.css";

type CategoryNode = CourseCategoryDto & { children: CategoryNode[] };

function buildTree(categories: CourseCategoryDto[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  for (const c of categories) {
    byId.set(c.id, { ...c, children: [] });
  }
  const roots: CategoryNode[] = [];
  for (const c of categories) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  function sort(nodes: CategoryNode[]): void {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    for (const n of nodes) {
      sort(n.children);
    }
  }
  sort(roots);
  return roots;
}

function CategoryTreeList(props: {
  nodes: CategoryNode[];
  depth: number;
  selectedId: string | null;
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
                href={`/admin/categories/${node.id}`}
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

type CategoriesAdminDashboardProps = {
  initialCategoryId: string | null;
};

export function CategoriesAdminDashboard({
  initialCategoryId
}: CategoriesAdminDashboardProps): ReactElement {
  const router = useRouter();
  const [session, setSession] = useState<LmsApiSession | null>(null);
  const [categories, setCategories] = useState<CourseCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<ApiError | null>(null);
  const [coursesInCategory, setCoursesInCategory] = useState<CourseDto[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesInCategoryError, setCoursesInCategoryError] = useState<string | null>(null);
  const [allCourses, setAllCourses] = useState<CourseDto[]>([]);
  const [newName, setNewName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [linkPick, setLinkPick] = useState<Set<string>>(() => new Set());

  const tree = useMemo(() => buildTree(categories), [categories]);

  const selected = useMemo(
    () => (initialCategoryId ? categories.find((c) => c.id === initialCategoryId) ?? null : null),
    [categories, initialCategoryId]
  );

  const loadCategories = useCallback(async (api: LmsApiSession): Promise<void> => {
    setLoading(true);
    setFatalError(null);
    const res = await fetchCourseCategories(api);
    if (!res.ok) {
      setFatalError(res.error);
      setLoading(false);
      return;
    }
    setCategories(res.categories);
    setLoading(false);
  }, []);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      setSession(null);
      setLoading(false);
      return;
    }
    setSession({ token: s.token, tenantId: s.tenantId });
    void loadCategories({ token: s.token, tenantId: s.tenantId });
  }, [loadCategories]);

  useEffect(() => {
    if (!session || categories.length === 0 || initialCategoryId !== null) {
      return;
    }
    const first = [...categories].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
    )[0];
    if (first) {
      router.replace(`/admin/categories/${first.id}`);
    }
  }, [session, categories, initialCategoryId, router]);

  useEffect(() => {
    if (!selected) {
      setRenameValue("");
      setCoursesInCategory([]);
      return;
    }
    setRenameValue(selected.name);
  }, [selected]);

  useEffect(() => {
    if (!session || !initialCategoryId) {
      return;
    }
    let cancelled = false;
    setCoursesLoading(true);
    setCoursesInCategoryError(null);
    void fetchCoursesInCategory(session, initialCategoryId).then((res) => {
      if (cancelled) {
        return;
      }
      if (res.ok) {
        setCoursesInCategory(res.courses);
        setCoursesInCategoryError(null);
      } else {
        setCoursesInCategory([]);
        setCoursesInCategoryError(formatTenantAdminError(res.error));
      }
      setCoursesLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session, initialCategoryId]);

  useEffect(() => {
    if (!session || !addCourseOpen) {
      return;
    }
    let cancelled = false;
    void fetchCourses(session).then((res) => {
      if (!cancelled && res.ok) {
        setAllCourses(res.courses);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session, addCourseOpen]);

  useEffect(() => {
    setExpandedIds(new Set(categories.map((c) => c.id)));
  }, [categories]);

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

  async function onCreateRoot(): Promise<void> {
    if (!session || !newName.trim()) {
      return;
    }
    const res = await postCourseCategory(session, { name: newName.trim() });
    if (!res.ok) {
      setFatalError(res.error);
      return;
    }
    setNewName("");
    await loadCategories(session);
    router.push(`/admin/categories/${res.category.id}`);
  }

  async function onCreateChild(): Promise<void> {
    if (!session || !selected || !newName.trim()) {
      return;
    }
    const res = await postCourseCategory(session, {
      name: newName.trim(),
      parentId: selected.id
    });
    if (!res.ok) {
      setFatalError(res.error);
      return;
    }
    setNewName("");
    await loadCategories(session);
    router.push(`/admin/categories/${res.category.id}`);
  }

  async function onRename(): Promise<void> {
    if (!session || !selected || !renameValue.trim()) {
      return;
    }
    const res = await patchCourseCategory(session, selected.id, { name: renameValue.trim() });
    if (!res.ok) {
      setFatalError(res.error);
      return;
    }
    await loadCategories(session);
  }

  async function onArchive(): Promise<void> {
    if (!session || !selected) {
      return;
    }
    if (!window.confirm(`Archive category “${selected.name}”?`)) {
      return;
    }
    const res = await deleteCourseCategory(session, selected.id);
    if (!res.ok) {
      setFatalError(res.error);
      return;
    }
    await loadCategories(session);
    router.push("/admin/categories");
  }

  async function onRemoveCourse(courseId: string): Promise<void> {
    if (!session || !selected) {
      return;
    }
    const res = await deleteCourseFromCategory(session, courseId, selected.id);
    if (!res.ok) {
      setFatalError(res.error);
      return;
    }
    const refresh = await fetchCoursesInCategory(session, selected.id);
    if (refresh.ok) {
      setCoursesInCategory(refresh.courses);
    }
  }

  async function onConfirmLinkCourses(): Promise<void> {
    if (!session || !selected || linkPick.size === 0) {
      return;
    }
    for (const courseId of linkPick) {
      const course = allCourses.find((c) => c.id === courseId);
      const merged = [...(course?.categoryIds ?? []), selected.id];
      const unique = [...new Set(merged)];
      const r = await putCourseCategories(session, courseId, { categoryIds: unique });
      if (!r.ok) {
        setFatalError(r.error);
        return;
      }
    }
    setLinkPick(new Set());
    setAddCourseOpen(false);
    const refresh = await fetchCoursesInCategory(session, selected.id);
    if (refresh.ok) {
      setCoursesInCategory(refresh.courses);
    }
  }

  function toggleLinkPick(courseId: string): void {
    setLinkPick((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  }

  if (!session && !loading) {
    return <AdminSignInRequired context="manage course categories" />;
  }

  if (loading) {
    return <AdminLoading label="Loading categories…" />;
  }

  if (fatalError) {
    return (
      <AdminLoadError
        error={fatalError}
        onRetry={() => {
          if (session) {
            void loadCategories(session);
          }
        }}
      />
    );
  }

  if (categories.length === 0) {
    return (
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <h1 className={styles.titleRow}>Course categories</h1>
        </div>
        <p>No categories yet. Create a root category to get started.</p>
        <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)", flexWrap: "wrap" }}>
          <label htmlFor="new-root-name" className={styles.srOnly}>
            New category name
          </label>
          <input
            id="new-root-name"
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
            }}
            placeholder="Category name"
            className={styles.searchInput}
          />
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => void onCreateRoot()}>
            Create
          </button>
        </div>
      </div>
    );
  }

  if (initialCategoryId && !selected) {
    return (
      <div className={styles.shell}>
        <p>Category not found.</p>
        <Link href="/admin/categories">Back to categories</Link>
      </div>
    );
  }

  const linkableCourses = allCourses.filter((c) => !coursesInCategory.some((x) => x.id === c.id));

  return (
    <div className={styles.shell}>
      <div className={styles.topBar}>
        <h1 className={styles.titleRow}>
          Course categories{" "}
          <span className={styles.staffTag} style={{ opacity: 0.85 }}>
            Staff
          </span>
        </h1>
      </div>

      <div className={styles.split}>
        <aside className={styles.treePanel} aria-label="Category hierarchy">
          <h2 className={styles.treeTitle}>Hierarchy</h2>
          <CategoryTreeList
            nodes={tree}
            depth={0}
            selectedId={selected?.id ?? null}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
          />
        </aside>

        <div className={styles.detail}>
          {selected ? (
            <>
              <section aria-labelledby="cat-detail-title">
                <h2 id="cat-detail-title" className={styles.heroTitle}>
                  {selected.name}
                </h2>
                <p className={styles.caption}>
                  {selected.directCourseCount} direct course link
                  {selected.directCourseCount === 1 ? "" : "s"}
                </p>

                <div style={{ marginTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <div>
                    <label htmlFor="rename-cat" className={styles.srOnly}>
                      Rename category
                    </label>
                    <input
                      id="rename-cat"
                      type="text"
                      value={renameValue}
                      onChange={(e) => {
                        setRenameValue(e.target.value);
                      }}
                      className={styles.searchInput}
                    />
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={() => void onRename()}
                      style={{ marginLeft: "var(--space-2)" }}
                    >
                      Save name
                    </button>
                  </div>

                  <div>
                    <label htmlFor="new-child-name" className={styles.srOnly}>
                      New subcategory name
                    </label>
                    <input
                      id="new-child-name"
                      type="text"
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                      }}
                      placeholder="New subcategory name"
                      className={styles.searchInput}
                    />
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={() => void onCreateChild()}
                      style={{ marginLeft: "var(--space-2)" }}
                    >
                      Add subcategory
                    </button>
                  </div>

                  <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => void onArchive()}>
                    Archive category
                  </button>
                </div>
              </section>

              <section aria-labelledby="courses-title" style={{ marginTop: "var(--space-6)" }}>
                <h3 id="courses-title" className={styles.sectionTitle}>
                  Courses in this category
                </h3>
                {coursesInCategoryError ? (
                  <p role="alert" className={styles.caption}>
                    {coursesInCategoryError}
                  </p>
                ) : null}
                {coursesLoading ? (
                  <p>Loading courses…</p>
                ) : coursesInCategoryError ? null : coursesInCategory.length === 0 ? (
                  <p className={styles.caption}>No courses in this category yet.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {coursesInCategory.map((course) => (
                      <li
                        key={course.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "var(--space-2)",
                          padding: "var(--space-2) 0",
                          borderBottom: "1px solid var(--color-border)"
                        }}
                      >
                        <span>
                          <strong>{course.title}</strong>{" "}
                          <span style={{ color: "var(--color-text-muted)" }}>({course.code})</span>
                        </span>
                        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => void onRemoveCourse(course.id)}>
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => {
                    setAddCourseOpen(true);
                    setLinkPick(new Set());
                  }}
                  style={{ marginTop: "var(--space-2)" }}
                >
                  Link courses
                </button>
                {addCourseOpen ? (
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="link-courses-title"
                    style={{
                      marginTop: "var(--space-4)",
                      padding: "var(--space-4)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-surface)"
                    }}
                  >
                    <h4 id="link-courses-title">Link courses</h4>
                    <p className={styles.caption}>Select courses to tag with this category.</p>
                    <ul style={{ maxHeight: "12rem", overflow: "auto", listStyle: "none", padding: 0 }}>
                      {linkableCourses.map((course) => (
                        <li key={course.id} style={{ padding: "var(--space-1) 0" }}>
                          <label>
                            <input
                              type="checkbox"
                              checked={linkPick.has(course.id)}
                              onChange={() => {
                                toggleLinkPick(course.id);
                              }}
                            />{" "}
                            {course.title}
                          </label>
                        </li>
                      ))}
                    </ul>
                    {linkableCourses.length === 0 ? (
                      <p className={styles.caption}>All catalog courses are already linked.</p>
                    ) : null}
                    <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={() => void onConfirmLinkCourses()}
                        disabled={linkPick.size === 0}
                      >
                        Link selected
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={() => {
                          setAddCourseOpen(false);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            </>
          ) : (
            <p>Choose a category from the tree.</p>
          )}
        </div>
      </div>
    </div>
  );
}
