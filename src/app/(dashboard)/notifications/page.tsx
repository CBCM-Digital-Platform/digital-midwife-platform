import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NotificationsView } from "@/components/Notifications";
import { getNotifications } from "@/services/notifications.service";

export const metadata = {
  title: "Notifications | Digital Midwife Platform",
  description: "Operational and governance notifications, clinical alerts, and milestone updates.",
};

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  const rawRole = ((session?.user as any)?.role || "").toLowerCase();

  const initialNotifications = await getNotifications(rawRole);

  return (
    <NotificationsView
      userRole={rawRole}
      initialNotifications={initialNotifications}
    />
  );
}
