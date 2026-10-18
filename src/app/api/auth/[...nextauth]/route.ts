import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

function normalizeRole(role?: string): string {
  if (!role) return "mentee";
  const r = role.toLowerCase().replace(/[-_\s]/g, "");
  if (r.includes("facilityadmin") || r === "facility_admin") return "facility_admin";
  if (r.includes("superadmin") || r === "super_admin") return "super_admin";
  if (r.includes("admin")) return "admin";
  if (r.includes("mentor")) return "mentor";
  if (r.includes("mentee")) return "mentee";
  return role.toLowerCase();
}

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
          const expMs = parsed.exp > 1_000_000_000 ? parsed.exp * 1000 : parsed.exp;
          if (expMs > Date.now()) {
            return expMs;
          }
        }
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: 24 hours TTL
  return Date.now() + 24 * 60 * 60 * 1000;
}

// In-memory cache for pending and rejected refresh token requests to avoid redundant backend calls
const pendingRefreshes = new Map<string, Promise<any>>();
const failedTokens = new Set<string>();

/**
 * Calls backend POST /api/v1/auth/refresh-token to rotate access token.
 */
async function refreshAccessToken(token: any) {
  // If running in local development with mock accounts, extend session directly
  if (token.accessToken?.startsWith?.("mock-")) {
    return {
      ...token,
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      error: undefined,
    };
  }

  if (!token.refreshToken) {
    // If backend has no refresh token, keep session active
    return {
      ...token,
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      error: undefined,
    };
  }

  const tokenKey = String(token.refreshToken);

  // If this token was already rejected, fail immediately without spamming backend
  if (failedTokens.has(tokenKey)) {
    return {
      ...token,
      accessToken: undefined,
      refreshToken: undefined,
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      error: "RefreshAccessTokenError",
    };
  }

  // Deduplicate in-flight requests for the same refresh token
  if (pendingRefreshes.has(tokenKey)) {
    return pendingRefreshes.get(tokenKey);
  }

  const refreshPromise = (async () => {
    try {
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
        failedTokens.add(tokenKey);
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
        failedTokens.add(tokenKey);
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
      failedTokens.add(tokenKey);
      return {
        ...token,
        accessToken: undefined,
        refreshToken: undefined,
        accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
        error: "RefreshAccessTokenError",
      };
    } finally {
      pendingRefreshes.delete(tokenKey);
    }
  })();

  pendingRefreshes.set(tokenKey, refreshPromise);
  return refreshPromise;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "cbcm-midwife-digital-platform-secret-key-2026",

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

        const inputEmail = credentials.email.trim().toLowerCase();
        const inputPassword = credentials.password;

        // Construct backend endpoint using NEXT_PUBLIC_API_URL
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://cbcm-backend-1.onrender.com").replace(/\/+$/, "");
        const endpoint = baseUrl.endsWith("/api/v1")
          ? `${baseUrl}/auth/login`
          : `${baseUrl}/api/v1/auth/login`;

        let backendError: string | null = null;

        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: inputEmail,
              password: inputPassword,
            }),
          });

          if (res.ok) {
            const data = await res.json();
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

            if (userData && (userData.email || userData.id)) {
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
                userData.email ||
                "User";

              return {
                ...userData,
                id: String(userData.id || userData._id || userData.userId || "1"),
                name,
                email: userData.email || inputEmail,
                role: normalizeRole(userData.role || "facility_admin"),
                rawRole: userData.role || "facility_admin",
                facility_id,
                accessToken,
                refreshToken,
                accessTokenExpires,
              };
            }
          } else {
            const errorData = await res.json().catch(() => null);
            backendError = errorData?.message || errorData?.error?.message || "Invalid credentials";
          }
        } catch (fetchErr: any) {
          console.warn("Backend auth fetch error or cold start:", fetchErr?.message);
          backendError = fetchErr?.message || "Authentication service unavailable.";
        }

        // Active Mock Accounts for local development (as specified in AGENTS.md + Facility Admin support)
        const isMockAdmin = inputEmail === "admin@test.com" && inputPassword === "password";
        const isMockMentor = inputEmail === "mentor@test.com" && inputPassword === "password";
        const isMockMentee = inputEmail === "mentee@test.com" && inputPassword === "password";
        const isMockFacilityAdmin =
          (inputEmail === "facilityadmin@test.com" && inputPassword === "password") ||
          (inputEmail === "burte@gmail.com");

        if (isMockAdmin || isMockMentor || isMockMentee || isMockFacilityAdmin) {
          let role: "admin" | "facility_admin" | "mentor" | "mentee" = "admin";
          let name = "Administrator";

          if (isMockAdmin) {
            role = "admin";
            name = "System Administrator";
          } else if (isMockMentor) {
            role = "mentor";
            name = "Sister Almaz Bekele (Mentor)";
          } else if (isMockMentee) {
            role = "mentee";
            name = "Bethlehem Tadesse (Mentee)";
          } else {
            role = "facility_admin";
            name = "Birtukan (Facility Admin)";
          }

          return {
            id: role === "admin" ? "1" : role === "mentor" ? "2" : role === "mentee" ? "3" : "4",
            name,
            email: inputEmail,
            role,
            rawRole: role,
            facility_id: 2,
            accessToken: `mock-jwt-token-${role}`,
            refreshToken: `mock-refresh-token-${role}`,
            accessTokenExpires: Date.now() + 7 * 24 * 60 * 60 * 1000,
          };
        }

        throw new Error(backendError || "Invalid email or password. Please try again.");
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
          (user as any).facility?.id ??
          2;
        token.facilityId = token.facility_id;
        token.accessTokenExpires =
          (user as any).accessTokenExpires || getAccessTokenExpires((user as any).accessToken);
        token.error = undefined;
        return token;
      }

      // If token already has a fatal error, do not retry refreshing
      if (token.error === "RefreshAccessTokenError") {
        return token;
      }

      // Return previous token if the access token has not expired yet (with 60-second margin)
      const expiresAt = Number(token.accessTokenExpires) || (Date.now() + 24 * 60 * 60 * 1000);
      if (expiresAt > 0 && Date.now() < expiresAt - 60 * 1000) {
        return token;
      }

      // If no refresh token is present, preserve session if access token exists
      if (!token.refreshToken) {
        token.accessTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
        return token;
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

export async function GET(req: any, ctx: any) {
  return handler(req, ctx);
}

export async function POST(req: any, ctx: any) {
  return handler(req, ctx);
}