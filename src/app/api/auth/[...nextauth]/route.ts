import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // 1. Define how users log in
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // This is where we intercept the login to mock the Node.js backend
      async authorize(credentials) {
        if (credentials?.email === "admin@test.com" && credentials?.password === "password") {
          return { id: "1", name: "System Admin", email: "admin@test.com", role: "admin" };
        }
        if (credentials?.email === "mentor@test.com" && credentials?.password === "password") {
          return { id: "2", name: "Test Mentor", email: "mentor@test.com", role: "mentor" };
        }
        if (credentials?.email === "mentee@test.com" && credentials?.password === "password") {
          return { id: "3", name: "Test Mentee", email: "mentee@test.com", role: "mentee" };
        }
        
        // Returning null tells NextAuth to reject the login
        return null;
      }
    })
  ],
  
  // 2. Pass the "role" from the backend to the frontend
  callbacks: {
    // Step A: Put the role into the secure JWT (the VIP wristband)
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    // Step B: Put the role into the session so your React components can read it
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },

  // 3. Tell NextAuth to use your custom UI instead of its default pages
  pages: {
    signIn: "/login",
  },
  
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };