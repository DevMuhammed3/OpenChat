import { NextResponse } from "next/server";
import { NextRequest } from "next/server";


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;

  const isAuthPage = pathname.startsWith("/auth"); 
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
  matcher : ["/zone/:path*", "/auth/:path*"],
};
