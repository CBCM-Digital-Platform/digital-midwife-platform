import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      role?: string;
      rawRole?: string;
      accessToken?: string;
      mustChangePassword?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: string;
    rawRole?: string;
    accessToken?: string;
    refreshToken?: string;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    rawRole?: string;
    accessToken?: string;
    refreshToken?: string;
    mustChangePassword?: boolean;
  }
}
