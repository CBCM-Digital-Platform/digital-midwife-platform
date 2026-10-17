import React from "react";
import {
  Users,
  Activity,
  Clock,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";
import { UsersTable } from "@/components/User/UsersTable";
import { AddUserDialog } from "@/components/User/AddUserDialog";
import { UserStatsCards, StatCardProps } from "@/components/User/UserStatsCards";
import { getMentors } from "@/services/users.service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function MentorsPage() {
  const session = await getServerSession(authOptions);
  const facilityId = (session?.user as any)?.facility_id ?? (session?.user as any)?.facilityId;
  const mentors = await getMentors(facilityId);

  const totalMentors = mentors.length;
  const activeCount = mentors.filter((m) => m.status === "active").length;
  const pendingCount = mentors.filter((m) => m.status === "pending").length;
  const operationalPercentage =
    totalMentors > 0
      ? `${((activeCount / totalMentors) * 100).toFixed(1)}% active`
      : "0% active";

  const stats: StatCardProps[] = [
    {
      title: "Total Mentors",
      value: totalMentors,
      trend: "↑8% this quarter",
      icon: Users,
      iconColor: "bg-blue-50 text-blue-600",
      accentBarColor: "bg-[#194611]",
      accentBarWidth: "w-24",
    },
    {
      title: "Active Mentors",
      value: activeCount,
      subtext: operationalPercentage,
      icon: Activity,
      iconColor: "bg-emerald-50 text-emerald-600",
      accentBarColor: "bg-emerald-600",
      accentBarWidth: "w-28",
    },
    {
      title: "Pending Mentors",
      value: pendingCount,
      badge: "Pending Review",
      badgeColor: "bg-amber-100 text-amber-800",
      icon: Clock,
      iconColor: "bg-amber-50 text-amber-600",
      accentBarColor: "bg-amber-500",
      accentBarWidth: "w-20",
    },
    {
      title: "Completion Rate",
      value: "94.6%",
      trend: "↑1.4%",
      trendIcon: true,
      icon: CheckCircle2,
      iconColor: "bg-purple-50 text-purple-600",
      progress: {
        percentage: 94.6,
        target: 92,
        barColor: "bg-[#194611]",
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. PAGE TITLE & HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mentor Management</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Oversee clinical preceptors, departmental mentorship assignments, and training statuses across regional facilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
          <button className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-xs cursor-pointer flex-1 sm:flex-initial">
            <UploadCloud className="h-4 w-4 text-gray-500" />
            <span>Batch Import</span>
          </button>

          <AddUserDialog role="mentor" facilityId={facilityId} />
        </div>
      </div>

      {/* 2. REUSABLE STAT SUMMARY CARDS */}
      <UserStatsCards stats={stats} />

      {/* 3. REUSABLE USERS TABLE (Role = "mentor") */}
      <UsersTable
        role="mentor"
        data={mentors}
        cohortLabel="Accredited Preceptor Registry • Cohort 2024-Q3"
        totalCohortCount={totalMentors}
      />
    </div>
  );
}
