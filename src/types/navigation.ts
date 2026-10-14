export type UserRole = "admin" | "super_admin" | "facility_admin" | "mentor" | "mentee";

export function isAdminRole(role?: string): boolean {
  return role === "admin" || role === "super_admin" || role === "facility_admin";
}

export interface NavItem {
  name: string;
  href: string;
  icon?: string;
}

