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

function parseExpiresInToMs(expiresIn?: number | string): number | null {
  if (expiresIn === undefined || expiresIn === null) return null;
  if (typeof expiresIn === "number") {
    if (expiresIn <= 0) return null;
    return expiresIn > 1_000_000_000_000
      ? expiresIn
      : expiresIn > 1_000_000_000
      ? expiresIn * 1000
      : Date.now() + expiresIn * 1000;
  }
  const str = String(expiresIn).trim().toLowerCase();
  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) return null;

  if (str.endsWith("m")) {
    return Date.now() + num * 60 * 1000;
  }
  if (str.endsWith("h")) {
    return Date.now() + num * 60 * 60 * 1000;
  }
  if (str.endsWith("d")) {
    return Date.now() + num * 24 * 60 * 60 * 1000;
  }
  if (str.endsWith("s")) {
    return Date.now() + num * 1000;
  }
  return num > 1_000_000_000_000
    ? num
    : num > 1_000_000_000
    ? num * 1000
    : Date.now() + num * 1000;
}

/**
 * Safely parses the expiration timestamp (in milliseconds) from either
 * an expiresIn field or the JWT's decoded 'exp' claim.
 */
function getAccessTokenExpires(accessToken?: string, expiresIn?: number | string): number {
  const parsedMs = parseExpiresInToMs(expiresIn);
  if (parsedMs && parsedMs > Date.now()) {
    return parsedMs;
  }

  if (accessToken && typeof accessToken === "string") {
    try {
      const parts = accessToken.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
        const parsed = JSON.parse(payloadJson);
        if (parsed.exp && typeof parsed.exp === "number") {
          const expMs = parsed.exp > 1_000_000_000_000 ? parsed.exp : parsed.exp * 1000;
          if (expMs > Date.now()) {
            return expMs;
          }
        }
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: 14 minutes TTL to ensure rotation before 15-minute backend token expiration
  return Date.now() + 14 * 60 * 1000;
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
      const expiresIn = payload?.accessTokenExpiresIn || payload?.expiresIn || payload?.expires_in;

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
              let facility_id =
                userData.facility_id !== undefined && userData.facility_id !== null
                  ? Number(userData.facility_id)
                  : userData.facilityId !== undefined && userData.facilityId !== null
                  ? Number(userData.facilityId)
                  : userData.facility?.id !== undefined && userData.facility?.id !== null
                  ? Number(userData.facility?.id)
                  : undefined;

              // If facility_id is not directly present on the login payload, query user profile
              if (facility_id === undefined && userData.id && accessToken) {
                try {
                  const userProfileUrl = baseUrl.endsWith("/api/v1")
                    ? `${baseUrl}/users/${userData.id}`
                    : `${baseUrl}/api/v1/users/${userData.id}`;
                  const profileRes = await fetch(userProfileUrl, {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                    },
                  });
                  if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    const profile =
                      profileData?.data?.user ||
                      profileData?.data ||
                      profileData?.user ||
                      profileData;
                    if (profile?.facility_id !== undefined && profile?.facility_id !== null) {
                      facility_id = Number(profile.facility_id);
                    } else if (profile?.facilityId !== undefined && profile?.facilityId !== null) {
                      facility_id = Number(profile.facilityId);
                    } else if (profile?.facility?.id !== undefined && profile?.facility?.id !== null) {
                      facility_id = Number(profile.facility?.id);
                    }
                  }
                } catch (profErr) {
                  console.warn("Could not fetch user profile for facility_id:", profErr);
                }
              }

              const accessTokenExpires = getAccessTokenExpires(
                accessToken,
                payload?.accessTokenExpiresIn || payload?.expiresIn || payload?.expires_in
              );

              let rawName =
                userData.name ||
                userData.fullName ||
                `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
                userData.email ||
                inputEmail ||
                "User";

              // Clean up email domain if present in name (e.g. user@gmail.com -> User)
              let name = rawName;
              if (name && name.includes("@")) {
                const cleanPrefix = name.split("@")[0].split(/[._-]/)[0];
                name = cleanPrefix.charAt(0).toUpperCase() + cleanPrefix.slice(1);
              }

              const must_change_password = Boolean(
                userData.must_change_password ?? userData.mustChangePassword
              );

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
                must_change_password,
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

        // Active Mock Accounts for local development (as specified in AGENTS.md + Facility Admin & Super Admin support)
        const isMockSuperAdmin =
          (inputEmail === "superadmin@test.com" && inputPassword === "password") ||
          (inputEmail === "superadmin@admin.com" && inputPassword === "password");
        const isMockAdmin = inputEmail === "admin@test.com" && inputPassword === "password";
        const isMockMentor = inputEmail === "mentor@test.com" && inputPassword === "password";
        const isMockMentee = inputEmail === "mentee@test.com" && inputPassword === "password";
        const isMockFacilityAdmin =
          inputEmail === "facilityadmin@test.com" && inputPassword === "password";

        if (isMockSuperAdmin || isMockAdmin || isMockMentor || isMockMentee || isMockFacilityAdmin) {
          let role: "super_admin" | "admin" | "facility_admin" | "mentor" | "mentee" = "admin";
          let name = "Administrator";

          if (isMockSuperAdmin) {
            role = "super_admin";
            name = "Super Administrator";
          } else if (isMockAdmin) {
            role = "admin";
            name = "Administrator";
          } else if (isMockMentor) {
            role = "mentor";
            name = "Almaz Bekele";
          } else if (isMockMentee) {
            role = "mentee";
            name = "Bethlehem Tadesse";
          } else {
            role = "facility_admin";
            name = "Birtukan";
          }

          return {
            id: role === "super_admin" ? "0" : role === "admin" ? "1" : role === "mentor" ? "2" : role === "mentee" ? "3" : "4",
            name,
            email: inputEmail,
            role,
            rawRole: role,
            facility_id: role === "super_admin" ? undefined : 2,
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
    async jwt({ token, user, trigger, session }) {
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
        token.must_change_password = Boolean((user as any).must_change_password);
        token.error = undefined;
        return token;
      }

      // Handle session updates (e.g. after user changes their initial password)
      if (trigger === "update" && session?.must_change_password !== undefined) {
        token.must_change_password = Boolean(session.must_change_password);
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

    // Step B: Expose role, facility_id, accessToken, refreshToken, and error state on session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = normalizeRole(token.role as string);
        (session.user as any).rawRole = token.rawRole;
        (session.user as any).id = token.id;
        (session.user as any).facility_id = token.facility_id;
        (session.user as any).facilityId = token.facility_id;
        (session.user as any).must_change_password = Boolean(token.must_change_password);
        (session as any).accessToken = token.accessToken;
        (session as any).refreshToken = token.refreshToken;
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