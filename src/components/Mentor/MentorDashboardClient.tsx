"use client";

import React, { useState, useEffect } from "react";
import { getMyMentees } from "@/services/my-mentees.service";
import type { MyMentee } from "@/types/my-mentee";
import type { MentorStats } from "@/types/mentor-dashboard";
import Link from "next/link";
import {
  ClipboardList,
  Calendar,
  GraduationCap,
  Users,
  Building2,
  MessageSquare,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MentorDashboardData } from "@/types/mentor-dashboard";
import { MentorThemeProvider, useMentorTheme } from "./MentorThemeContext";
import { MentorStatCard } from "./MentorStatCard";
import { RecentActivityCard } from "./RecentActivityCard";
import { TodaysScheduleCard } from "./TodaysScheduleCard";
import { MenteeAvatar, CompetencyBadge, LastSession } from "@/components/MyMentees/MenteeParts";

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
  const [menteesList, setMenteesList] = useState<MyMentee[]>(data.mentees || []);
  const [statsState, setStatsState] = useState<MentorStats>(data.stats);

  // Synchronize assigned mentees on client mount from localStorage / live client fetch
  useEffect(() => {
    let isMounted = true;
    getMyMentees().then((clientMentees) => {
      if (!isMounted) return;
      if (clientMentees.length > 0) {
        setMenteesList(clientMentees);
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

        {/* ASSIGNED MENTEES SECTION */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-[#194611] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Assigned Mentees
                </h2>
                <p className="text-xs text-gray-500">
                  Midwives and residents officially assigned to you by facility administration.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#194611] border border-emerald-200">
                <UserCheck className="w-3.5 h-3.5 text-[#FDD028]" />
                {menteesList.length} {menteesList.length === 1 ? "Mentee" : "Mentees"}
              </span>
              <Link
                href="/my-mentees"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#194611] hover:underline ml-2"
              >
                <span>View Full Roster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {menteesList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#194611]">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">No Mentees Assigned Yet</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                When your facility administrator assigns midwives or residents to your cohort, they will appear here with direct messaging, active rotation details, and assessment workflows.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {menteesList.slice(0, 6).map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-md transition-all duration-150 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Mentee Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <MenteeAvatar name={m.name} avatarUrl={m.avatarUrl} className="h-10 w-10 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{m.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">ID: {m.code}</p>
                        </div>
                      </div>
                      <CompetencyBadge level={m.level} />
                    </div>

                    {/* Facility & Last Session */}
                    <div className="space-y-1 text-xs text-gray-600 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{m.facility}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                        <span>Last Contact:</span>
                        <LastSession iso={m.lastSession} overdue={m.overdue} />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <Link
                      href="/messaging"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#194611] text-xs font-semibold transition shadow-2xs cursor-pointer"
                      title={`Send direct message to ${m.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#194611]" />
                      <span>Direct Message</span>
                    </Link>

                    <Link
                      href={`/my-assessments/new?menteeId=${m.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#194611] hover:bg-[#14380e] text-white text-xs font-semibold transition shadow-2xs"
                    >
                      <span>Assess</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
