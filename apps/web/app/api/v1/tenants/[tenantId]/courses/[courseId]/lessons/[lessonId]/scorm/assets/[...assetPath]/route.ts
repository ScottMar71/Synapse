import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function upstreamApiOrigin(): string {
  return process.env.LMS_API_ORIGIN?.trim() || "http://127.0.0.1:8787";
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      tenantId: string;
      courseId: string;
      lessonId: string;
      assetPath: string[];
    }>;
  }
): Promise<Response> {
  const params = await context.params;
  const { tenantId, courseId, lessonId, assetPath } = params;
  if (!assetPath?.length) {
    return new Response("Missing asset path", { status: 400 });
  }

  const cookieTenant = request.cookies.get("lms_tenant")?.value?.trim();
  const token = request.cookies.get("lms_token")?.value?.trim();
  if (!token || !cookieTenant) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (cookieTenant !== tenantId) {
    return new Response("Forbidden", { status: 403 });
  }

  const tail = assetPath.map((seg) => encodeURIComponent(seg)).join("/");
  const upstreamUrl = `${upstreamApiOrigin()}/api/v1/tenants/${encodeURIComponent(tenantId)}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/scorm/assets/${tail}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("x-tenant-id", cookieTenant);
  const requestId = request.headers.get("x-request-id");
  if (requestId) {
    headers.set("x-request-id", requestId);
  }

  const upstream = await fetch(upstreamUrl, { headers, cache: "no-store" });

  const outHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    outHeaders.set("Content-Type", contentType);
  }
  outHeaders.set("Cache-Control", "private, no-store");

  return new Response(upstream.body, { status: upstream.status, headers: outHeaders });
}
