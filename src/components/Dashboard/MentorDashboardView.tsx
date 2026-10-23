import React from "react";
import { Users, Calendar, AlertCircle, Award } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";

export interface MentorDashboardViewProps {
  displayName: string;
}

export function MentorDashboardView({ displayName }: MentorDashboardViewProps) {
  return (
    <div className="max-w-6xl space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#194611]">
        Welcome back, Midwife {displayName}!
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Mentees"
          value="6"
          trend="+3 this month"
          icon={Users}
          iconColor="text-blue-700"
          iconBgColor="bg-blue-50"
        />
        <StatCard
          title="Upcoming Sessions"
          value="3"
          icon={Calendar}
          iconColor="text-emerald-700"
          iconBgColor="bg-emerald-50"
        />
        <StatCard
          title="Pending Assessments"
          value="8"
          alert="Needs Action"
          icon={AlertCircle}
          iconColor="text-amber-700"
          iconBgColor="bg-amber-50"
        />
        <StatCard
          title="Avg. Competency"
          value="86%"
          trend="+2%"
          icon={Award}
          iconColor="text-purple-700"
          iconBgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Recent Activity
            </h2>
            <button
              type="button"
              className="text-sm font-semibold text-[#194611] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <p className="text-sm text-gray-500">Activity feed will load here...</p>
        </div>

        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
            Today's Schedule
          </h2>
          <p className="text-sm text-gray-500">Timeline will load here...</p>
        </div>
      </div>
    </div>
  );
}
