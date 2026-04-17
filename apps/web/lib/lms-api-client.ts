import type {
  CourseCategoriesPutBody,
  CourseCategoryCreateBody,
  CourseCategoryDto,
  CourseCategoryPatchBody,
  CourseDto,
  CoursePatchBody,
  EnrollmentDto,
  LearnerProvisionBody,
  LessonGlossaryCreateBody,
  LessonGlossaryEntryDto,
  LessonGlossaryPatchBody,
  LessonExternalLinkCreateBody,
  LessonExternalLinkDto,
  LessonExternalLinkPatchBody,
  LessonFileAttachmentDto,
  LessonFileDownloadDto,
  LessonFilePatchBody,
  LessonFileReorderBody,
  LessonFileUploadInitBody,
  LessonFileUploadInstruction,
  LessonMixedBlockLearner,
  LessonMixedBlockPutItem,
  LessonPatchBody,
  LessonPlaybackDto,
  LessonReadingDto,
  LessonReadingPatchBody,
  LessonStaffDto,
  LessonWatchCompletionResult,
  LessonWatchStateDto,
  LessonWatchStatePatchBody,
  ProgressDto,
  ProgressPutBody,
  ProgressReportRowDto,
  ProgressReportRowsQuery,
  ProgressReportSharedQuery,
  ProgressReportSummaryDto,
  StaffCourseLessonOutlineDto,
  SubmissionDto
} from "@conductor/contracts";

import type { LmsSession } from "./lms-session";

export type LmsApiSession = Pick<LmsSession, "token" | "tenantId">;

export type ApiError = { status: number; message: string };

export function formatTenantAdminError(error: ApiError): string {
  if (error.status === 401) {
    return "Your session is not valid or has expired. Sign in again.";
  }
  if (error.status === 403) {
    return "You do not have access to this tenant admin area. Sign in as an instructor or admin.";
  }
  if (error.status === 404) {
    return "The requested item was not found for this tenant.";
  }
  if (error.status === 409) {
    return "This content was changed in another tab or session. Reload the page and try again.";
  }
  return error.message;
}

type DataEnvelope<T> = { data: T };

async function parseResponse<T>(response: Response): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? (JSON.parse(text) as unknown) : {};
  } catch {
    return { ok: false, error: { status: response.status, message: "Invalid response" } };
  }
  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : response.statusText;
    return { ok: false, error: { status: response.status, message } };
  }
  return { ok: true, data: body as T };
}

function authHeaders(session: LmsApiSession, jsonBody?: boolean): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.token}`,
    "x-tenant-id": session.tenantId
  };
  if (jsonBody) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export async function fetchCourses(session: LmsApiSession): Promise<{ ok: true; courses: CourseDto[] } | { ok: false; error: ApiError }> {
  const response = await fetch(`/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses`, {
    headers: authHeaders(session)
  });
  const parsed = await parseResponse<DataEnvelope<{ courses: CourseDto[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, courses: parsed.data.data.courses };
}

export async function fetchCourse(
  session: LmsApiSession,
  courseId: string
): Promise<{ ok: true; course: CourseDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ course: CourseDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, course: parsed.data.data.course };
}

export async function patchCourse(
  session: LmsApiSession,
  courseId: string,
  body: CoursePatchBody
): Promise<{ ok: true; course: CourseDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}`,
    { method: "PATCH", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<DataEnvelope<{ course: CourseDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, course: parsed.data.data.course };
}

export async function fetchCourseLessonOutline(
  session: LmsApiSession,
  courseId: string
): Promise<{ ok: true; outline: StaffCourseLessonOutlineDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lesson-outline`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ outline: StaffCourseLessonOutlineDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, outline: parsed.data.data.outline };
}

/** @deprecated Use `fetchCourseLessonOutline` — same endpoint serves staff and enrolled learners. */
export async function fetchStaffCourseLessonOutline(
  session: LmsApiSession,
  courseId: string
): Promise<{ ok: true; outline: StaffCourseLessonOutlineDto } | { ok: false; error: ApiError }> {
  return fetchCourseLessonOutline(session, courseId);
}

export async function fetchLessonReading(
  session: LmsApiSession,
  courseId: string,
  lessonId: string
): Promise<{ ok: true; reading: LessonReadingDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/reading`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ reading: LessonReadingDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, reading: parsed.data.data.reading };
}

