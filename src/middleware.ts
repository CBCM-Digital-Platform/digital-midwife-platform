import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "cbcm-midwife-digital-platform-secret-key-2026";

export async function middleware(req: NextRequest) {
  // getToken securely reads the NextAuth session token
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  const hasErrorParam = req.nextUrl.searchParams.has("error");
  const isFatalSession = Boolean(token && (token as any).error === "RefreshAccessTokenError");
  const isAuthenticated = Boolean(token && !isFatalSession);

  // 1. If user is on an auth page (/login or /forgot-password)
  if (path.startsWith("/login") || path.startsWith("/forgot-password")) {
    // Only redirect to dashboard if the user has an active valid session and no explicit error param
    if (isAuthenticated && !hasErrorParam) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 2. Protected dashboard routes
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    if (isFatalSession) {
      loginUrl.searchParams.set("error", "SessionExpired");
    }
    const response = NextResponse.redirect(loginUrl);
    if (isFatalSession && token) {
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
    }
    return response;
  }

  // 3. User is authenticated, let request proceed
  return NextResponse.next();
}

export const config = {
  // This tells Next.js to run this middleware on every route EXCEPT background API calls and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};