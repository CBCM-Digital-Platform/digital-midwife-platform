import { NavItem, UserRole } from "@/types/navigation";

export const adminNavLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Mentors", href: "/users?role=mentor", icon: "mentor" },
  { name: "Mentees", href: "/users?role=mentee", icon: "mentee" },
  { name: "Assignments", href: "/assignments", icon: "assignments" },
  { name: "Cycles", href: "/cycles", icon: "cycles" },
  { name: "Monitoring", href: "/activity-logs", icon: "monitoring" },
  { name: "Analytics", href: "/analytics", icon: "analytics" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export const mentorNavLinks: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Mentees", href: "/mentees", icon: "mentee" },
  { name: "Facilities", href: "/facilities", icon: "facilities" },
  { name: "Assignments", href: "/assignments", icon: "assignments" },
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
  { name: "Progress", href: "/progress", icon: "progress" },
  { name: "Clinical Assistant", href: "/ai-assistant", icon: "assistant" },
];

export function getNavLinksByRole(role: UserRole): NavItem[] {
  switch (role) {
    case "admin":
      return adminNavLinks;
    case "mentor":
      return mentorNavLinks;
    case "mentee":
    default:
      return menteeNavLinks;
  }
}