export async function fetchLessonPlayback(
  session: LmsApiSession,
  courseId: string,
  lessonId: string
): Promise<{ ok: true; playback: LessonPlaybackDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/playback`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ playback: LessonPlaybackDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, playback: parsed.data.data.playback };
}

export async function fetchLessonWatchState(
  session: LmsApiSession,
  courseId: string,
  lessonId: string
): Promise<{ ok: true; watchState: LessonWatchStateDto | null } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/watch-state`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ watchState: LessonWatchStateDto | null }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, watchState: parsed.data.data.watchState };
}

export async function patchLessonWatchState(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  body: LessonWatchStatePatchBody
): Promise<
  | { ok: true; watchState: LessonWatchStateDto; completion: LessonWatchCompletionResult }
  | { ok: false; error: ApiError }
> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/watch-state`,
    { method: "PATCH", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<
    DataEnvelope<{ watchState: LessonWatchStateDto; completion: LessonWatchCompletionResult }>
  >(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, watchState: parsed.data.data.watchState, completion: parsed.data.data.completion };
}

export async function patchLessonReadingForStaff(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  body: LessonReadingPatchBody
): Promise<{ ok: true; reading: LessonReadingDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/reading`,
    { method: "PATCH", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<DataEnvelope<{ reading: LessonReadingDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, reading: parsed.data.data.reading };
}

export async function fetchLessonForStaff(
  session: LmsApiSession,
  courseId: string,
  lessonId: string
): Promise<{ ok: true; lesson: LessonStaffDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ lesson: LessonStaffDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, lesson: parsed.data.data.lesson };
}

export async function patchLessonForStaff(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  body: LessonPatchBody
): Promise<{ ok: true; lesson: LessonStaffDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
    { method: "PATCH", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<DataEnvelope<{ lesson: LessonStaffDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, lesson: parsed.data.data.lesson };
}

export async function fetchLessonMixedBlocks(
  session: LmsApiSession,
  courseId: string,
  lessonId: string
): Promise<{ ok: true; blocks: LessonMixedBlockLearner[] } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/blocks`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ blocks: LessonMixedBlockLearner[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, blocks: parsed.data.data.blocks };
}

export async function putLessonMixedBlocks(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  blocks: LessonMixedBlockPutItem[]
): Promise<{ ok: true; blocks: LessonMixedBlockLearner[] } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/blocks`,
    { method: "PUT", headers: authHeaders(session, true), body: JSON.stringify({ blocks }) }
  );
  const parsed = await parseResponse<DataEnvelope<{ blocks: LessonMixedBlockLearner[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, blocks: parsed.data.data.blocks };
}

export async function fetchLessonGlossaryEntries(
  session: LmsApiSession,
  courseId: string,
  lessonId: string
): Promise<{ ok: true; entries: LessonGlossaryEntryDto[] } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/glossary`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ entries: LessonGlossaryEntryDto[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, entries: parsed.data.data.entries };
}

export async function createLessonGlossaryEntry(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  body: LessonGlossaryCreateBody
): Promise<{ ok: true; entry: LessonGlossaryEntryDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/glossary`,
    { method: "POST", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<DataEnvelope<{ entry: LessonGlossaryEntryDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, entry: parsed.data.data.entry };
}

export async function patchLessonGlossaryEntry(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  entryId: string,
  body: LessonGlossaryPatchBody
): Promise<{ ok: true; entry: LessonGlossaryEntryDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/glossary/${encodeURIComponent(entryId)}`,
    { method: "PATCH", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<DataEnvelope<{ entry: LessonGlossaryEntryDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, entry: parsed.data.data.entry };
}

export async function archiveLessonGlossaryEntry(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  entryId: string
): Promise<{ ok: true } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/glossary/${encodeURIComponent(entryId)}`,
    { method: "DELETE", headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ archived: true }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true };
}

