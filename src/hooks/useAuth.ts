"use client";

import { useSession } from "next-auth/react";

export interface AuthUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  facility?: string;
  facilityId?: number | string;
  image?: string | null;
  [key: string]: any;
}

/**
 * Custom auth hook to inspect session state, current user, and normalized RBAC permissions.
 * Supports "system_admin", "super_admin", "facility_admin", "mentor", and "mentee".
 */
export function useAuth() {
  const { data: session, status, update } = useSession();
  const user = (session?.user as AuthUser) || null;
  const rawRole = String(user?.role || "").toLowerCase().trim().replace(/[-_\s]/g, "");

  const isSuperAdmin =
    rawRole === "systemadmin" ||
    rawRole === "superadmin" ||
    rawRole === "admin";

  const isFacilityAdmin = rawRole === "facilityadmin";
  const isMentor = rawRole === "mentor";
  const isMentee = rawRole === "mentee" || (!isSuperAdmin && !isFacilityAdmin && !isMentor);

  return {
    user,
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    role: user?.role,
    isSuperAdmin,
    isFacilityAdmin,
    isMentor,
    isMentee,
    update,
  };
}
