import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiClient } from "@/lib/api-client";
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
import { isAdminRole } from "@/types/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const rawRole = ((session?.user as any)?.role || "").toLowerCase();
  const isAdmin = rawRole.includes("admin");
  const isMentor = rawRole.includes("mentor");
  const userName = session?.user?.name || "Administrator";
  const userRoleLabel = rawRole.includes("facility") ? "Facility Administrator" : "System Administrator";

  // =========================================================================
  // ADMIN & FACILITY ADMIN DASHBOARD (CONNECTED TO LIVE BACKEND)
  // =========================================================================
  if (isAdmin) {
    let mentors: any[] = [];
    let mentees: any[] = [];
    let cycles: any[] = [];
    let facilities: any[] = [];

    try {
      const [mentorsRes, menteesRes, cyclesRes, facilitiesRes] = await Promise.all([
        apiClient<any>("/api/v1/users?role=mentor").catch(() => null),
        apiClient<any>("/api/v1/users?role=mentee").catch(() => null),
        apiClient<any>("/api/v1/mentorship-cycles").catch(() => null),
        apiClient<any>("/api/v1/facilities").catch(() => null),
      ]);

      mentors = Array.isArray(mentorsRes?.data) ? mentorsRes.data : Array.isArray(mentorsRes) ? mentorsRes : [];
      mentees = Array.isArray(menteesRes?.data) ? menteesRes.data : Array.isArray(menteesRes) ? menteesRes : [];
      cycles = Array.isArray(cyclesRes?.data) ? cyclesRes.data : Array.isArray(cyclesRes) ? cyclesRes : [];
      facilities = Array.isArray(facilitiesRes?.data) ? facilitiesRes.data : Array.isArray(facilitiesRes) ? facilitiesRes : [];
    } catch (err) {
      console.warn("Failed to fetch live admin dashboard metrics:", err);
    }

    const activeCycle = cycles[0] || {
      name: "2026 Mentorship Cycle 1",
      status: "planned",
      start_date: "2026-11-01",
      end_date: "2027-04-30",
    };

    const primaryFacility = facilities[0] || {
      name: "Tirunesh Beijing General Hospital",
      region: "Addis Ababa",
      type: "Hospital",
    };

    const totalClinicians = mentors.length + mentees.length;
    const activeMentors = mentors.filter((m) => m.status === "active").length || mentors.length;
    const activeMentees = mentees.filter((m) => m.status === "active").length || mentees.length;
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
              Welcome back, {userName.split(" ")[0]}!
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
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clinical Mentors</p>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <UserCheck className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-gray-900">{activeMentors}</p>
              <p className="text-xs text-emerald-700 font-medium mt-1">
                {mentors.length} registered preceptors
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Midwife Mentees</p>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Users className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-gray-900">{activeMentees}</p>
              <p className="text-xs text-blue-700 font-medium mt-1">
                {mentees.length} in clinical rotation
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Cycle</p>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <Calendar className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xl font-bold text-gray-900 truncate">{activeCycle.name}</p>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 mt-1">
                Status: {activeCycle.status}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Facilities</p>
              <span className="p-2 rounded-lg bg-purple-50 text-purple-700">
                <Building2 className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-gray-900">{facilities.length || 2}</p>
              <p className="text-xs text-purple-700 font-medium mt-1">
                Regional health centers connected
              </p>
            </div>
          </div>
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
                  View All ({mentees.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {mentees.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">No mentees found in database.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {mentees.slice(0, 5).map((m: any) => (
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

  // =========================================================================
  // MENTOR DASHBOARD
  // =========================================================================
  // MENTOR DASHBOARD
  // =========================================================================
  if (isMentor) {
    return (
      <div className="max-w-6xl space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#194611]">
          Welcome back, Midwife {userName.split(" ")[0]}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: "TOTAL MENTEES", value: "6", trend: "+3 this month" },
            { label: "UPCOMING SESSIONS", value: "3", trend: null },
            { label: "PENDING ASSESSMENTS", value: "8", alert: "Needs Action" },
            { label: "AVG. COMPETENCY", value: "86%", trend: "+2%" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl sm:text-4xl font-bold text-gray-900">{stat.value}</p>
                {stat.trend && <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{stat.trend}</span>}
                {stat.alert && <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-1 rounded-full">{stat.alert}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Activity</h2>
                <button className="text-sm font-semibold text-[#194611] hover:underline cursor-pointer">View All</button>
             </div>
             <p className="text-sm text-gray-500">Activity feed will load here...</p>
          </div>

          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
             <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Today's Schedule</h2>
             <p className="text-sm text-gray-500">Timeline will load here...</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MENTEE STUDENT DASHBOARD
  // =========================================================================
  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#194611]">
        Welcome back, {userName.split(" ")[0]}!
      </h1>

      <div className="bg-[#194611] text-white p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
         <div className="space-y-3">
            <p className="text-xs sm:text-sm text-gray-300">Active Clinical Pathway • Chapter 2 of 4</p>
            <h2 className="text-lg sm:text-xl font-medium">You are currently completing Chapter 2: Intrapartum Care & Clinical Obstetric Skills.</h2>
            <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm bg-white/10 p-3 rounded-lg">
               <span className="font-bold tracking-wider text-emerald-200">NEXT UP IN MODULE 4</span>
               <span className="font-semibold">Lesson 2: Fundal Height & Palpation Assessment (75% Complete)</span>
            </div>
         </div>
         <button className="bg-[#FDD028] text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400 transition shrink-0 w-full md:w-auto text-center cursor-pointer">
            Resume Lesson
         </button>
      </div>
    </div>
  );
}