export async function fetchLessonExternalLinks(
  session: LmsApiSession,
  courseId: string,
  lessonId: string
): Promise<{ ok: true; links: LessonExternalLinkDto[] } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/links`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ links: LessonExternalLinkDto[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, links: parsed.data.data.links };
}

export async function createLessonExternalLink(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  body: LessonExternalLinkCreateBody
): Promise<{ ok: true; link: LessonExternalLinkDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/links`,
    { method: "POST", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<DataEnvelope<{ link: LessonExternalLinkDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, link: parsed.data.data.link };
}

export async function patchLessonExternalLink(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  linkId: string,
  body: LessonExternalLinkPatchBody
): Promise<{ ok: true; link: LessonExternalLinkDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/links/${encodeURIComponent(linkId)}`,
    { method: "PATCH", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<DataEnvelope<{ link: LessonExternalLinkDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, link: parsed.data.data.link };
}

export async function archiveLessonExternalLink(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  linkId: string
): Promise<{ ok: true } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/links/${encodeURIComponent(linkId)}`,
    { method: "DELETE", headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ archived: true }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true };
}

export async function fetchEnrollments(
  session: LmsApiSession,
  userId: string
): Promise<{ ok: true; enrollments: EnrollmentDto[] } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/users/${encodeURIComponent(userId)}/enrollments`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ enrollments: EnrollmentDto[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, enrollments: parsed.data.data.enrollments };
}

export async function fetchProgress(
  session: LmsApiSession,
  userId: string
): Promise<{ ok: true; progress: ProgressDto[] } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/users/${encodeURIComponent(userId)}/progress`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ progress: ProgressDto[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, progress: parsed.data.data.progress };
}

export async function postEnrollment(
  session: LmsApiSession,
  courseId: string,
  userId: string
): Promise<{ ok: true; enrollment: EnrollmentDto } | { ok: false; error: ApiError }> {
  const response = await fetch(`/api/v1/tenants/${encodeURIComponent(session.tenantId)}/enrollments`, {
    method: "POST",
    headers: authHeaders(session, true),
    body: JSON.stringify({ userId, courseId })
  });
  const parsed = await parseResponse<DataEnvelope<{ enrollment: EnrollmentDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, enrollment: parsed.data.data.enrollment };
}

export async function putProgress(
  session: LmsApiSession,
  body: ProgressPutBody
): Promise<{ ok: true; progress: ProgressDto } | { ok: false; error: ApiError }> {
  const response = await fetch(`/api/v1/tenants/${encodeURIComponent(session.tenantId)}/progress`, {
    method: "PUT",
    headers: authHeaders(session, true),
    body: JSON.stringify(body)
  });
  const parsed = await parseResponse<DataEnvelope<{ progress: ProgressDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, progress: parsed.data.data.progress };
}

export async function putSubmissionDraft(
  session: LmsApiSession,
  assessmentId: string
): Promise<{ ok: true; submission: SubmissionDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/assessments/${encodeURIComponent(assessmentId)}/submissions`,
    { method: "PUT", headers: authHeaders(session, false) }
  );
  const parsed = await parseResponse<DataEnvelope<{ submission: SubmissionDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, submission: parsed.data.data.submission };
}

export async function postSubmitAssessment(
  session: LmsApiSession,
  assessmentId: string
): Promise<{ ok: true; submission: SubmissionDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/assessments/${encodeURIComponent(assessmentId)}/submissions/submit`,
    { method: "POST", headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ submission: SubmissionDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, submission: parsed.data.data.submission };
}

