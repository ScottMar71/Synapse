import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { parseBearerToken } from "@conductor/auth";

function requestIdFor(request: NextRequest): string {
  return request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
}

function nextWithRequestId(request: NextRequest): NextResponse {
  const id = requestIdFor(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", id);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", id);
  return response;
}

function redirectWithRequestId(request: NextRequest, url: URL): NextResponse {
  const id = requestIdFor(request);
  const response = NextResponse.redirect(url);
  response.headers.set("x-request-id", id);
  return response;
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/learn") || pathname.startsWith("/instructor")) {
    const token = request.cookies.get("lms_token")?.value;
    const tenant = request.cookies.get("lms_tenant")?.value;
    if (!token || !tenant) {
      const signIn = new URL("/sign-in", request.url);
      signIn.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return redirectWithRequestId(request, signIn);
    }
    return nextWithRequestId(request);
  }

  if (!pathname.startsWith("/protected")) {
    return nextWithRequestId(request);
  }

  const authorizationHeader = request.headers.get("authorization") ?? undefined;
  const bearerToken = parseBearerToken(authorizationHeader);
  const tenantId = request.headers.get("x-tenant-id");

  if (!bearerToken || !tenantId) {
    return redirectWithRequestId(request, new URL("/", request.url));
  }

  return nextWithRequestId(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
