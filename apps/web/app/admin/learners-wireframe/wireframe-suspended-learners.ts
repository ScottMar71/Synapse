import { DEMO_LEARNERS } from "./demo-learners";

const STORAGE_KEY = "learners-wireframe-suspended-ids";

function parseIds(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function defaultSuspendedIds(): string[] {
  return DEMO_LEARNERS.filter((r) => r.suspended === true).map((r) => r.id);
}

/** Suspended learner ids for this tab; seeds from demo data on first visit. */
export function getSuspendedLearnerIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    const initial = defaultSuspendedIds();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return parseIds(raw);
}

export function markLearnerSuspendedWireframe(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const prev = getSuspendedLearnerIds();
  if (prev.includes(id)) {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...prev, id]));
}

export function markLearnerUnsuspendedWireframe(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(getSuspendedLearnerIds().filter((x) => x !== id))
  );
}
