import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Header } from "@/components/Header/Header";
import { UserRole } from "@/types/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // 1. Get the logged-in user session and role safely
  const session = await getServerSession(authOptions);
  const role: UserRole = (session?.user as { role?: UserRole })?.role || "mentee";

  return (
    <div className="flex h-screen w-full bg-[#f9fafb] overflow-hidden">
      {/* Encapsulated Persistent Sidebar */}
      <Sidebar role={role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Encapsulated Header */}
        <Header role={role} />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}