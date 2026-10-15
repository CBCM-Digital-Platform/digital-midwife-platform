import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // getToken securely reads the NextAuth VIP wristband (cookie)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  // 1. If user is on an auth page (/login or /forgot-password)
  const hasErrorParam = req.nextUrl.searchParams.has("error");
  const hasActiveAccessToken = Boolean(
    token &&
    (token as any).error !== "RefreshAccessTokenError" &&
    token.accessTokenExpires &&
    Date.now() < Number(token.accessTokenExpires)
  );

  if (path.startsWith("/login") || path.startsWith("/forgot-password")) {
    // Only redirect to dashboard if the user has a strictly valid, unexpired session and no error param
    if (hasActiveAccessToken && !hasErrorParam) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Otherwise (no session, expired session, error param, or failed refresh):
    // Purge stale session cookies on the response so the browser is clean and doesn't loop
    const response = NextResponse.next();
    if (token) {
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
    }
    return response;
  }

  // 2. For every other protected page, if they DO NOT have a valid token or have fatal refresh error
  const isFatalSession = !token || (token as any)?.error === "RefreshAccessTokenError";
  if (isFatalSession) {
    const loginUrl = new URL("/login", req.url);
    if ((token as any)?.error === "RefreshAccessTokenError") {
      loginUrl.searchParams.set("error", "SessionExpired");
    }
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
    }
    return response;
  }

  // 3. If they have a token, let the request proceed to allow server-side layout/jwt refresh
  return NextResponse.next();
}

export const config = {
  // This tells Next.js to run this middleware on every route EXCEPT background API calls and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};