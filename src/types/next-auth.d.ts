import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      role?: string;
      mustChangePassword?: boolean;
    } & DefaultSession["user"];
  }
}
