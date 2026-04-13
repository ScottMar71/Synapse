/**
 * Browser-local enrollments for admin wireframes (Assignments + Reporting).
 * Joins demo learners with demo courses; complements course folder/status in
 * `wireframe-course-assignments.ts`.
 */

const STORAGE_KEY = "lms-wireframe-learner-enrollments";
const CHANGED_EVENT = "lms-wireframe-learner-enrollments-changed";

export type WireframeLearnerEnrollmentProgress = "assigned" | "in_progress" | "completed";

export type WireframeLearnerEnrollment = {
  id: string;
  courseId: string;
  learnerId: string;
  /** ISO date (date-only wireframe) */
  assignedAt: string;
  progress: WireframeLearnerEnrollmentProgress;
  /** 0–100; wireframe-only, not tied to lesson progress yet */
  completionPercent: number;
};

function dispatchChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function wireframeLearnerEnrollmentsChangedEventName(): string {
  return CHANGED_EVENT;
}

function isProgress(v: unknown): v is WireframeLearnerEnrollmentProgress {
  return v === "assigned" || v === "in_progress" || v === "completed";
}

function parseRow(raw: unknown): WireframeLearnerEnrollment | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" && o.id.length > 0 ? o.id : null;
  const courseId = typeof o.courseId === "string" && o.courseId.length > 0 ? o.courseId : null;
  const learnerId = typeof o.learnerId === "string" && o.learnerId.length > 0 ? o.learnerId : null;
  const assignedAt = typeof o.assignedAt === "string" && o.assignedAt.length > 0 ? o.assignedAt : null;
  const progress = isProgress(o.progress) ? o.progress : null;
  const pctRaw = o.completionPercent;
  const completionPercent =
    typeof pctRaw === "number" && Number.isFinite(pctRaw)
      ? Math.max(0, Math.min(100, Math.round(pctRaw)))
      : 0;
  if (!id || !courseId || !learnerId || !assignedAt || !progress) {
    return null;
  }
  return { id, courseId, learnerId, assignedAt, progress, completionPercent };
}

export function readWireframeLearnerEnrollments(): WireframeLearnerEnrollment[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const out: WireframeLearnerEnrollment[] = [];
    for (const item of parsed) {
      const row = parseRow(item);
      if (row) {
        out.push(row);
      }
    }
    return out;
  } catch {
    return [];
  }
}

function writeWireframeLearnerEnrollmentsInternal(rows: readonly WireframeLearnerEnrollment[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...rows]));
    dispatchChanged();
  } catch {
    /* ignore quota / private mode */
  }
}

export function writeWireframeLearnerEnrollments(rows: readonly WireframeLearnerEnrollment[]): void {
  writeWireframeLearnerEnrollmentsInternal(rows);
}

function newEnrollmentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `enr-${crypto.randomUUID()}`;
  }
  return `enr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function enrollmentKey(courseId: string, learnerId: string): string {
  return `${courseId}::${learnerId}`;
}

/** Returns null when this learner is already assigned to the course. */
export function addWireframeLearnerEnrollment(courseId: string, learnerId: string): WireframeLearnerEnrollment | null {
  const prev = readWireframeLearnerEnrollments();
  const key = enrollmentKey(courseId, learnerId);
  for (const row of prev) {
    if (enrollmentKey(row.courseId, row.learnerId) === key) {
      return null;
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  const next: WireframeLearnerEnrollment = {
    id: newEnrollmentId(),
    courseId,
    learnerId,
    assignedAt: today,
    progress: "assigned",
    completionPercent: 0
  };
  writeWireframeLearnerEnrollmentsInternal([...prev, next]);
  return next;
}

export function removeWireframeLearnerEnrollment(id: string): void {
  const prev = readWireframeLearnerEnrollments();
  writeWireframeLearnerEnrollmentsInternal(prev.filter((r) => r.id !== id));
}

export function updateWireframeLearnerEnrollment(
  id: string,
  patch: Partial<Pick<WireframeLearnerEnrollment, "progress" | "completionPercent">>
): void {
  const prev = readWireframeLearnerEnrollments();
  const next = prev.map((r) => {
    if (r.id !== id) {
      return r;
    }
    let completionPercent = r.completionPercent;
    if (typeof patch.completionPercent === "number" && Number.isFinite(patch.completionPercent)) {
      completionPercent = Math.max(0, Math.min(100, Math.round(patch.completionPercent)));
    }
    let progress = patch.progress ?? r.progress;
    if (progress === "completed") {
      completionPercent = Math.max(completionPercent, 100);
    }
    return { ...r, progress, completionPercent };
  });
  writeWireframeLearnerEnrollmentsInternal(next);
}

/** Idempotent demo rows so Reporting has something to aggregate before manual entry. */
export function seedWireframeDemoLearnerEnrollments(): void {
  const prev = readWireframeLearnerEnrollments();
  const byId = new Map(prev.map((r) => [r.id, r]));
  const seeds: WireframeLearnerEnrollment[] = [
    {
      id: "seed-enr-hipaa-alex",
      courseId: "crs-hipaa-101",
      learnerId: "1",
      assignedAt: "2026-03-12",
      progress: "completed",
      completionPercent: 100
    },
    {
      id: "seed-enr-1on1-sam",
      courseId: "crs-1on1-core",
      learnerId: "3",
      assignedAt: "2026-04-01",
      progress: "in_progress",
      completionPercent: 42
    },
    {
      id: "seed-enr-hackathon-taylor",
      courseId: "crs-hackathon-kit",
      learnerId: "4",
      assignedAt: "2026-04-08",
      progress: "assigned",
      completionPercent: 0
    }
  ];
  for (const row of seeds) {
    byId.set(row.id, row);
  }
  writeWireframeLearnerEnrollmentsInternal([...byId.values()]);
}
