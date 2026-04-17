/**
 * Browser URL for SCORM launch HTML/assets. Served by the Next.js app so the iframe
 * receives same-origin navigation and `lms_*` session cookies; the route handler forwards
 * `Authorization: Bearer` to the API.
 */
export function buildScormAssetBrowserUrl(
  tenantId: string,
  courseId: string,
  lessonId: string,
  relativePath: string
): string {
  const trimmed = relativePath.trim().replace(/^\/+/, "").replace(/\\/g, "/");
  const segments = trimmed
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg));
  if (segments.length === 0) {
    return "";
  }
  return `/api/v1/tenants/${encodeURIComponent(tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/scorm/assets/${segments.join("/")}`;
}
