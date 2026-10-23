import { NavItem, UserRole } from "@/types/navigation";

export const superAdminNavLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Facilities", href: "/facilities", icon: "facilities" },
  { name: "Facility Admins", href: "/facility-admins", icon: "users" },
  { name: "Thematic Areas", href: "/thematic-areas", icon: "thematic" },
  { name: "Reports", href: "/reports", icon: "reports" },
  { name: "Resources", href: "/resources", icon: "resources" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export const adminNavLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Mentors", href: "/mentors", icon: "mentor" },
  { name: "Mentees", href: "/mentees", icon: "mentee" },
  { name: "Assignments", href: "/assignments", icon: "assignments" },
  { name: "Cycles", href: "/cycles", icon: "cycles" },
  { name: "Reports", href: "/reports", icon: "reports" },
  { name: "Resources", href: "/resources", icon: "resources" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export const mentorNavLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Mentees", href: "/mentees", icon: "mentee" },
  { name: "Assignments", href: "/assignments", icon: "assignments" },
  { name: "Direct Messages", href: "/messaging", icon: "messages" },
  { name: "Resources", href: "/resources", icon: "resources" },
  { name: "Clinical Assistant", href: "/ai-assistant", icon: "assistant" },
  { name: "Sessions", href: "/sessions", icon: "sessions" },
];

export const menteeNavLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Learning", href: "/learning", icon: "learning" },
  { name: "Clinical Skills", href: "/clinical-skills", icon: "clinical-skills" },
  { name: "Mentors", href: "/mentors", icon: "mentor" },
  { name: "Profile", href: "/profile", icon: "profile" },
  { name: "Messages", href: "/messaging", icon: "messages" },
  { name: "Progress", href: "/progress", icon: "progress" },
  { name: "Clinical Assistant", href: "/ai-assistant", icon: "assistant" },
];

export function getNavLinksByRole(role?: UserRole | string): NavItem[] {
  const normalized = (role || "").toLowerCase().replace(/[-_\s]/g, "");
  if (
    normalized.includes("superadmin") ||
    role === "super_admin" ||
    normalized === "admin"
  ) {
    return superAdminNavLinks;
  }
  if (normalized.includes("facilityadmin") || role === "facility_admin") {
    return adminNavLinks;
  }
  if (normalized.includes("mentor")) {
    return mentorNavLinks;
  }
  return menteeNavLinks;
}