export type LearnerSummary = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchLearners(
  session: LmsApiSession
): Promise<{ ok: true; learners: LearnerSummary[] } | { ok: false; error: ApiError }> {
  const response = await fetch(`/api/v1/tenants/${encodeURIComponent(session.tenantId)}/learners`, {
    headers: authHeaders(session)
  });
  const parsed = await parseResponse<DataEnvelope<{ learners: LearnerSummary[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, learners: parsed.data.data.learners };
}

export async function probeInstructorRoute(session: LmsApiSession): Promise<boolean> {
  const response = await fetch(`/api/v1/tenants/${encodeURIComponent(session.tenantId)}/instructor`, {
    headers: authHeaders(session)
  });
  return response.ok;
}

export async function probeAdminRoute(session: LmsApiSession): Promise<boolean> {
  const response = await fetch(`/api/v1/tenants/${encodeURIComponent(session.tenantId)}/admin`, {
    headers: authHeaders(session)
  });
  return response.ok;
}

export async function postProvisionLearner(
  session: LmsApiSession,
  body: LearnerProvisionBody
): Promise<{ ok: true; learner: LearnerSummary } | { ok: false; error: ApiError }> {
  const response = await fetch(`/api/v1/tenants/${encodeURIComponent(session.tenantId)}/learners`, {
    method: "POST",
    headers: authHeaders(session, true),
    body: JSON.stringify(body)
  });
  const parsed = await parseResponse<DataEnvelope<{ learner: LearnerSummary }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, learner: parsed.data.data.learner };
}

export async function fetchCourseCategories(
  session: LmsApiSession
): Promise<{ ok: true; categories: CourseCategoryDto[] } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/course-categories`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ categories: CourseCategoryDto[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, categories: parsed.data.data.categories };
}

export async function postCourseCategory(
  session: LmsApiSession,
  body: CourseCategoryCreateBody
): Promise<{ ok: true; category: CourseCategoryDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/course-categories`,
    { method: "POST", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<DataEnvelope<{ category: CourseCategoryDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, category: parsed.data.data.category };
}

export async function patchCourseCategory(
  session: LmsApiSession,
  categoryId: string,
  body: CourseCategoryPatchBody
): Promise<{ ok: true; category: CourseCategoryDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/course-categories/${encodeURIComponent(categoryId)}`,
    { method: "PATCH", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<DataEnvelope<{ category: CourseCategoryDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, category: parsed.data.data.category };
}

export async function deleteCourseCategory(
  session: LmsApiSession,
  categoryId: string
): Promise<{ ok: true } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/course-categories/${encodeURIComponent(categoryId)}`,
    { method: "DELETE", headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ archived: true }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true };
}

export async function fetchCoursesInCategory(
  session: LmsApiSession,
  categoryId: string
): Promise<{ ok: true; courses: CourseDto[] } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/course-categories/${encodeURIComponent(categoryId)}/courses`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ courses: CourseDto[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, courses: parsed.data.data.courses };
}

export async function putCourseCategories(
  session: LmsApiSession,
  courseId: string,
  body: CourseCategoriesPutBody
): Promise<{ ok: true; course: CourseDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/categories`,
    { method: "PUT", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<DataEnvelope<{ course: CourseDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, course: parsed.data.data.course };
}

function appendProgressReportQueryParams(params: URLSearchParams, query: ProgressReportSharedQuery): void {
  if (query.courseId) {
    params.set("courseId", query.courseId);
  }
  if (query.learnerId) {
    params.set("learnerId", query.learnerId);
  }
  if (query.enrolledFrom) {
    params.set("enrolledFrom", query.enrolledFrom);
  }
  if (query.enrolledTo) {
    params.set("enrolledTo", query.enrolledTo);
  }
}

export async function fetchProgressReportSummary(
  session: LmsApiSession,
  query: ProgressReportSharedQuery
): Promise<{ ok: true; summary: ProgressReportSummaryDto } | { ok: false; error: ApiError }> {
  const params = new URLSearchParams();
  appendProgressReportQueryParams(params, query);
  const qs = params.toString();
  const url = `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/reports/progress/summary${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, { headers: authHeaders(session) });
  const parsed = await parseResponse<DataEnvelope<{ summary: ProgressReportSummaryDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, summary: parsed.data.data.summary };
}

export async function fetchProgressReportRows(
  session: LmsApiSession,
  query: ProgressReportRowsQuery
): Promise<
  { ok: true; rows: ProgressReportRowDto[]; nextCursor: string | null } | { ok: false; error: ApiError }
> {
  const params = new URLSearchParams();
  appendProgressReportQueryParams(params, query);
  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }
  if (query.cursor) {
    params.set("cursor", query.cursor);
  }
  const qs = params.toString();
  const url = `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/reports/progress/rows${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, { headers: authHeaders(session) });
  const parsed = await parseResponse<DataEnvelope<{ rows: ProgressReportRowDto[]; nextCursor: string | null }>>(
    response
  );
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, rows: parsed.data.data.rows, nextCursor: parsed.data.data.nextCursor };
}

