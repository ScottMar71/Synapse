const STORAGE_KEY = "learners-wireframe-deleted-ids";

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

/** Deleted learner ids for this tab; persisted in session storage. */
export function getDeletedLearnerIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  }
  return parseIds(raw);
}

export function markLearnerDeletedWireframe(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const prev = getDeletedLearnerIds();
  if (prev.includes(id)) {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...prev, id]));
}
