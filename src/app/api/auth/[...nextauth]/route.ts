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
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://cbcm-backend-1.onrender.com/api/v1").replace(/\/+$/, "");
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
        const refreshToken = payload?.refreshToken || data?.refreshToken;

        if (!userData || !userData.email) {
          throw new Error("Invalid credentials");
        }

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
          accessToken,
          refreshToken,
        };
      },
    }),
  ],

  // 2. Persist role and access token across JWT and Session
  callbacks: {
    // Step A: Store role and accessToken inside the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.role = normalizeRole((user as any).role || (user as any).rawRole);
        token.rawRole = (user as any).rawRole || (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.id = (user as any).id;
      }
      return token;
    },
    // Step B: Expose role and accessToken on session so client & server components can access them
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = normalizeRole(token.role as string);
        (session.user as any).rawRole = token.rawRole;
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
      }
      (session as any).accessToken = token.accessToken;
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