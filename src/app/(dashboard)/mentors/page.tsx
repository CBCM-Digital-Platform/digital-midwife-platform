"use client";

import React, { useState } from "react";
import {
  Users,
  Building2,
  GraduationCap,
  CheckCircle2,
  UploadCloud,
  ArrowUpRight,
} from "lucide-react";
import { UsersTable } from "@/components/User/UsersTable";
import { AddUserDialog } from "@/components/User/AddUserDialog";
import { mockMentors, mockMentorStats } from "@/lib/mock-users";
import { ClinicalUser, MentorSummaryStats } from "@/types/user";

export default function MentorsPage() {
  const [mentorsList, setMentorsList] = useState<ClinicalUser[]>(mockMentors);
  const [stats, setStats] = useState<MentorSummaryStats>(mockMentorStats);

  const handleMentorCreated = (newUser: ClinicalUser) => {
    // Prepend the newly created mentor to the active list
    setMentorsList((prev) => [newUser, ...prev]);

    // Dynamically increment summary counters
    setStats((prev) => ({
      ...prev,
      totalMentors: prev.totalMentors + 1,
      activeCount: prev.activeCount + 1,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. PAGE TITLE & HEADER ACTIONS (Figma spec) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mentor Management</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              v3.4 Production
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Oversee clinical preceptors, departmental mentorship assignments, and training statuses across regional facilities.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm">
            <UploadCloud className="h-4 w-4 text-gray-500" />
            <span>Batch Import</span>
          </button>

          <AddUserDialog
            role="mentor"
            onUserCreated={handleMentorCreated}
          />
        </div>
      </div>

      {/* 2. STAT SUMMARY CARDS (4-Grid matching Figma Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: TOTAL MENTORS */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">TOTAL MENTORS</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-gray-900">{stats.totalMentors}</span>
                <span className="text-xs font-semibold text-emerald-600">{stats.quarterTrend}</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{stats.activeCount} Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              <span>{stats.inactiveCount} Inactive</span>
            </div>
          </div>
        </div>

        {/* CARD 2: PARTNER FACILITIES */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">PARTNER FACILITIES</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-gray-900">{stats.partnerFacilities}</span>
                <span className="text-xs text-gray-500 font-medium">Network Nodes</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-3 text-xs font-medium text-gray-600">
            <span>{stats.teachingHospitals} Teaching Hospitals</span>
            <span>•</span>
            <span>{stats.clinicsCount} Clinics</span>
          </div>
        </div>

        {/* CARD 3: ACTIVE MENTEES */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ACTIVE MENTEES</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-gray-900">{stats.activeMentees}</span>
                <span className="text-xs text-gray-500 font-medium">Trainees</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium">
            <span className="text-gray-600">Avg. {stats.avgPerPreceptor} / Preceptor</span>
            <span className="text-emerald-700 font-semibold">{stats.loadStatus}</span>
          </div>
        </div>

        {/* CARD 4: MENTORSHIP COMPLETION */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">MENTORSHIP COMPLETION</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-gray-900">{stats.completionPercentage}%</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <ArrowUpRight className="h-3 w-3 inline" />
                  {stats.completionTrend}
                </span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#194611] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-end text-[11px] text-gray-500 font-medium">
              <span>Q3 Target: {stats.completionTarget}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. THE REUSABLE USERS TABLE (Role-bound to mentor) */}
      <UsersTable
        role="mentor"
        data={mentorsList}
      />
    </div>
  );
}