export async function deleteCourseFromCategory(
  session: LmsApiSession,
  courseId: string,
  categoryId: string
): Promise<{ ok: true } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/categories/${encodeURIComponent(categoryId)}`,
    { method: "DELETE", headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ removed: true }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true };
}

function lessonFilesBase(session: LmsApiSession, courseId: string, lessonId: string): string {
  return `/api/v1/tenants/${encodeURIComponent(session.tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/files`;
}

export async function fetchLessonFileAttachments(
  session: LmsApiSession,
  courseId: string,
  lessonId: string
): Promise<{ ok: true; attachments: LessonFileAttachmentDto[] } | { ok: false; error: ApiError }> {
  const response = await fetch(lessonFilesBase(session, courseId, lessonId), {
    headers: authHeaders(session)
  });
  const parsed = await parseResponse<DataEnvelope<{ attachments: LessonFileAttachmentDto[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, attachments: parsed.data.data.attachments };
}

export async function initLessonFileUpload(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  body: LessonFileUploadInitBody
): Promise<
  | {
      ok: true;
      attachment: LessonFileAttachmentDto;
      upload: LessonFileUploadInstruction;
      limits: { maxBytes: number };
    }
  | { ok: false; error: ApiError }
> {
  const response = await fetch(`${lessonFilesBase(session, courseId, lessonId)}/upload-init`, {
    method: "POST",
    headers: authHeaders(session, true),
    body: JSON.stringify(body)
  });
  const parsed = await parseResponse<
    DataEnvelope<{
      attachment: LessonFileAttachmentDto;
      upload: LessonFileUploadInstruction;
      limits: { maxBytes: number };
    }>
  >(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, ...parsed.data.data };
}

export async function archiveLessonFileAttachment(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  fileId: string
): Promise<{ ok: true } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `${lessonFilesBase(session, courseId, lessonId)}/${encodeURIComponent(fileId)}`,
    { method: "DELETE", headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ archived: true }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true };
}

export async function patchLessonFileAttachment(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  fileId: string,
  body: LessonFilePatchBody
): Promise<{ ok: true; attachment: LessonFileAttachmentDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `${lessonFilesBase(session, courseId, lessonId)}/${encodeURIComponent(fileId)}`,
    { method: "PATCH", headers: authHeaders(session, true), body: JSON.stringify(body) }
  );
  const parsed = await parseResponse<DataEnvelope<{ attachment: LessonFileAttachmentDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, attachment: parsed.data.data.attachment };
}

export async function reorderLessonFileAttachments(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  body: LessonFileReorderBody
): Promise<{ ok: true; attachments: LessonFileAttachmentDto[] } | { ok: false; error: ApiError }> {
  const response = await fetch(lessonFilesBase(session, courseId, lessonId), {
    method: "PATCH",
    headers: authHeaders(session, true),
    body: JSON.stringify(body)
  });
  const parsed = await parseResponse<DataEnvelope<{ attachments: LessonFileAttachmentDto[] }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, attachments: parsed.data.data.attachments };
}

export async function fetchLessonFileDownload(
  session: LmsApiSession,
  courseId: string,
  lessonId: string,
  fileId: string
): Promise<{ ok: true; download: LessonFileDownloadDto } | { ok: false; error: ApiError }> {
  const response = await fetch(
    `${lessonFilesBase(session, courseId, lessonId)}/${encodeURIComponent(fileId)}/download`,
    { headers: authHeaders(session) }
  );
  const parsed = await parseResponse<DataEnvelope<{ download: LessonFileDownloadDto }>>(response);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, download: parsed.data.data.download };
}
