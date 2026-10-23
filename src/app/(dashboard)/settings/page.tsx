import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SettingsView from "@/components/Settings/SettingsView";
import { SuperAdminSettingsView } from "@/components/SuperAdmin";
import { getProfileData } from "@/services/settings-data.service";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const rawRole = ((session?.user as any)?.role || "").toLowerCase();
  const isSuperAdmin =
    rawRole === "super_admin" ||
    (rawRole.includes("admin") && !rawRole.includes("facility"));

  const data = await getProfileData();

  // 1. SUPER ADMIN TAILORED SETTINGS VIEW
  if (isSuperAdmin) {
    return (
      <SuperAdminSettingsView
        data={data}
        userName={session?.user?.name || "System Administrator"}
        userEmail={session?.user?.email || ""}
      />
    );
  }

  // 2. FACILITY ADMIN / CLINICAL SETTINGS VIEW (UNALTERED)
  return <SettingsView data={data} />;
}
