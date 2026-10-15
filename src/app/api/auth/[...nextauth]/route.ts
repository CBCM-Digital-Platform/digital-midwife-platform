import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRole(role?: string): string {
  if (!role) return "mentee";
  const normalizedRole = role.toLowerCase().replace(/[-_\s]/g, "");
  if (normalizedRole.includes("admin")) return "admin";
  if (normalizedRole.includes("mentor")) return "mentor";
  if (normalizedRole.includes("mentee")) return "mentee";
  return role.toLowerCase();
}

function getApiEndpoint(): string {
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://cbcm-backend-1.onrender.com/api/v1"
  ).replace(/\/+$/, "");

  return baseUrl.endsWith("/api/v1")
    ? `${baseUrl}/auth/login`
    : `${baseUrl}/api/v1/auth/login`;
}

function getString(...values: unknown[]): string | undefined {
  return values.find(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
}

function getIdentifier(...values: unknown[]): string | undefined {
  const value = values.find(
    (candidate) =>
      (typeof candidate === "string" && candidate.trim().length > 0) ||
      (typeof candidate === "number" && Number.isFinite(candidate)),
  );
  return value == null ? undefined : String(value).trim();
}

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
        if (!credentials?.email || !credentials.password) {
          throw new Error("Invalid credentials");
        }

        try {
          const response = await fetch(getApiEndpoint(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email.trim(),
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const errorData: unknown = await response.json().catch(() => null);
            const errorRecord = isRecord(errorData) ? errorData : undefined;
            const nestedError = isRecord(errorRecord?.error)
              ? errorRecord.error
              : undefined;
            throw new Error(
              getString(errorRecord?.message, nestedError?.message) ||
                "Invalid credentials",
            );
          }

          const responseData: unknown = await response.json();
          if (!isRecord(responseData) || responseData.success === false) {
            throw new Error("Invalid credentials");
          }

          const payload = isRecord(responseData.data)
            ? responseData.data
            : responseData;
          const userData = isRecord(payload.user) ? payload.user : payload;
          const email = getString(userData.email);
          const accessToken = getString(
            payload.accessToken,
            payload.token,
            responseData.accessToken,
            responseData.token,
          );

          if (!email || !accessToken) {
            throw new Error("Invalid credentials");
          }

          if ("status" in userData && userData.status !== "active") {
            throw new Error("Invalid credentials");
          }

          const role = getString(userData.role);
          const firstName = getString(userData.firstName, userData.first_name);
          const lastName = getString(userData.lastName, userData.last_name);
          const name =
            getString(userData.name, userData.fullName, userData.full_name) ||
            [firstName, lastName].filter(Boolean).join(" ") ||
            email;
          const id =
            getIdentifier(
              userData.id,
              userData._id,
              userData.userId,
              userData.user_id,
            ) || email;
          const refreshToken = getString(
            payload.refreshToken,
            responseData.refreshToken,
          );

          return {
            id: String(id),
            name,
            email,
            role: normalizeRole(role),
            rawRole: role,
            accessToken,
            refreshToken,
            mustChangePassword:
              userData.mustChangePassword === true ||
              userData.must_change_password === true,
          };
        } catch (error) {
          console.error("CBCM login request failed:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = normalizeRole(user.role);
        token.rawRole = user.rawRole || user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.mustChangePassword = user.mustChangePassword;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || token.sub;
        session.user.role = token.role;
        session.user.rawRole = token.rawRole;
        session.user.mustChangePassword = token.mustChangePassword;
        session.user.accessToken = token.accessToken;
      }
      session.accessToken = token.accessToken;
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
