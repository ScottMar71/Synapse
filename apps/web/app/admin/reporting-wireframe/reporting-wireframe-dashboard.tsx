"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import catStyles from "../categories-wireframe/categories-wireframe.module.css";
import { wireframeCustomCategoriesChangedEventName } from "../categories-wireframe/wireframe-custom-categories-storage";
import { getWireframeMergedCategoryTree } from "../categories-wireframe/wireframe-merge-category-tree";
import { DEMO_LEARNERS } from "../learners-wireframe/demo-learners";
import { getDeletedLearnerIds } from "../learners-wireframe/wireframe-deleted-learners";
import { resolveWireframeCourseRows } from "../wireframe-resolve-demo-courses";
import {
  readWireframeCourseFolderAssignments,
  readWireframeCourseStatusAssignments
} from "../wireframe-course-assignments";
import {
  readWireframeLearnerEnrollments,
  type WireframeLearnerEnrollment,
  wireframeLearnerEnrollmentsChangedEventName
} from "../wireframe-learner-enrollments";

type CourseAgg = {
  courseId: string;
  title: string;
  folderPath: string;
  visibility: string;
  enrollmentCount: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  avgPercent: number;
  unpublishedAssignments: number;
};

type LearnerAgg = {
  learnerId: string;
  name: string;
  enrollmentCount: number;
  completed: number;
  avgPercent: number;
};

function statCard(label: string, value: string | number): ReactElement {
  return (
    <div
      className={catStyles.pill}
      style={{
        padding: "var(--space-3)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
        alignItems: "flex-start",
        fontWeight: 500
      }}
    >
      <span className={catStyles.caption} style={{ fontWeight: 400 }}>
        {label}
      </span>
      <span style={{ fontSize: "1.35rem" }}>{value}</span>
    </div>
  );
}

