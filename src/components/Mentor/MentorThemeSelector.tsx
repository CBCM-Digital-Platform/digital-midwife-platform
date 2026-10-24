"use client";

import React from "react";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMentorTheme, MENTOR_THEMES, MentorTheme } from "./MentorThemeContext";

export function MentorThemeSelector({ className }: { className?: string }) {
  const { theme, config, setTheme } = useMentorTheme();

  const themeList = (Object.keys(MENTOR_THEMES) as MentorTheme[]).map(
    (key) => MENTOR_THEMES[key]
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-xl border p-1.5 transition-all duration-200",
        config.cardBg,
        config.cardBorder,
        config.cardShadow,
        className
      )}
      role="group"
      aria-label="Theme selection controls"
    >
      <div className="hidden sm:flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wider opacity-75">
        <Palette className="h-3.5 w-3.5" />
        <span>Theme:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {themeList.map((t) => {
          const isActive = theme === t.id;
          const Icon = t.icon;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={isActive}
              title={`${t.name} • ${t.description}`}
              className={cn(
                "group relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer",
                isActive
                  ? cn(
                      "shadow-xs ring-1 ring-inset font-semibold",
                      t.id === "light"
                        ? "bg-white text-gray-900 ring-gray-300 shadow-sm"
                        : t.id === "dark"
                        ? "bg-[#1c1d27] text-white ring-emerald-500/60"
                        : t.id === "gray"
                        ? "bg-[#303c51] text-white ring-slate-400/50"
                        : "bg-[#183920] text-emerald-100 ring-emerald-500/60"
                    )
                  : cn(
                      "hover:opacity-100 opacity-70",
                      config.cardTextMuted,
                      t.id === "light"
                        ? "hover:bg-gray-100 hover:text-gray-900"
                        : "hover:bg-white/10 hover:text-white"
                    )
              )}
            >
              {/* Swatch color dot */}
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full border shadow-xs transition-transform group-hover:scale-110",
                  t.swatchBg,
                  t.swatchBorder
                )}
                aria-hidden="true"
              />

              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{t.name}</span>

              {isActive && (
                <Check className="h-3 w-3 shrink-0 text-emerald-500 font-bold" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
