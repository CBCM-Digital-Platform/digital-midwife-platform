"use client";

import type { ComponentType } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMentorTheme } from "./MentorThemeContext";

interface MentorStatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  trend?: string | null;
  alert?: string | null;
  decorative?: boolean;
  className?: string;
}

export function MentorStatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  alert,
  decorative,
  className,
}: MentorStatCardProps) {
  const { theme, config } = useMentorTheme();
  const isDark = theme !== "light";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 transition-all duration-200 sm:p-6",
        config.cardBg,
        config.cardBorder,
        config.cardShadow,
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "rounded-lg p-2.5 transition-colors",
            isDark
              ? "bg-white/10 text-white border border-white/10"
              : cn(iconBg, iconColor)
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
              config.statTrendBg,
              config.statTrendText
            )}
          >
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        )}

        {alert && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              isDark
                ? "bg-red-950/80 text-red-300 border border-red-800/60"
                : "bg-red-50 text-red-600 border border-red-100"
            )}
          >
            {alert}
          </span>
        )}
      </div>

      <p className={cn("mt-5 text-xs font-medium uppercase tracking-wider", config.cardTextMuted)}>
        {label}
      </p>
      <p className={cn("mt-1 text-3xl font-bold tracking-tight", config.cardText)}>
        {value}
      </p>

      {decorative && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-4 flex items-end gap-1.5 opacity-80"
        >
          <span className={cn("h-4 w-3 rounded-t transition-colors", config.statDecorativeBar)} />
          <span className={cn("h-8 w-3 rounded-t transition-colors", config.statDecorativeBar)} />
          <span className={cn("h-6 w-3 rounded-t transition-colors", config.statDecorativeBar)} />
        </div>
      )}
    </div>
  );
}