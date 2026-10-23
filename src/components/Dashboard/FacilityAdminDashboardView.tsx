import React from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  RefreshCw,
  Building2,
  Calendar,
  ArrowRight,
  Plus,
  ShieldCheck,
  Award,
  ChevronRight,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";

export interface FacilityAdminDashboardViewProps {
  displayName: string;
  userRoleLabel: string;
  primaryFacility: {
    name: string;
    region?: string;
    type?: string;
  };
  activeCycle: {
    name: string;
    status: string;
    start_date?: string;
    end_date?: string;
  };
  facilityMentors: any[];
  facilityMentees: any[];
  totalClinicians: number;
  activeMentors: number;
  activeMentees: number;
  facilities: any[];
  userFacilityId?: string | number | null;
}

export function FacilityAdminDashboardView({
  displayName,
  userRoleLabel,
  primaryFacility,
  activeCycle,
  facilityMentors,
  facilityMentees,
  totalClinicians,
  activeMentors,
  activeMentees,
  facilities,
  userFacilityId,
}: FacilityAdminDashboardViewProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              {userRoleLabel}
            </span>
            <span className="text-xs text-gray-500">• {primaryFacility.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#194611] tracking-tight">
            Welcome back, {displayName}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Live facility management, clinical mentorship cohorts, and regional health operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          <Link
            href="/assignments/new"
            className="inline-flex items-center gap-2 bg-[#194611] hover:bg-[#12330c] text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </Link>
          <Link
            href="/cycles"
            className="inline-flex items-center gap-2 bg-[#FDD028] hover:bg-yellow-400 text-gray-900 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            View Cycles
          </Link>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Clinical Mentors"
          value={activeMentors}
          subtext={
            <span className="text-xs text-emerald-700 font-medium">
              {facilityMentors.length} registered preceptors
            </span>
          }
          icon={UserCheck}
          iconColor="text-emerald-700"
          iconBgColor="bg-emerald-50"
        />

        <StatCard
          title="Midwife Mentees"
          value={activeMentees}
          subtext={
            <span className="text-xs text-blue-700 font-medium">
              {facilityMentees.length} in clinical rotation
            </span>
          }
          icon={Users}
          iconColor="text-blue-700"
          iconBgColor="bg-blue-50"
        />

        <StatCard
          title="Current Cycle"
          value={activeCycle.name}
          statusBadge={{
            label: `Status: ${activeCycle.status}`,
            className: "bg-amber-100 text-amber-800",
          }}
          icon={Calendar}
          iconColor="text-amber-700"
          iconBgColor="bg-amber-50"
        />

        <StatCard
          title={userFacilityId ? "Assigned Facility" : "Facilities"}
          value={userFacilityId ? primaryFacility.name : (facilities.length || 0)}
          subtext={
            <span className="text-xs text-purple-700 font-medium truncate">
              {userFacilityId
                ? `${primaryFacility.type || "Hospital"} • ${primaryFacility.region || "Operational"}`
                : "Regional health centers connected"}
            </span>
          }
          icon={Building2}
          iconColor="text-purple-700"
          iconBgColor="bg-purple-50"
        />
      </div>

      {/* TWO-COLUMN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: ACTIVE CLINICIANS & ASSIGNMENTS OVERVIEW */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Enrolled Mentees in Facility</h2>
                <p className="text-xs text-gray-500 mt-0.5">Live records registered on your backend</p>
              </div>
              <Link
                href="/mentees"
                className="text-xs font-semibold text-[#194611] hover:underline inline-flex items-center gap-1"
              >
                View All ({facilityMentees.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {facilityMentees.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No mentees found in this facility.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {facilityMentees.slice(0, 5).map((m: any) => (
                  <div key={m.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#194611] flex items-center justify-center font-bold text-xs">
                        {(m.full_name || m.name || m.email || "M")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {m.full_name || m.name || m.email}
                        </p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">
                        {m.status || "active"}
                      </span>
                      <Link
                        href="/assignments/new"
                        className="text-xs text-gray-400 hover:text-[#194611]"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QUICK ACTIONS BANNER */}
          <div className="bg-[#194611] text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold">Mentorship Assignment Workflow</h3>
              <p className="text-xs text-emerald-100 mt-1 max-w-md">
                Pair junior clinical midwives with senior mentors in your facility under the active cohort cycle.
              </p>
            </div>
            <Link
              href="/assignments"
              className="bg-[#FDD028] text-gray-900 hover:bg-yellow-400 font-semibold px-4 py-2.5 rounded-lg text-xs transition inline-flex items-center gap-1.5 shrink-0"
            >
              Go to Assignments
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: COHORT DETAILS & QUICK SHORTCUTS */}
        <div className="space-y-6">
          {/* COHORT STATUS CARD */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-[#194611]" />
              <h3 className="text-base font-bold text-gray-900">Active Cohort</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-gray-500 block">Cycle Name</span>
                <span className="font-semibold text-gray-900">{activeCycle.name}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Duration Range</span>
                <span className="font-medium text-gray-700">
                  {activeCycle.start_date || "2026-11-01"} → {activeCycle.end_date || "2027-04-30"}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Target Facility</span>
                <span className="font-medium text-gray-700">{primaryFacility.name}</span>
              </div>
            </div>
          </div>

          {/* QUICK NAVIGATION SHORTCUTS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
              Facility Admin Tools
            </h3>

            <div className="space-y-2">
              <Link
                href="/assignments"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 hover:text-[#194611] transition"
              >
                <span>Manage Assignments</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/mentees"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 hover:text-[#194611] transition"
              >
                <span>Clinical Mentees Directory</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/mentors"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 hover:text-[#194611] transition"
              >
                <span>Preceptor Mentors Directory</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/cycles"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 hover:text-[#194611] transition"
              >
                <span>Mentorship Cohort Cycles</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/settings"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 hover:text-[#194611] transition"
              >
                <span>Facility Settings</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
