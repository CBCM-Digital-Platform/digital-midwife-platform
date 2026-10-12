"use client";

import React, { useState } from "react";
import {
  Users,
  Activity,
  Clock,
  CheckCircle2,
  UploadCloud,
  ArrowUpRight,
} from "lucide-react";
import { UsersTable } from "@/components/User/UsersTable";
import { AddUserDialog } from "@/components/User/AddUserDialog";
import { mockMentors, mockMentorStats } from "@/lib/mock-users";
import { ClinicalUser, MentorSummaryStats } from "@/types/user";

const defaultMentorStats: MentorSummaryStats = {
  totalMentors: 148,
  activeCount: 132,
  pendingCount: 16,
  inactiveCount: 0,
  operationalPercentage: "89.2% active",
  pendingStage: "Pending Review",
  quarterTrend: "↑8% this quarter",
  partnerFacilities: 12,
  teachingHospitals: 9,
  clinicsCount: 3,
  activeMentees: 412,
  avgPerPreceptor: 2.8,
  loadStatus: "Optimal Load",
  completionPercentage: 94.6,
  completionTrend: "↑1.4%",
  completionTarget: 92,
};

export default function MentorsPage() {
  const [mentorsList, setMentorsList] = useState<ClinicalUser[]>(() => mockMentors || []);
  const [stats, setStats] = useState<MentorSummaryStats>(() => mockMentorStats || defaultMentorStats);

  const currentStats = stats || defaultMentorStats;

  const handleMentorCreated = (newUser: ClinicalUser) => {
    // Prepend the newly created mentor to the active list
    setMentorsList((prev) => [newUser, ...prev]);

    // Dynamically increment summary counters
    setStats((prev) => {
      const base = prev || defaultMentorStats;
      return {
        ...base,
        totalMentors: base.totalMentors + 1,
        activeCount: base.activeCount + 1,
      };
    });
  };

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

        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-xs cursor-pointer">
            <UploadCloud className="h-4 w-4 text-gray-500" />
            <span>Batch Import</span>
          </button>

          <AddUserDialog
            role="mentor"
            onUserCreated={handleMentorCreated}
          />
        </div>
      </div>

      {/* 2. STAT SUMMARY CARDS (Clear, descriptive titles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: TOTAL MENTORS */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Mentors</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">{currentStats.totalMentors}</span>
                <span className="text-xs font-bold text-emerald-600">{currentStats.quarterTrend}</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="h-1 bg-[#194611] rounded-full w-24" />
          </div>
        </div>

        {/* CARD 2: ACTIVE MENTORS */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Mentors</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">{currentStats.activeCount}</span>
                <span className="text-xs font-semibold text-gray-500">
                  {currentStats.operationalPercentage || "Currently mentoring"}
                </span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="h-1 bg-emerald-600 rounded-full w-28" />
          </div>
        </div>

        {/* CARD 3: PENDING MENTORS */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Mentors</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">{currentStats.pendingCount || 16}</span>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                  {currentStats.pendingStage || "Pending Review"}
                </span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="h-1 bg-amber-500 rounded-full w-20" />
          </div>
        </div>

        {/* CARD 4: COMPLETION RATE */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completion Rate</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">{currentStats.completionPercentage}%</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUpRight className="h-3 w-3 inline" />
                  {currentStats.completionTrend}
                </span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#194611] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${currentStats.completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-end text-[11px] text-gray-500 font-medium">
              <span>Target: {currentStats.completionTarget}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. REUSABLE USERS TABLE (Role = "mentor") */}
      <UsersTable
        role="mentor"
        data={mentorsList}
        cohortLabel="Accredited Preceptor Registry • Cohort 2024-Q3"
        totalCohortCount={currentStats.totalMentors}
      />
    </div>
  );
}
