import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

function normalizeRole(role?: string): string {
  if (!role) return "mentee";
  const r = role.toLowerCase().replace(/[-_\s]/g, "");
  if (r.includes("admin")) return "admin";
  if (r.includes("mentor")) return "mentor";
  if (r.includes("mentee")) return "mentee";
  return role.toLowerCase();
}

/**
 * Cache of known failed/revoked refresh tokens to prevent duplicate HTTP calls in concurrent requests.
 */
const failedRefreshTokens = new Set<string>();

/**
 * Safely parses the expiration timestamp (in milliseconds) from either
 * an expiresIn field or the JWT's decoded 'exp' claim.
 */
function getAccessTokenExpires(accessToken?: string, expiresIn?: number | string): number {
  if (expiresIn !== undefined && expiresIn !== null) {
    const num = Number(expiresIn);
    if (!isNaN(num) && num > 0) {
      if (num > 1_000_000_000) {
        return num * 1000;
      }
      return Date.now() + num * 1000;
    }
  }

  if (accessToken && typeof accessToken === "string") {
    try {
      const parts = accessToken.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
        const parsed = JSON.parse(payloadJson);
        if (parsed.exp && typeof parsed.exp === "number") {
          return parsed.exp * 1000;
        }
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: 15 minutes TTL
  return Date.now() + 15 * 60 * 1000;
}

/**
 * Calls backend POST /api/v1/auth/refresh-token to rotate access token.
 * If the request fails, attaches error: "RefreshAccessTokenError".
 */
async function refreshAccessToken(token: any) {
  try {
    if (!token.refreshToken || failedRefreshTokens.has(token.refreshToken)) {
      return {
        ...token,
        accessToken: undefined,
        refreshToken: undefined,
        accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
        error: "RefreshAccessTokenError",
      };
    }

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://cbcm-backend-1.onrender.com").replace(/\/+$/, "");
    const endpoint = baseUrl.endsWith("/api/v1")
      ? `${baseUrl}/auth/refresh-token`
      : `${baseUrl}/api/v1/auth/refresh-token`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.success === false) {
      console.warn("Refresh token request rejected by backend:", res.status);
      failedRefreshTokens.add(token.refreshToken);
      return {
        ...token,
        accessToken: undefined,
        refreshToken: undefined,
        accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
        error: "RefreshAccessTokenError",
      };
    }

    const payload = data?.data || data;
    const newAccessToken = payload?.accessToken || payload?.token;
    const newRefreshToken = payload?.refreshToken || payload?.refresh_token || token.refreshToken;
    const expiresIn = payload?.expiresIn || payload?.expires_in;

    if (!newAccessToken) {
      failedRefreshTokens.add(token.refreshToken);
      return {
        ...token,
        accessToken: undefined,
        refreshToken: undefined,
        accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
        error: "RefreshAccessTokenError",
      };
    }

    return {
      ...token,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpires: getAccessTokenExpires(newAccessToken, expiresIn),
      error: undefined,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    if (token?.refreshToken) {
      failedRefreshTokens.add(token.refreshToken);
    }
    return {
      ...token,
      accessToken: undefined,
      refreshToken: undefined,
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  // 1. Configure authentication providers
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Construct backend endpoint using NEXT_PUBLIC_API_URL
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://cbcm-backend-1.onrender.com").replace(/\/+$/, "");
        const endpoint = baseUrl.endsWith("/api/v1")
          ? `${baseUrl}/auth/login`
          : `${baseUrl}/api/v1/auth/login`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email.trim(),
            password: credentials.password,
          }),
        });

        // If response is not ok (e.g., 401 Unauthorized), throw error for the login page
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.message || errorData?.error?.message || "Invalid credentials");
        }

        const data = await res.json();

        // Extract user and token from standard response envelopes (data.data, data.user, or direct)
        const payload = data?.data || data;
        const userData = payload?.user || payload;
        const accessToken = payload?.accessToken || payload?.token || data?.accessToken || data?.token;
        const refreshToken =
          payload?.refreshToken ||
          payload?.refresh_token ||
          data?.refreshToken ||
          data?.refresh_token ||
          userData?.refreshToken ||
          userData?.refresh_token;

        if (!userData || !userData.email) {
          throw new Error("Invalid credentials");
        }

        const facility_id =
          userData.facility_id ??
          userData.facilityId ??
          userData.facility?.id ??
          (userData.role?.includes("admin") ? 2 : undefined);

        const accessTokenExpires = getAccessTokenExpires(
          accessToken,
          payload?.expiresIn || payload?.expires_in
        );

        const name =
          userData.name ||
          userData.fullName ||
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
          userData.email;

        // Return user object along with the access token and normalized role
        return {
          ...userData,
          id: String(userData.id || userData._id || userData.userId || "1"),
          name,
          email: userData.email,
          role: normalizeRole(userData.role),
          rawRole: userData.role,
          facility_id,
          accessToken,
          refreshToken,
          accessTokenExpires,
        };
      },
    }),
  ],

  // 2. Persist role and access token across JWT and Session with refresh rotation
  callbacks: {
    // Step A: Store role, facility_id, and tokens inside the JWT token
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.role = normalizeRole((user as any).role || (user as any).rawRole);
        token.rawRole = (user as any).rawRole || (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.id = (user as any).id;
        token.facility_id =
          (user as any).facility_id ??
          (user as any).facilityId ??
          (user as any).facility?.id;
        token.facilityId = token.facility_id;
        token.accessTokenExpires =
          (user as any).accessTokenExpires || getAccessTokenExpires((user as any).accessToken);
        token.error = undefined;
        return token;
      }

      // If token already has a fatal error or is known failed, do NOT retry refreshing
      if (token.error === "RefreshAccessTokenError" || (token.refreshToken && failedRefreshTokens.has(token.refreshToken as string))) {
        return {
          ...token,
          accessToken: undefined,
          refreshToken: undefined,
          accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
          error: "RefreshAccessTokenError",
        };
      }

      // Return previous token if the access token has not expired yet (with 30-second margin)
      const expiresAt = Number(token.accessTokenExpires) || 0;
      if (expiresAt > 0 && Date.now() < expiresAt - 30 * 1000) {
        return token;
      }

      // If no refresh token is present, mark dead session immediately
      if (!token.refreshToken) {
        return {
          ...token,
          accessToken: undefined,
          refreshToken: undefined,
          accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
          error: "RefreshAccessTokenError",
        };
      }

      // Access token has expired, rotate token using refresh token
      return await refreshAccessToken(token);
    },

    // Step B: Expose role, facility_id, accessToken, and error state on session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = normalizeRole(token.role as string);
        (session.user as any).rawRole = token.rawRole;
        (session.user as any).id = token.id;
        (session.user as any).facility_id = token.facility_id;
        (session.user as any).facilityId = token.facility_id;
        (session as any).accessToken = token.accessToken;
      }
      (session as any).error = token.error;
      return session;
    },
  },

  // 3. Custom sign-in route
  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };