"use client";

import React, { useState, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  Filter,
  Search,
  RotateCcw,
  ShieldCheck,
  Building2,
  Inbox,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import type { AppNotification } from "@/types/notification";

interface NotificationsViewProps {
  userRole?: string;
  initialNotifications?: AppNotification[];
}

export function NotificationsView({
  userRole,
  initialNotifications,
}: NotificationsViewProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications(userRole, initialNotifications);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const isSuperAdmin =
    (userRole || "").toLowerCase().includes("super") ||
    ((userRole || "").toLowerCase().includes("admin") && !(userRole || "").toLowerCase().includes("facility"));

  // Derive unique categories from existing notifications
  const categories = useMemo(() => {
    const set = new Set<string>();
    notifications.forEach((n) => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set).sort();
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Status filter
      if (statusFilter === "unread" && notif.isRead) return false;
      if (statusFilter === "read" && !notif.isRead) return false;

      // Category filter
      if (categoryFilter !== "all" && notif.category !== categoryFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = notif.title.toLowerCase().includes(q);
        const matchesMessage = notif.message.toLowerCase().includes(q);
        const matchesCat = notif.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMessage && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [notifications, statusFilter, categoryFilter, searchQuery]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setFeedbackMessage("All notifications marked as read.");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const readCount = notifications.length - unreadCount;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-[#194611] border border-emerald-200">
              {isSuperAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  National Governance Notifications
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5" />
                  Facility Mentorship Operations
                </>
              )}
            </span>
            <span className="text-xs text-gray-400">• Real-Time Operational Alerts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#194611] tracking-tight">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            {isSuperAdmin
              ? "Review cross-facility accreditation requests, national reporting deadlines, thematic curriculum updates, and administrative alerts."
              : "Review clinical competency assessments, preceptor pairing updates, mentorship cycle terms, and facility milestone notifications."}
          </p>
        </div>

        {/* Global Notification Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={refresh}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition cursor-pointer shadow-2xs"
            title="Refresh notifications"
            aria-label="Refresh notifications"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#194611] hover:bg-[#12330c] text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by title, details, or category..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
            />
          </div>

          {/* Reset Filters */}
          {(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition cursor-pointer self-end sm:self-center"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Status & Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "all"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>All</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700">
                {notifications.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("unread")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "unread"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#194611] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("read")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "read"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Read</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700">
                {readCount}
              </span>
            </button>
          </div>

          {/* Category Dropdown Filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 3. NOTIFICATIONS LIST CONTAINER */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#194611] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        ) : (
          /* Empty State */
          <div className="p-12 text-center bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto border border-gray-100">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                {statusFilter === "unread"
                  ? "All caught up!"
                  : "No notifications found"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {statusFilter === "unread"
                  ? "You have zero unread notifications. New updates and alerts will appear here."
                  : "No notifications match the selected search or category filters."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
