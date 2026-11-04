"use client";

import Link from "next/link";
import { Bell, AlertCircle, Menu, MessageSquare } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

interface HeaderProps {
  role?: string;
  onToggleMobileMenu?: () => void;
}

export function Header({ role, onToggleMobileMenu }: HeaderProps) {
  const isMentor = (role || "").toLowerCase().includes("mentor");
  const { unreadCount } = useNotifications(role);

  return (
    <header className="h-16 sm:h-20 bg-[#f9fafb] flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Mobile menu trigger button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-[#194611] hover:bg-gray-100 rounded-lg transition cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {isMentor && (
          <div className="hidden sm:flex items-center">
            <Link
              href="/messaging"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#194611]/20 bg-[#194611]/5 hover:bg-[#194611]/10 text-[#194611] text-xs sm:text-sm font-semibold transition-colors duration-150 shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#194611]/30"
              title="Open Direct Messages"
            >
              <MessageSquare className="w-4 h-4 text-[#194611]" />
              <span>Direct Messages</span>
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* Notification Bell with live unread badge */}
        <Link
          href="/notifications"
          className="relative p-1.5 text-gray-600 hover:text-[#194611] hover:bg-gray-100 rounded-lg transition cursor-pointer"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#194611] text-[10px] font-bold text-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <button className="flex items-center gap-1.5 sm:gap-2 bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-red-700 transition cursor-pointer shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Emergency Support</span>
          <span className="sm:hidden">Emergency</span>
        </button>
      </div>
    </header>
  );
}
