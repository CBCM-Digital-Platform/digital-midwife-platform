"use client";

import Link from "next/link";
import { AlertTriangle, FileText, History, MessageSquare, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem, ActivityKind } from "@/types/mentor-dashboard";
import { useMentorTheme } from "./MentorThemeContext";

const KIND_STYLE: Record<ActivityKind, { icon: LucideIcon; wrapLight: string; wrapDark: string }> = {
  LOGBOOK: {
    icon: FileText,
    wrapLight: "bg-emerald-50 text-[#194611] border border-emerald-100",
    wrapDark: "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50",
  },
  MESSAGE: {
    icon: MessageSquare,
    wrapLight: "bg-amber-50 text-amber-700 border border-amber-100",
    wrapDark: "bg-amber-950/60 text-amber-300 border border-amber-800/50",
  },
  MISSED_ASSESSMENT: {
    icon: AlertTriangle,
    wrapLight: "bg-red-50 text-red-600 border border-red-100",
    wrapDark: "bg-red-950/60 text-red-300 border border-red-800/50",
  },
};

export function RecentActivityCard({
  items,
  className,
}: {
  items: ActivityItem[];
  className?: string;
}) {
  const { theme, config } = useMentorTheme();
  const isDark = theme !== "light";

  return (
    <section
      className={cn(
        "rounded-xl border p-5 transition-all duration-200 sm:p-6",
        config.cardBg,
        config.cardBorder,
        config.cardShadow,
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className={cn("flex items-center gap-2 text-lg font-semibold sm:text-xl", config.cardText)}>
          <History className={cn("h-5 w-5", config.pageAccent)} />
          Recent Activity
        </h2>
        <button
          type="button"
          className={cn("text-sm font-semibold transition-colors cursor-pointer", config.accentText)}
        >
          View All
        </button>
      </div>

      {items.length === 0 ? (
        <p className={cn("text-sm py-4", config.cardTextMuted)}>No recent activity yet.</p>
      ) : (
        <ul className={cn("divide-y", config.divider)}>
          {items.map((item) => {
            const style = KIND_STYLE[item.kind] || KIND_STYLE.LOGBOOK;
            const Icon = style.icon;
            const wrapClass = isDark ? style.wrapDark : style.wrapLight;

            return (
              <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                    wrapClass
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn("text-sm leading-relaxed", config.activityBodyText)}>
                      <span className={cn("font-semibold", config.activityActorText)}>
                        {item.actor}
                      </span>{" "}
                      {item.text}
                    </p>
                    <span className={cn("shrink-0 text-xs", config.cardTextMuted)}>
                      {item.timeAgo}
                    </span>
                  </div>

                  {item.quote && (
                    <p
                      className={cn(
                        "mt-2 rounded-lg border p-3 text-sm italic transition-colors",
                        config.activityQuoteBg,
                        config.activityQuoteBorder,
                        config.activityQuoteText
                      )}
                    >
                      “{item.quote}”
                    </p>
                  )}

                  <Link
                    href={item.href}
                    className={cn(
                      "mt-2 inline-block text-xs font-semibold hover:underline",
                      config.accentText
                    )}
                  >
                    {item.actionLabel}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}