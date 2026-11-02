"use client";

import React, { useState, useEffect } from "react";
import { getMyMentees } from "@/services/my-mentees.service";
import type { MentorStats } from "@/types/mentor-dashboard";
import Link from "next/link";
import {
  ClipboardList,
  Calendar,
  GraduationCap,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MentorDashboardData } from "@/types/mentor-dashboard";
import { MentorThemeProvider, useMentorTheme } from "./MentorThemeContext";
import { MentorStatCard } from "./MentorStatCard";
import { RecentActivityCard } from "./RecentActivityCard";
import { TodaysScheduleCard } from "./TodaysScheduleCard";

interface MentorDashboardClientProps {
  displayName: string;
  data: MentorDashboardData;
}

function MentorDashboardInner({
  displayName,
  data,
}: {
  displayName: string;
  data: MentorDashboardData;
}) {
  const { config } = useMentorTheme();
  const { activity, scheduleDate, schedule } = data;
  const [statsState, setStatsState] = useState<MentorStats>(data.stats);

  // Synchronize assigned mentees count on client mount from localStorage / live client fetch
  useEffect(() => {
    let isMounted = true;
    getMyMentees().then((clientMentees) => {
      if (!isMounted) return;
      if (clientMentees.length > 0) {
        setStatsState((prev) => ({
          ...prev,
          totalMentees: clientMentees.length,
          menteesTrend: `${clientMentees.length} active ${clientMentees.length === 1 ? "mentee" : "mentees"}`,
        }));
      }
    }).catch(() => null);

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className={cn(
        "min-h-full -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-300",
        config.pageBg,
        config.pageText
      )}
    >
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* HEADER BAR: GREETING (THEMES SELECTOR REMOVED) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={cn("text-2xl font-bold sm:text-3xl tracking-tight text-[#194611]")}>
              Welcome back, Midwife {displayName}
            </h1>
            <p className={cn("text-xs sm:text-sm mt-1 text-gray-600")}>
              Clinical Preceptor Workspace • Supervised rotations & live clinical assessments
            </p>
          </div>
        </div>

        {/* 4 STAT CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <Link
            href="/my-mentees"
            className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-transform hover:-translate-y-0.5"
          >
            <MentorStatCard
              label="Total Mentees"
              value={statsState.totalMentees}
              trend={statsState.menteesTrend}
              icon={Users}
              iconColor="text-emerald-700"
              iconBg="bg-emerald-50"
            />
          </Link>
          <Link
            href="/sessions"
            className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-transform hover:-translate-y-0.5"
          >
            <MentorStatCard
              label="Upcoming Sessions"
              value={statsState.upcomingSessions}
              icon={Calendar}
              iconColor="text-amber-700"
              iconBg="bg-yellow-100"
            />
          </Link>
          <Link
            href="/my-assessments"
            className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-transform hover:-translate-y-0.5"
          >
            <MentorStatCard
              label="Pending Assessments"
              value={statsState.pendingAssessments}
              alert={statsState.pendingAssessments > 0 ? "Needs Action" : null}
              icon={ClipboardList}
              iconColor="text-red-600"
              iconBg="bg-red-50"
            />
          </Link>
          <MentorStatCard
            label="Avg. Competency"
            value={statsState.avgCompetencyPct > 0 ? `${statsState.avgCompetencyPct}%` : "N/A"}
            trend={statsState.competencyTrend}
            icon={GraduationCap}
            iconColor="text-purple-700"
            iconBg="bg-purple-50"
            decorative
          />
        </div>

        {/* SPLIT SECTION: RECENT ACTIVITY & TODAY'S SCHEDULE */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
          <RecentActivityCard items={activity} className="lg:col-span-2" />
          <TodaysScheduleCard date={scheduleDate} items={schedule} className="lg:col-span-1" />
        </div>
      </div>
    </div>
  );
}

export function MentorDashboardClient({
  displayName,
  data,
}: MentorDashboardClientProps) {
  return (
    <MentorThemeProvider>
      <MentorDashboardInner displayName={displayName} data={data} />
    </MentorThemeProvider>
  );
}

export default MentorDashboardClient;
