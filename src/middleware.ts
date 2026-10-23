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
  const mustChangePassword = Boolean(token && (token as any).must_change_password);

  // 1. Auth routes (login, forgot-password, reset-password)
  if (
    path.startsWith("/login") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password")
  ) {
    // Only redirect if the user has an active valid session and no explicit error param
    if (isAuthenticated && !hasErrorParam) {
      if (mustChangePassword) {
        return NextResponse.redirect(new URL("/set-password", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    const response = NextResponse.next();
    if (isFatalSession && token) {
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
    }
    return response;
  }

  // 2. Unauthenticated check for protected routes
  if (!isAuthenticated) {
    // Allow /set-password only if an invite/reset token query param is present
    if (path.startsWith("/set-password") && req.nextUrl.searchParams.has("token")) {
      return NextResponse.next();
    }

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

  // 3. Authenticated check: Force newly created users to reset their first-time password
  if (mustChangePassword) {
    if (path.startsWith("/set-password")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/set-password", req.url));
  } else {
    // If user does NOT need to change password, prevent unnecessary visits to /set-password
    if (path.startsWith("/set-password") && !req.nextUrl.searchParams.has("token")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 4. User is authenticated and password status is valid, let request proceed
  return NextResponse.next();
}

export const config = {
  // This tells Next.js to run this middleware on every route EXCEPT background API calls and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
