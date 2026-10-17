import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import { getNavLinksByRole } from "@/config/navigation";
import { UserRole, isAdminRole } from "@/types/navigation";

interface SidebarProps {
  role: string;
  onNavigate?: () => void;
}

export function Sidebar({ role, onNavigate }: SidebarProps) {
  const navLinks = getNavLinksByRole(role);
  const isAdmin = isAdminRole(role);
  const isMentor = (role || "").toLowerCase().includes("mentor");

  return (
    <aside className="w-64 max-w-full bg-white border-r border-gray-200 flex flex-col justify-between h-full shrink-0">
      <div>
        {/* Logo Section */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-center">
          <Image
            src="/logo.png"
            alt="Center for Adolescent Girls Health"
            width={180}
            height={60}
            className="object-contain max-h-12 w-auto"
            unoptimized
          />
        </div>

        {/* Dynamic Navigation Links */}
        <SidebarNav items={navLinks} onNavigate={onNavigate} />
      </div>

      {/* Bottom Sidebar Actions */}
      <div className="p-4 border-t border-gray-100 flex flex-col gap-1 text-sm text-gray-600">
        {isMentor && (
          <Link
            href="/support"
            onClick={onNavigate}
            className="px-4 py-2.5 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Support
          </Link>
        )}
        {!isAdmin && (
          <Link
            href="/settings"
            onClick={onNavigate}
            className="px-4 py-2.5 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Settings
          </Link>
        )}
        <Link
          href="/api/auth/signout"
          onClick={onNavigate}
          className="flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}
