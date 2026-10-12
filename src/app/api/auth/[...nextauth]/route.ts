import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
        const endpoint = baseUrl.endsWith("/api/v1")
          ? `${baseUrl}/auth/login`
          : `${baseUrl}/api/v1/auth/login`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        // If response is not ok (e.g., 401 Unauthorized), throw error for the login page
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.message || "Invalid credentials");
        }

        const data = await res.json();

        // Extract user and token from standard response envelopes (data.user, data.data, or direct)
        const payload = data?.data || data;
        const userData = payload?.user || payload;
        const accessToken = payload?.accessToken || payload?.token || data?.accessToken || data?.token;

        if (!userData || !userData.email) {
          throw new Error("Invalid credentials");
        }

        // Return user object along with the access token
        return {
          id: userData.id || userData._id || userData.userId || "1",
          name:
            userData.name ||
            userData.fullName ||
            `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
            userData.email,
          email: userData.email,
          role: userData.role || "mentee",
          accessToken,
          ...userData,
        };
      },
    }),
  ],

  // 2. Persist role and access token across JWT and Session
  callbacks: {
    // Step A: Store role and accessToken inside the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.id = (user as any).id;
      }
      return token;
    },
    // Step B: Expose role and accessToken on session so client & server components can access them
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session as any).accessToken = token.accessToken;
      }
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