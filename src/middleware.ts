import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for the sandbox login cookie or specific Supabase authenticated cookie
  const isSandboxLoggedIn = request.cookies.get("kkn_sandbox_logged_in")?.value === "true";
  const isSupabaseLoggedIn = request.cookies.get("sb-authenticated")?.value === "true";
  const isLoggedIn = isSandboxLoggedIn || isSupabaseLoggedIn;

  // Core protected paths
  const protectedPaths = [
    "/dashboard",
    "/timeline",
    "/proker",
    "/logbook",
    "/galeri",
    "/dokumen",
    "/notulen",
    "/laporan",
  ];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isLoginPage = pathname === "/login";

  if (isProtected && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginPage && isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, next.svg, vercel.svg (favicons / static assets)
     * - public assets like illustration images (.png, .jpg)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|next.svg|vercel.svg|.*\\.png|.*\\.jpg).*)",
  ],
};
