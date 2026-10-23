import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserRole } from "@/types/navigation";
import { DashboardShell } from "@/components/Layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // 1. Get the logged-in user session and role safely
  const session = await getServerSession(authOptions);

  // If no session exists, redirect cleanly to login without an expired banner
  if (!session) {
    redirect("/login");
  }

  // If token refresh failed, inform user that their session expired
  if ((session as any)?.error === "RefreshAccessTokenError") {
    redirect("/login?error=SessionExpired");
  }

  // If user must reset their first-time password, force redirect to /set-password
  if ((session?.user as any)?.must_change_password) {
    redirect("/set-password");
  }

  const role: UserRole = (session?.user as { role?: UserRole })?.role || "mentee";

  return (
    <DashboardShell role={role}>
      {children}
    </DashboardShell>
  );
}
