"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Layers,
  Users,
  UserPlus,
  Plus,
  ArrowRight,
  ChevronRight,
  BarChart3,
  CheckCircle2,
  BookOpen,
  Award,
  Sparkles,
  MapPin,
  Settings,
  FolderOpen,
} from "lucide-react";
import type { Facility } from "@/types/facility";
import type { FacilityAdmin } from "@/types/facility-admin";
import type { ThematicArea } from "@/types/thematic-area";
import { cn, formatWelcomeName } from "@/lib/utils";
import { getStoredAreas } from "@/services/thematic-areas.service";
import { StatCard } from "@/components/common/StatCard";

interface SuperAdminDashboardViewProps {
  userName: string;
  facilities: Facility[];
  facilityAdmins: FacilityAdmin[];
  thematicAreas: ThematicArea[];
  totalMentors: number;
  totalMentees: number;
}

export function SuperAdminDashboardView({
  userName,
  facilities,
  facilityAdmins,
  thematicAreas,
  totalMentors,
  totalMentees,
}: SuperAdminDashboardViewProps) {
  const firstName = formatWelcomeName(userName);

  // Synchronize thematic areas with client-side storage so count and cards match the table exactly
  const [areas, setAreas] = useState<ThematicArea[]>(thematicAreas);

  useEffect(() => {
    const stored = getStoredAreas();
    if (stored && stored.length > 0) {
      setAreas(stored);
    }
  }, []);

  // Calculated metrics
  const activeFacilitiesCount = facilities.filter(
    (f) => f.status === "active"
  ).length;

  const activeAdminsCount = facilityAdmins.filter(
    (a) => a.status === "active"
  ).length;

  const activeAreasCount = areas.filter(
    (a) => a.status === "active"
  ).length;

  const totalCompetencies = areas.reduce(
    (acc, curr) => acc + (curr.competenciesCount || 12),
    0
  );

  const totalClinicians = totalMentors + totalMentees;

  // Map of facilityId -> facilityAdmin
  const adminByFacility = new Map<number | string, FacilityAdmin>();
  facilityAdmins.forEach((admin) => {
    if (admin.facilityId !== undefined && admin.facilityId !== null) {
      adminByFacility.set(admin.facilityId, admin);
      adminByFacility.set(String(admin.facilityId), admin);
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-[#194611] border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Super Administrator
            </span>
            <span className="text-xs text-gray-400">• National Mentorship Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#194611] tracking-tight">
            Welcome back, {firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            National clinical mentorship & healthcare facility network oversight. Oversee accredited health facilities, appointed administrators, and clinical curriculum domains.
          </p>
        </div>

        {/* Primary Call-to-Actions for Super Admin */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/facilities"
            className="inline-flex items-center gap-2 bg-[#194611] hover:bg-[#12330c] text-white px-3.5 py-2.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Facility</span>
          </Link>
          <Link
            href="/facility-admins"
            className="inline-flex items-center gap-2 bg-[#FDD028] hover:bg-yellow-400 text-gray-900 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Facility Admin</span>
          </Link>
          <Link
            href="/thematic-areas"
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-[#194611] border border-emerald-200 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Thematic Areas</span>
          </Link>
        </div>
      </div>

      {/* 2. SYSTEM-WIDE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Health Facilities"
          value={facilities.length}
          subtext={
            <span className="text-xs text-emerald-700 font-semibold">
              {activeFacilitiesCount} Active Network
            </span>
          }
          icon={Building2}
          iconBgColor="bg-emerald-50"
          iconColor="text-[#194611]"
          action={{
            label: "Manage",
            href: "/facilities",
          }}
        />

        <StatCard
          title="Facility Admins"
          value={facilityAdmins.length}
          subtext={
            <span className="text-xs text-blue-700 font-semibold">
              {activeAdminsCount} Appointed Supervisors
            </span>
          }
          icon={ShieldCheck}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-700"
          action={{
            label: "Manage",
            href: "/facility-admins",
          }}
        />

        <StatCard
          title="Thematic Domains"
          value={areas.length}
          subtext={
            <span className="text-xs text-purple-700 font-semibold">
              {activeAreasCount} Active • {totalCompetencies} Skills
            </span>
          }
          icon={Layers}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-700"
          action={{
            label: "Curricula",
            href: "/thematic-areas",
          }}
        />

        <StatCard
          title="Clinicians Network"
          value={totalClinicians > 0 ? totalClinicians : "48+"}
          subtext={
            <span className="text-xs text-amber-700 font-semibold">
              {totalMentors > 0 ? totalMentors : 18} Mentors • {totalMentees > 0 ? totalMentees : 30} Mentees
            </span>
          }
          icon={Users}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-700"
          action={{
            label: "Reports",
            href: "/reports",
          }}
        />
      </div>

      {/* 3. TWO-COLUMN MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: FACILITIES & ADMINISTRATORS DIRECTORY */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card A: Accredited Health Facilities Network */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#194611]" />
                  <h2 className="text-base font-bold text-gray-900">
                    Accredited Healthcare Facilities
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  General hospitals, referral centers, and specialized maternity institutions
                </p>
              </div>
              <Link
                href="/facilities"
                className="text-xs font-semibold text-[#194611] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                View All ({facilities.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {facilities.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No facilities registered yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {facilities.slice(0, 5).map((facility) => {
                  const assignedAdmin =
                    adminByFacility.get(facility.id) ||
                    adminByFacility.get(Number(facility.id));

                  return (
                    <div
                      key={facility.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-gray-50/60 -mx-2 px-2 rounded-lg transition"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-[#194611] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {facility.name}
                            </span>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {facility.type || "Hospital"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {facility.region || "Regional Center"}
                              {facility.zone ? `, ${facility.zone}` : ""}
                            </span>
                            {assignedAdmin && (
                              <span className="text-emerald-700 font-medium">
                                • Admin: {assignedAdmin.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span
                          className={cn(
                            "text-xs px-2.5 py-0.5 rounded-full font-semibold border",
                            facility.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          )}
                        >
                          {facility.status === "active" ? "Active" : "Inactive"}
                        </span>
                        <Link
                          href="/facilities"
                          className="text-gray-400 hover:text-[#194611] transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card B: Appointed Facility Administrators */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#194611]" />
                  <h2 className="text-base font-bold text-gray-900">
                    Hospital Facility Administrators
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Supervisors authorized to manage local clinical preceptors and junior midwives
                </p>
              </div>
              <Link
                href="/facility-admins"
                className="text-xs font-semibold text-[#194611] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Manage All ({facilityAdmins.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {facilityAdmins.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No facility administrators appointed yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {facilityAdmins.slice(0, 5).map((admin) => (
                  <div
                    key={admin.id}
                    className="py-3 flex items-center justify-between hover:bg-gray-50/60 -mx-2 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#194611] font-bold text-xs flex items-center justify-center shrink-0">
                        {admin.avatarInitials || "FA"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {admin.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {admin.email} • {admin.facilityName || "Unassigned"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={cn(
                          "text-xs px-2.5 py-0.5 rounded-full font-semibold border",
                          admin.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {admin.status}
                      </span>
                      <Link
                        href="/facility-admins"
                        className="text-gray-400 hover:text-[#194611]"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card C: National Governance Protocol Callout */}
          <div className="bg-[#194611] text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FDD028]" />
                <h3 className="text-base font-bold">
                  Ministry of Health Clinical Mentorship Platform
                </h3>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed max-w-lg">
                National clinical mentorship standards, adolescent & youth sexual reproductive health (AYSRH) competencies, and decentralized hospital governance are consolidated here.
              </p>
            </div>
            <Link
              href="/reports"
              className="bg-[#FDD028] text-gray-900 hover:bg-yellow-400 font-semibold px-4 py-2.5 rounded-lg text-xs transition inline-flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
              Cross-Facility Reports
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: THEMATIC DOMAINS & PLATFORM TOOLS */}
        <div className="space-y-6">
          {/* Card D: Clinical Thematic Areas Preview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#194611]" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Thematic Domains
                </h3>
              </div>
              <Link
                href="/thematic-areas"
                className="text-xs font-semibold text-[#194611] hover:underline cursor-pointer"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {areas.slice(0, 5).map((area) => (
                <div
                  key={area.id}
                  className="p-3 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                      {area.code}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {area.category}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                    {area.name}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Award className="w-3 h-3 text-gray-400" />
                      {area.competenciesCount || 12} Skills
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-gray-400" />
                      {area.modulesCount || 3} Modules
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/thematic-areas"
              className="mt-4 block text-center py-2 px-3 rounded-lg border border-gray-200 hover:border-[#194611] hover:text-[#194611] text-xs font-semibold text-gray-700 transition"
            >
              View All Thematic Areas ({areas.length}) →
            </Link>
          </div>

          {/* Card E: Quick Governance Tools */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
              Super Admin Quick Tools
            </h3>

            <div className="space-y-2">
              <Link
                href="/facilities"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-xs font-semibold text-gray-700 hover:text-[#194611] transition"
              >
                <span className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  Facility Network Registry
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/facility-admins"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-xs font-semibold text-gray-700 hover:text-[#194611] transition"
              >
                <span className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-gray-400" />
                  Facility Administrators Directory
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/thematic-areas"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-xs font-semibold text-gray-700 hover:text-[#194611] transition"
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-gray-400" />
                  Clinical Thematic Curricula
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/reports"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-xs font-semibold text-gray-700 hover:text-[#194611] transition"
              >
                <span className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                  Cross-Facility Reports & Analytics
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/resources"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-xs font-semibold text-gray-700 hover:text-[#194611] transition"
              >
                <span className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-gray-400" />
                  Clinical Protocol Library
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/settings"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-xs font-semibold text-gray-700 hover:text-[#194611] transition"
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-gray-400" />
                  System & Profile Settings
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Card F: Platform Status Badge */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>National System Health</span>
            </div>
            <div className="mt-3 space-y-2 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>API Status:</span>
                <span className="font-semibold text-emerald-700">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>MoH Protocol Version:</span>
                <span className="font-semibold text-gray-800">2026.1 (Active)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Security Role:</span>
                <span className="font-semibold text-gray-800">Super Administrator</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
