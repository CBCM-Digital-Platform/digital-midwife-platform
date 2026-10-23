"use client";

import { useState, useEffect, useCallback } from "react";
import type { AppNotification } from "@/types/notification";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification as apiDeleteNotification,
} from "@/services/notifications.service";

export function useNotifications(userRole?: string, initialData?: AppNotification[]) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData || initialData.length === 0);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(userRole);
      setNotifications(data);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await markNotificationAsRead(id);
  };

  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsAsRead(userRole);
  };

  const deleteNotification = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await apiDeleteNotification(id);
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
