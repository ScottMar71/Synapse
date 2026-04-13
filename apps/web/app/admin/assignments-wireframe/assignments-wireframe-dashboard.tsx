"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import catStyles from "../categories-wireframe/categories-wireframe.module.css";
import { wireframeCustomCategoriesChangedEventName } from "../categories-wireframe/wireframe-custom-categories-storage";
import { getWireframeMergedCategoryTree } from "../categories-wireframe/wireframe-merge-category-tree";
import { DEMO_LEARNERS } from "../learners-wireframe/demo-learners";
import { getDeletedLearnerIds } from "../learners-wireframe/wireframe-deleted-learners";
import { getSuspendedLearnerIds } from "../learners-wireframe/wireframe-suspended-learners";
import { resolveWireframeCourseRows } from "../wireframe-resolve-demo-courses";
import {
  readWireframeCourseFolderAssignments,
  readWireframeCourseStatusAssignments
} from "../wireframe-course-assignments";
import {
  addWireframeLearnerEnrollment,
  readWireframeLearnerEnrollments,
  removeWireframeLearnerEnrollment,
  seedWireframeDemoLearnerEnrollments,
  updateWireframeLearnerEnrollment,
  type WireframeLearnerEnrollment,
  type WireframeLearnerEnrollmentProgress,
  wireframeLearnerEnrollmentsChangedEventName
} from "../wireframe-learner-enrollments";

type AssignmentsWireframeDashboardProps = {
  initialCourseFilter: string;
  initialLearnerFilter: string;
};

function lifecycleBadgeClass(visibility: "Published" | "Draft" | "Retired"): string {
  if (visibility === "Published") {
    return `${catStyles.courseBadge} ${catStyles.coursePublished}`;
  }
  if (visibility === "Draft") {
    return `${catStyles.courseBadge} ${catStyles.courseDraft}`;
  }
  return `${catStyles.courseBadge} ${catStyles.courseRetired}`;
}

