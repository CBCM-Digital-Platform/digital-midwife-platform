import React from "react";
import {
  Users,
  Activity,
  Clock,
  Award,
  UploadCloud,
} from "lucide-react";
import { UsersTable } from "@/components/User/UsersTable";
import { AddUserDialog } from "@/components/User/AddUserDialog";
import { UserStatsCards, StatCardProps } from "@/components/User/UserStatsCards";
import { getMentees } from "@/services/users.service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function MenteesPage() {
  const session = await getServerSession(authOptions);
  const facilityId = (session?.user as any)?.facility_id ?? (session?.user as any)?.facilityId;
  const mentees = await getMentees(facilityId);

  const totalMentees = mentees.length;
  const activeCount = mentees.filter((m) => m.status === "active").length;
  const pendingCount = mentees.filter((m) => m.status === "pending" || m.status === "pending_start").length;
  const operationalPercentage =
    totalMentees > 0
      ? `${((activeCount / totalMentees) * 100).toFixed(1)}% in rotation`
      : "0% in rotation";
  const avgKnowledgeMastery =
    totalMentees > 0
      ? (
          mentees.reduce((acc, m) => acc + (m.knowledgeScore || 0), 0) /
          totalMentees
        ).toFixed(1)
      : "84.2";

  const stats: StatCardProps[] = [
    {
      title: "Total Mentees",
      value: totalMentees,
      trend: "↑8% this term",
      icon: Users,
      iconColor: "bg-blue-50 text-blue-600",
      accentBarColor: "bg-[#194611]",
      accentBarWidth: "w-24",
    },
    {
      title: "Active Mentees",
      value: activeCount,
      subtext: operationalPercentage,
      icon: Activity,
      iconColor: "bg-emerald-50 text-emerald-600",
      accentBarColor: "bg-emerald-600",
      accentBarWidth: "w-28",
    },
    {
      title: "Pending Mentees",
      value: pendingCount,
      badge: "Awaiting Assignment",
      badgeColor: "bg-amber-100 text-amber-800",
      icon: Clock,
      iconColor: "bg-amber-50 text-amber-600",
      accentBarColor: "bg-amber-500",
      accentBarWidth: "w-20",
    },
    {
      title: "Average Score",
      value: `${avgKnowledgeMastery}%`,
      trend: "+2.4% vs cohort",
      icon: Award,
      iconColor: "bg-purple-50 text-purple-600",
      accentBarColor: "bg-purple-600",
      accentBarWidth: "w-24",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. PAGE TITLE & HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mentee Management</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Oversee clinical mentees, track progress, and manage facility assignments across regional facilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
          <button className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-xs cursor-pointer flex-1 sm:flex-initial">
            <UploadCloud className="h-4 w-4 text-gray-500" />
            <span>Batch Import</span>
          </button>

          <AddUserDialog role="mentee" facilityId={facilityId} />
        </div>
      </div>

      {/* 2. REUSABLE STAT SUMMARY CARDS */}
      <UserStatsCards stats={stats} />

      {/* 3. REUSABLE USERS TABLE (Role = "mentee") */}
      <UsersTable
        role="mentee"
        data={mentees}
        cohortLabel="Central Academic Registry Cohort 2024-Q3"
        totalCohortCount={totalMentees}
      />
    </div>
  );
}
