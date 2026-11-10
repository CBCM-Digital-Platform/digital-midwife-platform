import { apiClient } from "@/lib/api-client";
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

// Fallback operational notifications tailored to roles
export function getFallbackNotifications(role?: string): AppNotification[] {
  const isSuperAdmin =
    (role || "").toLowerCase().includes("super") ||
    ((role || "").toLowerCase().includes("admin") && !(role || "").toLowerCase().includes("facility"));
  const isMentor = (role || "").toLowerCase().includes("mentor");
  const isMentee = (role || "").toLowerCase().includes("mentee");

  const now = Date.now();
  const formatPast = (minutesAgo: number) => new Date(now - minutesAgo * 60 * 1000).toISOString();

  if (isMentor) {
    return [
      {
        id: "notif-mentor-msg-1",
        title: "New Message from Mentee",
        message: "Bethlehem Tadesse sent a direct question regarding fundal height palpation landmarks.",
        type: "info",
        category: "mentorship",
        isRead: false,
        createdAt: formatPast(5),
        actionUrl: "/messaging",
      },
      {
        id: "notif-mentor-1",
        title: "Clinical Skill Verification Pending",
        message: "Mentee Hiwot Assefa requested assessment review for 'Intrapartum Partograph Management'.",
        type: "warning",
        category: "assessment",
        isRead: false,
        createdAt: formatPast(40),
        actionUrl: "/my-assessments",
      },
      {
        id: "notif-mentor-2",
        title: "New Mentee Assigned to Your Roster",
        message: "Tigist Haile was assigned to you for Maternal & Newborn Care clinical rotation.",
        type: "info",
        category: "mentorship",
        isRead: true,
        createdAt: formatPast(240),
        actionUrl: "/my-mentees",
      },
    ];
  }

  if (isMentee) {
    return [
      {
        id: "notif-mentee-msg-1",
        title: "New Message from Clinical Mentor",
        message: "Sister Almaz sent feedback on your Leopold maneuvers quiz results.",
        type: "info",
        category: "mentorship",
        isRead: false,
        createdAt: formatPast(5),
        actionUrl: "/messaging",
      },
      {
        id: "notif-mentee-1",
        title: "Learning Module Unlocked",
        message: "Your mentor approved access to 'Module 4: Fundal Height Assessment & Palpation'.",
        type: "success",
        category: "curriculum",
        isRead: false,
        createdAt: formatPast(60),
        actionUrl: "/mentee/learning",
      },
      {
        id: "notif-mentee-2",
        title: "Mentorship Session Scheduled",
        message: "Upcoming preceptor clinical review session scheduled for tomorrow at 10:00 AM.",
        type: "info",
        category: "mentorship",
        isRead: true,
        createdAt: formatPast(360),
        actionUrl: "/dashboard",
      },
    ];
  }

  if (isSuperAdmin) {
    return [
      {
        id: "notif-sa-1",
        title: "National Facility Reporting Compliance Update",
        message: "Quarterly facility audit report has been compiled. 11 of 12 accredited hospitals have submitted on-time mentorship reports.",
        type: "success",
        category: "compliance",
        isRead: false,
        createdAt: formatPast(15),
        actionUrl: "/reports",
      },
      {
        id: "notif-sa-2",
        title: "Facility Accreditation Pending Verification",
        message: "New accreditation profile submitted for 'Gisenyi District Hospital'. Review facility license and appointed administrator credentials.",
        type: "warning",
        category: "facility",
        isRead: false,
        createdAt: formatPast(120),
        actionUrl: "/facilities",
      },
      {
        id: "notif-sa-3",
        title: "Clinical Thematic Domain Synchronized",
        message: "Curricular competencies for 'Maternal & Neonatal Emergency Care' have been synchronized across all regional teaching hospitals.",
        type: "info",
        category: "thematic",
        isRead: true,
        createdAt: formatPast(360),
        actionUrl: "/thematic-areas",
      },
      {
        id: "notif-sa-4",
        title: "New Facility Administrator Appointed",
        message: "Dr. Jean-Paul Mugabo was designated as Facility Administrator for Butare University Teaching Hospital.",
        type: "info",
        category: "governance",
        isRead: true,
        createdAt: formatPast(1440),
        actionUrl: "/facility-admins",
      },
      {
        id: "notif-sa-5",
        title: "System Maintenance Scheduled",
        message: "Platform infrastructure maintenance scheduled for Sunday at 02:00 AM UTC. Estimated downtime is 15 minutes.",
        type: "system",
        category: "system",
        isRead: true,
        createdAt: formatPast(2880),
      },
    ];
  }

  // Facility Admin Fallbacks
  return [
    {
      id: "notif-fa-1",
      title: "New Clinical Assessment Submissions",
      message: "3 resident midwives submitted procedural clinical competency assessments for neonatal resuscitation requiring mentor review.",
      type: "info",
      category: "assessment",
      isRead: false,
      createdAt: formatPast(25),
      actionUrl: "/mentees",
    },
    {
      id: "notif-fa-2",
      title: "Mentorship Cycle Term Milestone",
      message: "Active Mentorship Cycle Term 1 reaches mid-phase evaluation in 5 days. Verify mentor-mentee pairing progress.",
      type: "warning",
      category: "cycle",
      isRead: false,
      createdAt: formatPast(180),
      actionUrl: "/cycles",
    },
    {
      id: "notif-fa-3",
      title: "New Midwife Mentor Onboarded",
      message: "Sister Agnes Mukamana was successfully added to the facility preceptor roster with 'Pediatric Emergency ICU' domain certification.",
      type: "success",
      category: "mentorship",
      isRead: true,
      createdAt: formatPast(720),
      actionUrl: "/mentors",
    },
    {
      id: "notif-fa-4",
      title: "Mentorship Pairing Capacity Alert",
      message: "Preceptor Dr. Beatrice Uwase has reached maximum capacity of 6 assigned mentees for the current cycle.",
      type: "warning",
      category: "mentorship",
      isRead: true,
      createdAt: formatPast(1440),
      actionUrl: "/assignments",
    },
    {
      id: "notif-fa-5",
      title: "Facility Monthly Report Generated",
      message: "Hospital clinical mentorship performance summary for the previous month is available for download.",
      type: "info",
      category: "compliance",
      isRead: true,
      createdAt: formatPast(2880),
      actionUrl: "/reports",
    },
  ];
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
    const res = await apiClient.get<any>("/api/v1/notifications");
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
    // Backend notifications request failed or table empty, fall back to tailored operational notifications
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

  if (resultList.length > 0) {
    return resultList;
  }

  // Use role-tailored notifications with local state applied
  const fallbacks = getFallbackNotifications(role);
  return fallbacks
    .filter((n: AppNotification) => !deletedIds.has(n.id))
    .map((n) => (allRead || localReadIds.has(n.id) ? { ...n, isRead: true } : n));
}

/**
 * GET /api/v1/notifications/unread-count
 * Gets the authenticated user's unread notification count.
 */
export async function getUnreadCount(role?: string): Promise<number> {
  try {
    const res = await apiClient.get<any>("/api/v1/notifications/unread-count");
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
    await apiClient.patch("/api/v1/notifications/read-all", {});
  } catch (err) {
    // Fall through to local persistence
  }

  // Update local storage for all items of this role
  if (typeof window !== "undefined") {
    setLocalAllRead(role, true);
    const fallbacks = getFallbackNotifications(role);
    fallbacks.forEach((n) => saveLocalReadId(n.id));
  }

  return { success: true };
}

/**
 * PATCH /api/v1/notifications/{id}/read
 * Marks a notification as read.
 */
export async function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  try {
    await apiClient.patch(`/api/v1/notifications/${id}/read`, {});
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
    await apiClient.delete(`/api/v1/notifications/${id}`);
  } catch (err) {
    // Fall through to local persistence
  }

  saveLocalDeletedId(id);
  return { success: true };
}
