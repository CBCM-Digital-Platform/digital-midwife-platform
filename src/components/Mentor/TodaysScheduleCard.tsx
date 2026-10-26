"use client";

import { Calendar, MapPin, User, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleItem } from "@/types/mentor-dashboard";
import { useMentorTheme } from "./MentorThemeContext";

function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    day: d.getUTCDate(),
  };
}

export function TodaysScheduleCard({
  date,
  items,
  className,
}: {
  date: string;
  items: ScheduleItem[];
  className?: string;
}) {
  const { config } = useMentorTheme();
  const { month, day } = dateParts(date);

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
      <div className="mb-5 flex items-start justify-between">
        <h2 className={cn("flex items-center gap-2 text-lg font-semibold sm:text-xl", config.cardText)}>
          <Calendar className={cn("h-5 w-5", config.pageAccent)} />
          Today's Schedule
        </h2>
        <div
          className={cn(
            "rounded-lg border px-2.5 py-1 text-center text-xs font-semibold leading-tight transition-colors",
            config.subtleBg,
            config.cardBorder,
            config.cardText
          )}
        >
          <p className="uppercase tracking-wider text-[10px] opacity-75">{month}</p>
          <p className="text-sm font-bold">{day}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className={cn("text-sm py-4", config.cardTextMuted)}>No sessions scheduled today.</p>
      ) : (
        <ol className="space-y-1">
          {items.map((item, index) => {
            const [clock, meridiem] = item.time.split(" ");
            const now = item.status === "NOW";
            const last = index === items.length - 1;

            return (
              <li key={item.id} className="grid grid-cols-[3.5rem_1rem_1fr] gap-x-2">
                <div className="pt-3 text-right">
                  <p className={cn("text-sm font-semibold", config.cardText)}>{clock}</p>
                  <p className={cn("text-[10px] uppercase", config.cardTextMuted)}>{meridiem}</p>
                </div>

                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "mt-4 h-2.5 w-2.5 shrink-0 rounded-full transition-colors",
                      now ? config.scheduleTimelineDot : "bg-gray-400/40"
                    )}
                  />
                  {!last && (
                    <span
                      className={cn(
                        "w-px flex-1 transition-colors",
                        now ? config.scheduleTimelineLine : "bg-gray-400/20"
                      )}
                    />
                  )}
                </div>

                <div
                  className={cn(
                    "mb-4 rounded-lg p-3.5 text-sm transition-all duration-200",
                    now ? config.scheduleActiveCard : config.scheduleInactiveCard
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "font-semibold",
                        now ? config.scheduleActiveTitle : config.scheduleInactiveTitle
                      )}
                    >
                      {item.title}
                    </p>
                    {now && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>

                  <p
                    className={cn(
                      "mt-1.5 flex items-center gap-1.5 text-xs",
                      now ? config.scheduleActiveSubtext : config.scheduleInactiveSubtext
                    )}
                  >
                    <User className="h-3 w-3 shrink-0 opacity-75" />
                    <span>{item.person}</span>
                  </p>

                  {item.location && (
                    <p
                      className={cn(
                        "mt-1 flex items-center gap-1.5 text-xs",
                        now ? config.scheduleActiveSubtext : config.scheduleInactiveSubtext
                      )}
                    >
                      <MapPin className="h-3 w-3 shrink-0 opacity-75" />
                      <span>{item.location}</span>
                    </p>
                  )}

                  {now && item.joinUrl && (
                    <a
                      href={item.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                        config.primaryBtn
                      )}
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Join Video Call</span>
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}