export function ReportingWireframeDashboard(): ReactElement {
  const [mergedTreeTick, setMergedTreeTick] = useState(0);
  const mergedCategoryRoots = useMemo(() => getWireframeMergedCategoryTree(), [mergedTreeTick]);
  const [folderAssignments, setFolderAssignments] = useState<Record<string, string>>({});
  const [statusAssignments, setStatusAssignments] = useState<
    Record<string, "Published" | "Draft" | "Retired">
  >({});
  const [enrollments, setEnrollments] = useState<WireframeLearnerEnrollment[]>([]);
  const [deletedLearnerIds, setDeletedLearnerIds] = useState<ReadonlySet<string>>(() => new Set());

  const courseRows = useMemo(
    () => resolveWireframeCourseRows(folderAssignments, statusAssignments, mergedCategoryRoots),
    [folderAssignments, mergedCategoryRoots, statusAssignments]
  );
  const courseById = useMemo(() => new Map(courseRows.map((c) => [c.id, c])), [courseRows]);

  useEffect(() => {
    setFolderAssignments(readWireframeCourseFolderAssignments());
    setStatusAssignments(readWireframeCourseStatusAssignments());
    setEnrollments(readWireframeLearnerEnrollments());
    setDeletedLearnerIds(new Set(getDeletedLearnerIds()));
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

  const activeEnrollments = useMemo(
    () => enrollments.filter((e) => !deletedLearnerIds.has(e.learnerId)),
    [enrollments, deletedLearnerIds]
  );

  const { courseAggs, learnerAggs, kpis } = useMemo(() => {
    const courseMap = new Map<string, CourseAgg>();
    const learnerMap = new Map<string, LearnerAgg>();

    let sumPct = 0;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let unpublishedAssignments = 0;

    for (const row of activeEnrollments) {
      sumPct += row.completionPercent;
      if (row.progress === "completed") {
        completed += 1;
      } else if (row.progress === "in_progress") {
        inProgress += 1;
      } else {
        notStarted += 1;
      }

      const course = courseById.get(row.courseId);
      if (course && course.visibility !== "Published") {
        unpublishedAssignments += 1;
      }

      const cTitle = course?.title ?? row.courseId;
      const cPath = course?.folderPath ?? "—";
      const cVis = course?.visibility ?? "—";
      const prevC = courseMap.get(row.courseId);
      if (!prevC) {
        courseMap.set(row.courseId, {
          courseId: row.courseId,
          title: cTitle,
          folderPath: cPath,
          visibility: cVis,
          enrollmentCount: 1,
          completed: row.progress === "completed" ? 1 : 0,
          inProgress: row.progress === "in_progress" ? 1 : 0,
          notStarted: row.progress === "assigned" ? 1 : 0,
          avgPercent: row.completionPercent,
          unpublishedAssignments: course && course.visibility !== "Published" ? 1 : 0
        });
      } else {
        prevC.enrollmentCount += 1;
        if (row.progress === "completed") {
          prevC.completed += 1;
        } else if (row.progress === "in_progress") {
          prevC.inProgress += 1;
        } else {
          prevC.notStarted += 1;
        }
        prevC.avgPercent += row.completionPercent;
        if (course && course.visibility !== "Published") {
          prevC.unpublishedAssignments += 1;
        }
      }

      const learner = DEMO_LEARNERS.find((l) => l.id === row.learnerId);
      const lName = learner?.name ?? row.learnerId;
      const prevL = learnerMap.get(row.learnerId);
      if (!prevL) {
        learnerMap.set(row.learnerId, {
          learnerId: row.learnerId,
          name: lName,
          enrollmentCount: 1,
          completed: row.progress === "completed" ? 1 : 0,
          avgPercent: row.completionPercent
        });
      } else {
        prevL.enrollmentCount += 1;
        if (row.progress === "completed") {
          prevL.completed += 1;
        }
        prevL.avgPercent += row.completionPercent;
      }
    }

    const courseAggsOut = [...courseMap.values()].map((c) => ({
      ...c,
      avgPercent: c.enrollmentCount > 0 ? Math.round(c.avgPercent / c.enrollmentCount) : 0
    }));
    courseAggsOut.sort((a, b) => b.enrollmentCount - a.enrollmentCount);

    const learnerAggsOut = [...learnerMap.values()].map((l) => ({
      ...l,
      avgPercent: l.enrollmentCount > 0 ? Math.round(l.avgPercent / l.enrollmentCount) : 0
    }));
    learnerAggsOut.sort((a, b) => b.enrollmentCount - a.enrollmentCount);

    const n = activeEnrollments.length;
    const kpisOut = {
      total: n,
      completed,
      inProgress,
      notStarted,
      avgPercent: n > 0 ? Math.round(sumPct / n) : 0,
      unpublishedAssignments
    };

    return { courseAggs: courseAggsOut, learnerAggs: learnerAggsOut, kpis: kpisOut };
  }, [activeEnrollments, courseById]);

  return (
    <main className={catStyles.shell}>
      <div className={catStyles.topBar}>
        <h1 className={catStyles.titleRow}>
          Reporting
          <span className={catStyles.wireTag}>Wireframe</span>
        </h1>
        <div className={catStyles.actionsRow}>
          <Link href="/admin/assignments-wireframe" className={`${catStyles.btn} ${catStyles.btnPrimary}`}>
            Assignments
          </Link>
          <Link href="/admin/courses-wireframe" className={`${catStyles.btn} ${catStyles.btnSecondary}`}>
            Courses
          </Link>
          <Link href="/admin/learners-wireframe" className={`${catStyles.btn} ${catStyles.btnSecondary}`}>
            Learners
          </Link>
        </div>
      </div>

      <p className={catStyles.caption}>
        Read-only rollups over <Link href="/admin/assignments-wireframe">Assignments</Link> plus the same resolved
        course catalog as <Link href="/admin/courses-wireframe">Courses</Link>. Learners removed on the Learners
        wireframe are excluded here.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)"
        }}
      >
        {statCard("Active assignments", kpis.total)}
        {statCard("Completed", kpis.completed)}
        {statCard("In progress", kpis.inProgress)}
        {statCard("Not started", kpis.notStarted)}
        {statCard("Avg completion %", kpis.avgPercent)}
        {statCard("Rows on unpublished courses", kpis.unpublishedAssignments)}
      </div>

      <h2 className={catStyles.treeTitle} style={{ marginBottom: "var(--space-2)" }}>
        By course
      </h2>
      <div className={catStyles.tableWrap} style={{ marginBottom: "var(--space-5)" }}>
        <table className={catStyles.table}>
          <thead>
            <tr>
              <th scope="col">Course</th>
              <th scope="col">Category</th>
              <th scope="col">Lifecycle</th>
              <th scope="col">Assignments</th>
              <th scope="col">Done</th>
              <th scope="col">In progress</th>
              <th scope="col">Not started</th>
              <th scope="col">Avg %</th>
              <th scope="col">Drill down</th>
            </tr>
          </thead>
          <tbody>
            {courseAggs.length === 0 ? (
              <tr>
                <td colSpan={9} className={catStyles.tableEmpty}>
                  No assignment rows yet. Open <Link href="/admin/assignments-wireframe">Assignments</Link> and load
                  samples or create rows.
                </td>
              </tr>
            ) : null}
            {courseAggs.map((c) => (
              <tr key={c.courseId}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.title}</div>
                  <div className={catStyles.pill} style={{ marginTop: "var(--space-1)" }}>
                    {c.courseId}
                  </div>
                </td>
                <td>{c.folderPath}</td>
                <td>{c.visibility}</td>
                <td>{c.enrollmentCount}</td>
                <td>{c.completed}</td>
                <td>{c.inProgress}</td>
                <td>{c.notStarted}</td>
                <td>{c.avgPercent}</td>
                <td>
                  <Link
                    href={`/admin/assignments-wireframe?courseId=${encodeURIComponent(c.courseId)}`}
                    className={`${catStyles.btn} ${catStyles.btnSecondary}`}
                  >
                    Open assignments
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className={catStyles.treeTitle} style={{ marginBottom: "var(--space-2)" }}>
        By learner
      </h2>
      <div className={catStyles.tableWrap}>
        <table className={catStyles.table}>
          <thead>
            <tr>
              <th scope="col">Learner</th>
              <th scope="col">Assignments</th>
              <th scope="col">Completed</th>
              <th scope="col">Avg %</th>
              <th scope="col">Drill down</th>
            </tr>
          </thead>
          <tbody>
            {learnerAggs.length === 0 ? (
              <tr>
                <td colSpan={5} className={catStyles.tableEmpty}>
                  No assignment rows yet.
                </td>
              </tr>
            ) : null}
            {learnerAggs.map((l) => (
              <tr key={l.learnerId}>
                <td>{l.name}</td>
                <td>{l.enrollmentCount}</td>
                <td>{l.completed}</td>
                <td>{l.avgPercent}</td>
                <td>
                  <Link
                    href={`/admin/assignments-wireframe?learnerId=${encodeURIComponent(l.learnerId)}`}
                    className={`${catStyles.btn} ${catStyles.btnSecondary}`}
                  >
                    Open assignments
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={catStyles.caption}>
        Wireframe only: numbers mirror the assignment table and demo course metadata. There is no export yet; a later
        slice could add CSV using the same aggregates.
      </p>
    </main>
  );
}