export function AssignmentsWireframeDashboard({
  initialCourseFilter,
  initialLearnerFilter
}: AssignmentsWireframeDashboardProps): ReactElement {
  const [mergedTreeTick, setMergedTreeTick] = useState(0);
  const mergedCategoryRoots = useMemo(() => getWireframeMergedCategoryTree(), [mergedTreeTick]);
  const [folderAssignments, setFolderAssignments] = useState<Record<string, string>>({});
  const [statusAssignments, setStatusAssignments] = useState<
    Record<string, "Published" | "Draft" | "Retired">
  >({});
  const [enrollments, setEnrollments] = useState<WireframeLearnerEnrollment[]>([]);
  const [deletedLearnerIds, setDeletedLearnerIds] = useState<ReadonlySet<string>>(() => new Set());
  const [suspendedLearnerIds, setSuspendedLearnerIds] = useState<ReadonlySet<string>>(() => new Set());
  const [filterCourseId, setFilterCourseId] = useState(initialCourseFilter);
  const [filterLearnerId, setFilterLearnerId] = useState(initialLearnerFilter);
  const [addCourseId, setAddCourseId] = useState("");
  const [addLearnerId, setAddLearnerId] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const courseRows = useMemo(
    () => resolveWireframeCourseRows(folderAssignments, statusAssignments, mergedCategoryRoots),
    [folderAssignments, mergedCategoryRoots, statusAssignments]
  );
  const courseById = useMemo(() => new Map(courseRows.map((c) => [c.id, c])), [courseRows]);

  useEffect(() => {
    setFilterCourseId(initialCourseFilter);
    setFilterLearnerId(initialLearnerFilter);
  }, [initialCourseFilter, initialLearnerFilter]);

  useEffect(() => {
    setFolderAssignments(readWireframeCourseFolderAssignments());
    setStatusAssignments(readWireframeCourseStatusAssignments());
    setEnrollments(readWireframeLearnerEnrollments());
    setDeletedLearnerIds(new Set(getDeletedLearnerIds()));
    setSuspendedLearnerIds(new Set(getSuspendedLearnerIds()));
  }, []);

  useEffect(() => {
    const ev = wireframeCustomCategoriesChangedEventName();
    function bump(): void {
      setMergedTreeTick((n) => n + 1);
    }
    window.addEventListener(ev, bump);
    return () => {
      window.removeEventListener(ev, bump);
    };
  }, []);

  useEffect(() => {
    const ev = wireframeLearnerEnrollmentsChangedEventName();
    function refresh(): void {
      setEnrollments(readWireframeLearnerEnrollments());
    }
    window.addEventListener(ev, refresh);
    return () => {
      window.removeEventListener(ev, refresh);
    };
  }, []);

  const learnerOptions = useMemo(
    () => DEMO_LEARNERS.filter((l) => !deletedLearnerIds.has(l.id)),
    [deletedLearnerIds]
  );

  const visibleEnrollments = useMemo(() => {
    return enrollments.filter((row) => {
      if (deletedLearnerIds.has(row.learnerId)) {
        return false;
      }
      if (filterCourseId && row.courseId !== filterCourseId) {
        return false;
      }
      if (filterLearnerId && row.learnerId !== filterLearnerId) {
        return false;
      }
      return true;
    });
  }, [enrollments, deletedLearnerIds, filterCourseId, filterLearnerId]);

  function onSeedDemo(): void {
    seedWireframeDemoLearnerEnrollments();
    setEnrollments(readWireframeLearnerEnrollments());
    setStatusMessage("Loaded idempotent sample enrollments (saved in this browser). Open Reporting for aggregates.");
  }

  function onAdd(): void {
    if (!addCourseId || !addLearnerId) {
      setStatusMessage("Choose both a course and a learner.");
      return;
    }
    const added = addWireframeLearnerEnrollment(addCourseId, addLearnerId);
    if (!added) {
      setStatusMessage("That learner is already assigned to this course.");
      return;
    }
    setEnrollments(readWireframeLearnerEnrollments());
    setStatusMessage("Assignment created (wireframe — localStorage only).");
  }

  return (
    <main className={catStyles.shell}>
      <div className={catStyles.topBar}>
        <h1 className={catStyles.titleRow}>
          Assignments
          <span className={catStyles.wireTag}>Wireframe</span>
        </h1>
        <div className={catStyles.actionsRow}>
          <Link href="/admin/courses-wireframe" className={`${catStyles.btn} ${catStyles.btnSecondary}`}>
            All courses
          </Link>
          <Link href="/admin/learners-wireframe" className={`${catStyles.btn} ${catStyles.btnSecondary}`}>
            Learners
          </Link>
          <Link href="/admin/categories-wireframe" className={`${catStyles.btn} ${catStyles.btnSecondary}`}>
            Categories
          </Link>
          <Link href="/admin/reporting-wireframe" className={`${catStyles.btn} ${catStyles.btnPrimary}`}>
            Reporting
          </Link>
        </div>
      </div>

      {statusMessage ? (
        <p className={catStyles.caption} role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}

      <p className={catStyles.caption}>
        Links learners to courses for the admin journey. Rows are stored in{" "}
        <code className={catStyles.pill}>localStorage</code> and read by{" "}
        <Link href="/admin/reporting-wireframe">Reporting</Link>. Course <strong>status</strong> and{" "}
        <strong>folder</strong> match the{" "}
        <Link href="/admin/courses-wireframe">Courses</Link> wireframe and category merge rules.
      </p>

      <div className={catStyles.toolbar} style={{ flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div className={catStyles.bulkAssignField}>
          <label htmlFor="assignments-filter-course" className={catStyles.bulkAssignLabel}>
            Filter by course
          </label>
          <select
            id="assignments-filter-course"
            className={catStyles.bulkAssignSelect}
            value={filterCourseId}
            onChange={(e) => {
              setFilterCourseId(e.target.value);
            }}
          >
            <option value="">All courses</option>
            {courseRows.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className={catStyles.bulkAssignField}>
          <label htmlFor="assignments-filter-learner" className={catStyles.bulkAssignLabel}>
            Filter by learner
          </label>
          <select
            id="assignments-filter-learner"
            className={catStyles.bulkAssignSelect}
            value={filterLearnerId}
            onChange={(e) => {
              setFilterLearnerId(e.target.value);
            }}
          >
            <option value="">All learners</option>
            {learnerOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className={`${catStyles.btn} ${catStyles.btnSecondary}`} onClick={onSeedDemo}>
          Load sample assignments
        </button>
      </div>

      <div className={catStyles.bulkAssignRow}>
        <div className={catStyles.bulkAssignField}>
          <label htmlFor="assignments-add-course" className={catStyles.bulkAssignLabel}>
            Course
          </label>
          <select
            id="assignments-add-course"
            className={catStyles.bulkAssignSelect}
            value={addCourseId}
            onChange={(e) => {
              setAddCourseId(e.target.value);
            }}
          >
            <option value="">Choose course…</option>
            {courseRows.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className={catStyles.bulkAssignField}>
          <label htmlFor="assignments-add-learner" className={catStyles.bulkAssignLabel}>
            Learner
          </label>
          <select
            id="assignments-add-learner"
            className={catStyles.bulkAssignSelect}
            value={addLearnerId}
            onChange={(e) => {
              setAddLearnerId(e.target.value);
            }}
          >
            <option value="">Choose learner…</option>
            {learnerOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {suspendedLearnerIds.has(l.id) ? " (suspended)" : ""}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className={`${catStyles.btn} ${catStyles.btnPrimary}`} onClick={onAdd}>
          Assign
        </button>
      </div>

      <div className={catStyles.tableWrap}>
        <table className={catStyles.table}>
          <thead>
            <tr>
              <th scope="col">Learner</th>
              <th scope="col">Course</th>
              <th scope="col">Category</th>
              <th scope="col">Publish status</th>
              <th scope="col">Progress</th>
              <th scope="col">Completion %</th>
              <th scope="col">Assigned</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleEnrollments.length === 0 ? (
              <tr>
                <td colSpan={8} className={catStyles.tableEmpty}>
                  No rows match these filters. Use <strong>Load sample assignments</strong> or pick a course and
                  learner, then <strong>Assign</strong>. Deep links from{" "}
                  <Link href="/admin/courses-wireframe">Courses</Link> or{" "}
                  <Link href="/admin/learners-wireframe">Learners</Link> pre-fill filters.
                </td>
              </tr>
            ) : null}
            {visibleEnrollments.map((row) => {
              const course = courseById.get(row.courseId);
              const learner = DEMO_LEARNERS.find((l) => l.id === row.learnerId);
              const editorHref = course
                ? `/admin/courses/${encodeURIComponent(course.id)}?folder=${encodeURIComponent(course.folderId)}`
                : `/admin/courses/${encodeURIComponent(row.courseId)}`;
              const suspended = suspendedLearnerIds.has(row.learnerId);
              return (
                <tr key={row.id}>
                  <td>
                    {learner ? (
                      <Link href={`/admin/learners-wireframe/${encodeURIComponent(learner.id)}`} className={catStyles.courseTitleLink}>
                        {learner.name}
                      </Link>
                    ) : (
                      <span className={catStyles.pill}>Unknown learner</span>
                    )}
                    {suspended ? (
                      <div className={catStyles.caption} style={{ marginTop: "var(--space-1)" }}>
                        Suspended (wireframe)
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <Link href={editorHref} className={catStyles.courseTitleLink}>
                      {course?.title ?? row.courseId}
                    </Link>
                    <div className={catStyles.pill} style={{ marginTop: "var(--space-1)" }}>
                      {row.courseId}
                    </div>
                  </td>
                  <td>
                    {course ? (
                      <Link
                        href={`/admin/categories-wireframe/${encodeURIComponent(course.folderId)}`}
                        className={catStyles.courseTitleLink}
                        style={{ fontWeight: 500 }}
                      >
                        {course.folderPath}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {course ? (
                      <span className={lifecycleBadgeClass(course.visibility)}>{course.visibility}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <label htmlFor={`progress-${row.id}`} className={catStyles.srOnly}>
                      Progress for {learner?.name ?? row.learnerId}
                    </label>
                    <select
                      id={`progress-${row.id}`}
                      className={catStyles.bulkAssignSelect}
                      value={row.progress}
                      onChange={(e) => {
                        const progress = e.target.value as WireframeLearnerEnrollmentProgress;
                        updateWireframeLearnerEnrollment(row.id, { progress });
                        setEnrollments(readWireframeLearnerEnrollments());
                      }}
                    >
                      <option value="assigned">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className={catStyles.searchInput}
                      style={{ maxWidth: "5rem" }}
                      value={row.completionPercent}
                      aria-label={`Completion percent for ${course?.title ?? row.courseId}`}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        updateWireframeLearnerEnrollment(row.id, {
                          completionPercent: Number.isFinite(n) ? n : 0
                        });
                        setEnrollments(readWireframeLearnerEnrollments());
                      }}
                    />
                  </td>
                  <td>{row.assignedAt}</td>
                  <td>
                    <button
                      type="button"
                      className={`${catStyles.btn} ${catStyles.btnSecondary}`}
                      onClick={() => {
                        removeWireframeLearnerEnrollment(row.id);
                        setEnrollments(readWireframeLearnerEnrollments());
                        setStatusMessage("Removed assignment.");
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={catStyles.caption}>
        <strong>Progress</strong> and <strong>Completion %</strong> are admin-only wireframe fields; they roll up on{" "}
        <Link href="/admin/reporting-wireframe">Reporting</Link>. Publishing a course on the{" "}
        <Link href="/admin/courses-wireframe">Courses</Link> screen changes the publish badge here after refresh; folder
        moves follow the same merged category tree as the editor.
      </p>
    </main>
  );
}
