export type UserRole = "MIDWIFE" | "SUPERVISOR" | "ADMIN" | "STUDENT";

export function hasRoleAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}
