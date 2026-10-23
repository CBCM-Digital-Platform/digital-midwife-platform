import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: React.ReactNode | string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBgColor?: string;
  trend?: string | null;
  alert?: string | null;
  action?: {
    label: string;
    href: string;
  };
  statusBadge?: {
    label: string;
    className?: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = "text-emerald-700",
  iconBgColor = "bg-emerald-50",
  trend,
  alert,
  action,
  statusBadge,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition group",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {title}
        </p>
        <span
          className={cn(
            "p-2 sm:p-2.5 rounded-lg transition",
            iconBgColor,
            iconColor
          )}
        >
          <Icon className="w-5 h-5" />
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight truncate">
            {value}
          </p>
          {trend && (
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
              {trend}
            </span>
          )}
          {alert && (
            <span className="text-xs font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full shrink-0">
              {alert}
            </span>
          )}
        </div>

        {statusBadge && (
          <span
            className={cn(
              "inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide mt-1.5",
              statusBadge.className || "bg-amber-100 text-amber-800"
            )}
          >
            {statusBadge.label}
          </span>
        )}

        {(subtext || action) && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
            {typeof subtext === "string" ? (
              <p className="font-medium truncate">{subtext}</p>
            ) : (
              subtext
            )}
            {action && (
              <Link
                href={action.href}
                className="font-semibold text-gray-400 hover:text-[#194611] inline-flex items-center gap-0.5 shrink-0 transition"
              >
                {action.label} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
