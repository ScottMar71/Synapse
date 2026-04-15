/**
 * Canonical audit action names for LMS API (stdout JSON lines with `type: "audit"`).
 */
export const AUDIT_ACTIONS = {
  ENROLLMENT_CREATE: "enrollment.create",
  ENROLLMENT_LIST_READ: "enrollment.list_read",
  PROGRESS_WRITE: "progress.write",
  PROGRESS_LIST_READ: "progress.list_read",
  ASSESSMENT_DRAFT_SAVE: "assessment.draft_save",
  ASSESSMENT_SUBMIT: "assessment.submit",
  LEARNERS_DIRECTORY_READ: "learners.directory_read"
} as const;
