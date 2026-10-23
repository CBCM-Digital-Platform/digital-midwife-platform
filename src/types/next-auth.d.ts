import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: "RefreshAccessTokenError" | string;
    user: {
      id?: string;
      role?: string;
      facility_id?: string | number;
      facilityId?: string | number;
      must_change_password?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: string;
    facility_id?: string | number;
    facilityId?: string | number;
    must_change_password?: boolean;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: "RefreshAccessTokenError" | string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    facility_id?: string | number;
    facilityId?: string | number;
    must_change_password?: boolean;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: "RefreshAccessTokenError" | string;
  }
}
