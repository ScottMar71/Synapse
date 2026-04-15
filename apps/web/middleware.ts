import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/learn") && !pathname.startsWith("/instructor")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("lms_token")?.value;
  const tenant = request.cookies.get("lms_tenant")?.value;
  if (!token || !tenant) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/learn/:path*", "/instructor/:path*"]
};
