import React from "react";
import { LucideIcon, ArrowUpRight } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendIcon?: boolean;
  subtext?: string;
  badge?: string;
  badgeColor?: string;
  icon: LucideIcon;
  iconColor?: string;
  accentBarColor?: string;
  accentBarWidth?: string;
  progress?: {
    percentage: number;
    target?: number;
    barColor?: string;
  };
}

export function StatCard({
  title,
  value,
  trend,
  trendIcon = false,
  subtext,
  badge,
  badgeColor = "bg-amber-100 text-amber-800",
  icon: Icon,
  iconColor = "bg-blue-50 text-blue-600",
  accentBarColor = "bg-[#194611]",
  accentBarWidth = "w-24",
  progress,
}: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-gray-900">{value}</span>
            {trend && (
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                {trendIcon && <ArrowUpRight className="h-3 w-3 inline mr-0.5" />}
                {trend}
              </span>
            )}
            {badge && (
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${badgeColor}`}>
                {badge}
              </span>
            )}
            {subtext && <span className="text-xs font-semibold text-gray-500">{subtext}</span>}
          </div>
        </div>
        <div className={`h-10 w-10 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        {progress ? (
          <div className="space-y-1.5">
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`${progress.barColor || "bg-[#194611]"} h-1.5 rounded-full transition-all duration-500`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            {progress.target !== undefined && (
              <div className="flex justify-end text-[11px] text-gray-500 font-medium">
                <span>Target: {progress.target}%</span>
              </div>
            )}
          </div>
        ) : (
          <div className={`h-1 ${accentBarColor} rounded-full ${accentBarWidth}`} />
        )}
      </div>
    </div>
  );
}

export interface UserStatsCardsProps {
  stats: StatCardProps[];
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <StatCard key={`${stat.title}-${idx}`} {...stat} />
      ))}
    </div>
  );
}

export default UserStatsCards;
