import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/auth/verify-email") ||
    pathname.startsWith("/auth/resend-email")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  const isAuthPage = pathname === "/auth";
  const isZonePage = pathname.startsWith("/zone");

  if (isZonePage && !token) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/zone", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/zone/:path*", "/auth/:path*"],
};
