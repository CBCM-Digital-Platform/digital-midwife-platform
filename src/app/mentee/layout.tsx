import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserRole } from "@/types/navigation";
import { DashboardShell } from "@/components/Layout/DashboardShell";

export default async function MenteeSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if ((session as any)?.error === "RefreshAccessTokenError") {
    redirect("/login?error=SessionExpired");
  }

  if ((session?.user as any)?.must_change_password) {
    redirect("/set-password");
  }

  const role: UserRole = (session?.user as { role?: UserRole })?.role || "mentee";

  return <DashboardShell role={role}>{children}</DashboardShell>;
}
