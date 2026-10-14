import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // getToken securely reads the NextAuth VIP wristband (cookie)
  const token = await getToken({ req });
  const path = req.nextUrl.pathname;

  const isInvalidToken = !token || (token as any)?.error === "RefreshAccessTokenError";

  // 1. If user is on an auth page (/login or /forgot-password)
  if (path.startsWith("/login") || path.startsWith("/forgot-password")) {
    // Only redirect to dashboard if the token is valid and not errored
    if (token && !isInvalidToken) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 2. For every other protected page, if they DO NOT have a valid token, kick them to login
  if (isInvalidToken) {
    const loginUrl = new URL("/login", req.url);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
    }
    return response;
  }

  // 3. If they have a token and are allowed, let the request proceed
  return NextResponse.next();
}

export const config = {
  // This tells Next.js to run this middleware on every route EXCEPT background API calls and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};