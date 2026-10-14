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
import { getMentees } from "@/services/users.service";

export default async function MenteesPage() {
  const mentees = await getMentees();

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

        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-xs cursor-pointer">
            <UploadCloud className="h-4 w-4 text-gray-500" />
            <span>Batch Import</span>
          </button>

          <AddUserDialog role="mentee" />
        </div>
      </div>

      {/* 2. STAT SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: TOTAL MENTEES */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Mentees</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">{totalMentees}</span>
                <span className="text-xs font-bold text-emerald-600">↑8% this term</span>
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

        {/* CARD 2: ACTIVE MENTEES */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Mentees</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">{activeCount}</span>
                <span className="text-xs font-semibold text-gray-500">
                  {operationalPercentage}
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

        {/* CARD 3: PENDING MENTEES */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Mentees</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">{pendingCount}</span>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                  Awaiting Assignment
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

        {/* CARD 4: AVERAGE SCORE */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Score</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">{avgKnowledgeMastery}%</span>
                <span className="text-xs font-bold text-emerald-600">+2.4% vs cohort</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="h-1 bg-purple-600 rounded-full w-24" />
          </div>
        </div>
      </div>

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
