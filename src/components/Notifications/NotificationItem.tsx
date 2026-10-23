"use client";

import React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  ArrowRight,
  Check,
  Trash2,
  Layers,
  Building2,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import type { AppNotification } from "@/types/notification";

interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatRelativeTime(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;

    return new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const { id, title, message, type, category, isRead, createdAt, actionUrl } = notification;

  // Icon and theme based on type
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "alert":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "system":
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case "success":
        return "bg-emerald-50 border-emerald-200";
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "alert":
        return "bg-red-50 border-red-200";
      case "system":
        return "bg-purple-50 border-purple-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div
      className={`group relative p-4 sm:p-5 rounded-xl border transition-all duration-150 ${
        isRead
          ? "bg-white border-gray-200/80 hover:border-gray-300"
          : "bg-emerald-50/20 border-emerald-200 shadow-2xs hover:border-emerald-300"
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Status / Category Icon */}
        <div
          className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getIconBg()}`}
        >
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <h3
                className={`text-sm leading-snug ${
                  isRead ? "font-semibold text-gray-800" : "font-bold text-gray-900"
                }`}
              >
                {title}
              </h3>
              {!isRead && (
                <span className="h-2 w-2 rounded-full bg-[#194611] shrink-0" title="Unread" />
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(createdAt)}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">{message}</p>

          {/* Bottom Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2.5 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="capitalize text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                {category}
              </span>
              {actionUrl && (
                <Link
                  href={actionUrl}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#194611] hover:underline cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              {!isRead && (
                <button
                  type="button"
                  onClick={() => onMarkAsRead(id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 shadow-2xs transition cursor-pointer"
                  title="Mark as read"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Mark read</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onDelete(id)}
                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                title="Delete notification"
                aria-label="Delete notification"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
