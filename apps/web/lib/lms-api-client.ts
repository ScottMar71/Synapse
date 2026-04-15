import type {
  CourseDto,
  EnrollmentDto,
  ProgressDto,
  ProgressPutBody,
  SubmissionDto
} from "@conductor/contracts";

import type { LmsSession } from "./lms-session";

export type LmsApiSession = Pick<LmsSession, "token" | "tenantId">;

export type ApiError = { status: number; message: string };

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
