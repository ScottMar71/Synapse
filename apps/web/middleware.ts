import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { parseBearerToken } from "@conductor/auth";

export function middleware(request: NextRequest): NextResponse {
  if (!request.nextUrl.pathname.startsWith("/protected")) {
    return NextResponse.next();
  }

  const authorizationHeader = request.headers.get("authorization") ?? undefined;
  const bearerToken = parseBearerToken(authorizationHeader);
  const tenantId = request.headers.get("x-tenant-id");

  if (!bearerToken || !tenantId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/protected/:path*"]
};
