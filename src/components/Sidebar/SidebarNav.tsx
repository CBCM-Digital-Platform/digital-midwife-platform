"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  ClipboardList,
  RefreshCw,
  Activity,
  BarChart3,
  Settings,
  BookOpen,
  Stethoscope,
  User,
  TrendingUp,
  Bot,
  Building2,
  Library,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { NavItem } from "@/types/navigation";

// Map string identifiers to Lucide components so data across the Server/Client boundary stays serializable
const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  mentor: UserCheck,
  mentee: GraduationCap,
  assignments: ClipboardList,
  cycles: RefreshCw,
  monitoring: Activity,
  analytics: BarChart3,
  settings: Settings,
  learning: BookOpen,
  "clinical-skills": Stethoscope,
  profile: User,
  progress: TrendingUp,
  assistant: Bot,
  facilities: Building2,
  resources: Library,
  sessions: Calendar,
};

interface SidebarNavProps {
  items: NavItem[];
}

function SidebarNavContent({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isItemActive = (href: string) => {
    const [targetPath, targetQuery] = href.split("?");

    // 1. Exact match for the root dashboard
    if (targetPath === "/dashboard") {
      return pathname === "/dashboard";
    }

    // 2. Path matching for subpages
    if (pathname === targetPath || pathname.startsWith(`${targetPath}/`)) {
      // If the link has query parameters (e.g. ?role=mentor), ensure search params match
      if (targetQuery) {
        const expectedParams = new URLSearchParams(targetQuery);
        for (const [key, expectedValue] of expectedParams.entries()) {
          if (searchParams.get(key) !== expectedValue) {
            return false;
          }
        }
        return true;
      }

      return true;
    }

    return false;
  };

  return (
    <nav className="mt-4 flex flex-col gap-1 px-4 text-sm font-medium text-gray-700">
      {items.map((item) => {
        const active = isItemActive(item.href);
        const IconComponent = item.icon ? iconMap[item.icon] : null;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              active
                ? "bg-[#FDD028] text-black font-semibold shadow-sm"
                : "text-gray-700 hover:bg-gray-100 hover:text-black"
            }`}
          >
            {IconComponent && (
              <IconComponent
                className={`h-4 w-4 ${
                  active ? "text-black" : "text-gray-500"
                }`}
              />
            )}
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarNav({ items }: SidebarNavProps) {
  return (
    <Suspense
      fallback={
        <nav className="mt-4 flex flex-col gap-1 px-4 text-sm font-medium text-gray-400">
          {items.map((item) => (
            <div
              key={item.href}
              className="h-10 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </nav>
      }
    >
      <SidebarNavContent items={items} />
    </Suspense>
  );
}

