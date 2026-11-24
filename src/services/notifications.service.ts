import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type {
  AppNotification,
  NotificationCategory,
  NotificationType,
} from "@/types/notification";

const STORAGE_KEY_READ_IDS = "cbcm_notifications_read_ids";
const STORAGE_KEY_DELETED_IDS = "cbcm_notifications_deleted_ids";
const STORAGE_KEY_ALL_READ = "cbcm_notifications_all_read";

export function getLocalReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ_IDS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveLocalReadId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getLocalReadIds();
    ids.add(String(id));
    localStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage errors
  }
}

export function getLocalDeletedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_IDS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveLocalDeletedId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getLocalDeletedIds();
    ids.add(String(id));
    localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage errors
  }
}

export function isLocalAllRead(role?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`${STORAGE_KEY_ALL_READ}_${role || "default"}`) === "true";
  } catch {
    return false;
  }
}

export function setLocalAllRead(role?: string, value: boolean = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_ALL_READ}_${role || "default"}`, String(value));
  } catch {
    // Ignore
  }
}

function normalizeNotification(raw: any, role?: string): AppNotification {
  const id = String(raw?.id ?? raw?._id ?? "");
  const isReadRaw =
    raw?.is_read ?? raw?.isRead ?? Boolean(raw?.read_at ?? raw?.readAt);

  const localReadIds = getLocalReadIds();
  const allRead = isLocalAllRead(role);
  const isRead = allRead || localReadIds.has(id) || Boolean(isReadRaw);

  const type = (raw?.type ?? raw?.notification_type ?? "info").toLowerCase() as NotificationType;
  const category = (raw?.category ?? raw?.entity_type ?? "general").toLowerCase() as NotificationCategory;

  let actionUrl = raw?.action_url ?? raw?.actionUrl ?? raw?.link ?? undefined;

  // Auto-resolve actionUrl from backend reference fields or notification type
  if (!actionUrl) {
    const refType = String(raw?.referenceType ?? raw?.reference_type ?? "").toLowerCase();
    const refId =
      raw?.referenceId ??
      raw?.reference_id ??
      raw?.data?.conversationId ??
      raw?.data?.conversation_id ??
      raw?.data?.userId ??
      raw?.data?.senderId;
    const rawType = String(raw?.type ?? raw?.notification_type ?? "").toLowerCase();

    if ((refType === "conversation" || refType === "message") && refId) {
      actionUrl = `/messaging?conversationId=${refId}`;
    } else if (refType === "user" && refId) {
      actionUrl = `/messaging?userId=${refId}`;
    } else if (rawType === "message_received" || rawType.includes("message")) {
      actionUrl = refId ? `/messaging?conversationId=${refId}` : "/messaging";
    } else if (rawType.includes("assessment")) {
      actionUrl = refId ? `/my-assessments/${refId}` : "/my-assessments";
    } else if (rawType.includes("module") || rawType.includes("learning")) {
      actionUrl = refId ? `/learning/modules/${refId}` : "/learning";
    }
  }

  const title =
    raw?.title ??
    raw?.subject ??
    (type.includes("message") ? "New message" : "Notification");

  const message = raw?.message ?? raw?.body ?? raw?.content ?? "";

  return {
    id,
    userId: raw?.user_id ?? raw?.userId,
    title,
    message,
    type: ["info", "success", "warning", "alert", "system"].includes(type) ? type : "info",
    category: category || (type.includes("message") ? "mentorship" : "general"),
    isRead,
    createdAt: raw?.created_at ?? raw?.createdAt ?? new Date().toISOString(),
    readAt: raw?.read_at ?? raw?.readAt ?? null,
    actionUrl,
    data: raw?.data,
  };
}

/**
 * GET /api/v1/notifications
 * Lists the authenticated user's notifications.
 */
export async function getNotifications(role?: string): Promise<AppNotification[]> {
  const resultList: AppNotification[] = [];
  const deletedIds = getLocalDeletedIds();
  const localReadIds = getLocalReadIds();
  const allRead = isLocalAllRead(role);

  try {
    const res = await apiClient.get<any>(ENDPOINTS.NOTIFICATIONS.BASE);
    const rawList = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.notifications)
      ? res.notifications
      : Array.isArray(res)
      ? res
      : [];

    if (rawList.length > 0) {
      for (const item of rawList) {
        const n = normalizeNotification(item, role);
        if (!deletedIds.has(n.id)) {
          resultList.push(n);
        }
      }
    }
  } catch (err) {
    // Backend notifications request failed or table empty
  }

  // Also check active conversations with unread messages to guarantee message notifications appear
  try {
    const { getConversations } = await import("@/services/messages.service");
    const conversations = await getConversations().catch(() => []);
    for (const conv of conversations) {
      if ((conv.unreadCount ?? 0) > 0) {
        const notifId = `msg-conv-${conv.id}`;
        if (
          !deletedIds.has(notifId) &&
          !resultList.some((n) => n.actionUrl?.includes(`conversationId=${conv.id}`))
        ) {
          const partner = conv.participants?.find((p) => p.role !== role) || conv.participants?.[0];
          const name = partner?.fullName || "Mentorship Partner";
          const isRead = allRead || localReadIds.has(notifId);
          resultList.unshift({
            id: notifId,
            title: `New message from ${name}`,
            message: conv.lastMessage?.content || "You received a new direct message.",
            type: "info",
            category: "mentorship",
            isRead,
            createdAt: conv.lastMessageAt || conv.updatedAt || new Date().toISOString(),
            actionUrl: `/messaging?conversationId=${conv.id}&name=${encodeURIComponent(name)}`,
          });
        }
      }
    }
  } catch {
    // Non-critical, ignore
  }

  return resultList;
}

/**
 * GET /api/v1/notifications/unread-count
 * Gets the authenticated user's unread notification count.
 */
export async function getUnreadCount(role?: string): Promise<number> {
  try {
    const res = await apiClient.get<any>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    const count =
      res?.data?.unread_count ??
      res?.data?.count ??
      res?.unread_count ??
      res?.unreadCount ??
      res?.count;

    if (typeof count === "number") {
      return count;
    }
  } catch {
    // Fall back to counting unread from getNotifications
  }

  const list = await getNotifications(role);
  return list.filter((n) => !n.isRead).length;
}

/**
 * PATCH /api/v1/notifications/read-all
 * Marks all of the authenticated user's notifications as read.
 */
export async function markAllNotificationsAsRead(role?: string): Promise<{ success: boolean }> {
  try {
    await apiClient.patch(ENDPOINTS.NOTIFICATIONS.READ_ALL, {});
  } catch (err) {
    // Fall through to local persistence
  }

  // Update local storage for this role
  if (typeof window !== "undefined") {
    setLocalAllRead(role, true);
  }

  return { success: true };
}

/**
 * PATCH /api/v1/notifications/{id}/read
 * Marks a notification as read.
 */
export async function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  try {
    await apiClient.patch(ENDPOINTS.NOTIFICATIONS.READ(id), {});
  } catch (err) {
    // Fall through to local persistence
  }

  saveLocalReadId(id);
  return { success: true };
}

/**
 * DELETE /api/v1/notifications/{id}
 * Deletes a notification.
 */
export async function deleteNotification(id: string): Promise<{ success: boolean }> {
  try {
    await apiClient.delete(ENDPOINTS.NOTIFICATIONS.DETAIL(id));
  } catch (err) {
    // Fall through to local persistence
  }

  saveLocalDeletedId(id);
  return { success: true };
}
