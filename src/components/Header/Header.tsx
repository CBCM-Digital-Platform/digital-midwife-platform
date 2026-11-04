"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertCircle,
  Menu,
  MessageSquare,
  CheckCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { AppNotification } from "@/types/notification";

interface HeaderProps {
  role?: string;
  onToggleMobileMenu?: () => void;
}

function formatRelativeTime(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export function Header({ role, onToggleMobileMenu }: HeaderProps) {
  const router = useRouter();
  const isMentor = (role || "").toLowerCase().includes("mentor");
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(role);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.isRead) {
      void markAsRead(n.id);
    }
    setIsOpen(false);

    if (n.actionUrl) {
      router.push(n.actionUrl);
    } else if (n.category === "mentorship" || (n.type as string) === "message_received" || n.title.toLowerCase().includes("message")) {
      router.push("/messaging");
    } else {
      router.push("/notifications");
    }
  };

  const getIcon = (n: AppNotification) => {
    const isMsg =
      (n.actionUrl && n.actionUrl.includes("messaging")) ||
      n.category === "mentorship" && (n.title.toLowerCase().includes("message") || n.message.toLowerCase().includes("message"));

    if (isMsg) {
      return <MessageSquare className="w-3.5 h-3.5 text-[#194611]" />;
    }
    switch (n.type) {
      case "success":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case "alert":
        return <AlertCircle className="w-3.5 h-3.5 text-red-600" />;
      case "system":
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />;
      case "info":
      default:
        return <Info className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  return (
    <header className="h-16 sm:h-20 bg-[#f9fafb] flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-gray-100 shrink-0 relative">
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
        {/* Notification Bell with live unread badge and Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="relative p-2 text-gray-600 hover:text-[#194611] hover:bg-gray-100 rounded-lg transition cursor-pointer"
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
            aria-expanded={isOpen}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#194611] text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Quick Notification Dropdown Popover */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-gray-200/90 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#fafbf9]">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#194611] text-[10px] font-bold text-white">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllAsRead()}
                    className="inline-flex items-center gap-1 text-xs text-[#194611] hover:underline font-semibold"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {notifications.length > 0 ? (
                  notifications.slice(0, 6).map((n) => {
                    const isMsg =
                      (n.actionUrl && n.actionUrl.includes("messaging")) ||
                      n.category === "mentorship" && (n.title.toLowerCase().includes("message") || n.message.toLowerCase().includes("message"));

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-gray-50/80 ${
                          !n.isRead ? "bg-emerald-50/30" : "bg-white"
                        }`}
                      >
                        <div className="h-8 w-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center shrink-0 mt-0.5">
                          {getIcon(n)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p
                              className={`text-xs truncate ${
                                !n.isRead ? "font-bold text-gray-900" : "font-medium text-gray-800"
                              }`}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          {isMsg && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-[#194611]">
                              <span>Open in Chat</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-[#194611] shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs text-gray-400">
                    No notifications yet.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t border-gray-100 bg-[#fafbf9] text-center">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#194611] hover:underline py-1 w-full"
                >
                  <span>View all notifications</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <button className="flex items-center gap-1.5 sm:gap-2 bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-red-700 transition cursor-pointer shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Emergency Support</span>
          <span className="sm:hidden">Emergency</span>
        </button>
      </div>
    </header>
  );
}
