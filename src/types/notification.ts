export type NotificationType = "info" | "success" | "warning" | "alert" | "system";

export type NotificationCategory =
  | "governance"
  | "facility"
  | "mentorship"
  | "curriculum"
  | "assessment"
  | "cycle"
  | "security"
  | "compliance"
  | "thematic"
  | "system"
  | "general"
  | (string & {});

export interface AppNotification {
  id: string;
  userId?: string | number;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
  actionUrl?: string;
  data?: Record<string, any>;
}

export interface NotificationFilterState {
  status: "all" | "unread" | "read";
  category: string;
  search: string;
}
