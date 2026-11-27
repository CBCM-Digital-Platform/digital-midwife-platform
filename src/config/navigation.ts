import { NavItem, UserRole } from "@/types/navigation";
import newsManagement from "@/lib/news-management";

export const superAdminNavLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Facilities", href: "/facilities", icon: "facilities" },
  { name: "Facility Admins", href: "/facility-admins", icon: "users" },
  { name: "Thematic Areas", href: "/thematic-areas", icon: "thematic" },
  { name: "Passing Rules", href: "/assessment-passing-rules", icon: "passing-rules" },
  { name: "Reports", href: "/reports", icon: "reports" },
  { name: "Landing Page", href: "/super-admin/landing-page", icon: "landing-page" },
  { name: "Learning Modules", href: "/learning/modules", icon: "learning" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export const adminNavLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Mentors", href: "/mentors", icon: "mentor" },
  { name: "Mentees", href: "/mentees", icon: "mentee" },
  { name: "Assignments", href: "/assignments", icon: "assignments" },
  { name: "Cycles", href: "/cycles", icon: "cycles" },
  { name: "Passing Rules", href: "/assessment-passing-rules", icon: "passing-rules" },
  { name: "Reports", href: "/reports", icon: "reports" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export const mentorNavLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Mentees", href: "/my-mentees", icon: "mentee" },
  { name: "Assessments", href: "/my-assessments", icon: "assessments" },
  { name: "Learning Modules", href: "/learning/modules", icon: "learning" },
  { name: "Clinical Assistant", href: "/ai-assistant", icon: "assistant" },
  { name: "Sessions", href: "/sessions", icon: "sessions" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export const menteeNavLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Learning Modules", href: "/learning/modules", icon: "learning" },
  { name: "Clinical Skills", href: "/clinical-skills", icon: "clinical-skills" },
  { name: "My Mentor", href: "/mentee/mentors", icon: "mentor" },
  { name: "Sessions", href: "/mentee/sessions", icon: "sessions" },
  { name: "Messages", href: "/messaging", icon: "messages" },
  { name: "Progress", href: "/progress", icon: "progress" },
  { name: "Clinical Assistant", href: "/ai-assistant", icon: "assistant" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export function getNavLinksByRole(role?: UserRole | string): NavItem[] {
  const normalized = (role || "").toLowerCase().replace(/[-_\s]/g, "");
  if (newsManagement.isNewsAdminRole(role)) {
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
