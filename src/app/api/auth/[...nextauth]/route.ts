
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://cbcm-backend-1.onrender.com/api/v1";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "CBCM Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const result = await response.json();

          if (
            !result.success ||
            !result.data?.accessToken ||
            !result.data?.user
          ) {
            return null;
          }

          const { accessToken, refreshToken } = result.data;
          const user = result.data.user;

          if (user.status !== "active") {
            return null;
          }

          return {
            id: String(user.id),
            name: user.full_name,
            email: user.email,
            role: user.role,
            accessToken,
            refreshToken,
            mustChangePassword: user.must_change_password,
          };
        } catch (error) {
          console.error("CBCM login request failed:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authenticatedUser = user as typeof user & {
          role?: string;
          accessToken?: string;
          refreshToken?: string;
          mustChangePassword?: boolean;
        };

        token.role = authenticatedUser.role;
        token.accessToken = authenticatedUser.accessToken;
        token.refreshToken = authenticatedUser.refreshToken;
        token.mustChangePassword =
          authenticatedUser.mustChangePassword;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: string;
          role?: string;
          mustChangePassword?: boolean;
        };

        sessionUser.id = token.sub;
        sessionUser.role = token.role as string | undefined;
        sessionUser.mustChangePassword =
          token.mustChangePassword as boolean | undefined;
      }

      // Make the access token available to client components if needed.
      // Prefer server-side API calls for sensitive operations.
      (session as typeof session & {
        accessToken?: string;
      }).accessToken = token.accessToken as string | undefined;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
