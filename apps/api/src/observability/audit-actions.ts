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
  LEARNERS_DIRECTORY_READ: "learners.directory_read",
  LEARNERS_PROVISION: "learners.provision",
  CATEGORIES_DIRECTORY_READ: "categories.directory_read",
  CATEGORY_WRITE: "category.write",
  COURSE_CATEGORY_LINKS_WRITE: "course.category_links_write",
  COURSE_UPDATE: "course.update",
  REPORTS_PROGRESS_READ: "reports.progress_read",
  LESSON_PLAYBACK_READ: "lesson.playback_read",
  LESSON_PATCH: "lesson.patch",
  LESSON_READING_READ: "lesson.reading_read",
  LESSON_READING_PATCH: "lesson.reading_patch",
  LESSON_GLOSSARY_LIST_READ: "lesson.glossary_list_read",
  LESSON_GLOSSARY_CREATE: "lesson.glossary_create"
} as const;
