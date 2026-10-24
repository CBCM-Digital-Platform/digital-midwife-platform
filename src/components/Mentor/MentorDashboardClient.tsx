"use client";

import React from "react";
import { ClipboardList, Calendar, GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MentorDashboardData } from "@/types/mentor-dashboard";
import { MentorThemeProvider, useMentorTheme } from "./MentorThemeContext";
import { MentorThemeSelector } from "./MentorThemeSelector";
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
  const { stats, activity, scheduleDate, schedule } = data;

  return (
    <div
      className={cn(
        "min-h-full -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-300",
        config.pageBg,
        config.pageText
      )}
    >
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* HEADER BAR: GREETING & THEME SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={cn("text-2xl font-bold sm:text-3xl tracking-tight", config.pageText)}>
              Welcome back, Midwife {displayName}
            </h1>
            <p className={cn("text-xs sm:text-sm mt-1", config.pageSubtitle)}>
              Clinical Preceptor Workspace • Supervised rotations & live clinical assessments
            </p>
          </div>

          <div className="shrink-0">
            <MentorThemeSelector />
          </div>
        </div>

        {/* 4 STAT CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <MentorStatCard
            label="Total Mentees"
            value={stats.totalMentees}
            trend={stats.menteesTrend}
            icon={Users}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-50"
          />
          <MentorStatCard
            label="Upcoming Sessions"
            value={stats.upcomingSessions}
            icon={Calendar}
            iconColor="text-amber-700"
            iconBg="bg-yellow-100"
          />
          <MentorStatCard
            label="Pending Assessments"
            value={stats.pendingAssessments}
            alert={stats.pendingAssessments > 0 ? "Needs Action" : null}
            icon={ClipboardList}
            iconColor="text-red-600"
            iconBg="bg-red-50"
          />
          <MentorStatCard
            label="Avg. Competency"
            value={`${stats.avgCompetencyPct}%`}
            trend={stats.competencyTrend}
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
