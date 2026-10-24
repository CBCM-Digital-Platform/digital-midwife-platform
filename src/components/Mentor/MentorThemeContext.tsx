"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { LucideIcon, Sun, Moon, Laptop, Trees } from "lucide-react";

export type MentorTheme = "light" | "dark" | "gray" | "forest";

export interface ThemeConfig {
  id: MentorTheme;
  name: string;
  description: string;
  icon: LucideIcon;
  swatchBg: string;
  swatchBorder: string;

  // Page level
  pageBg: string;
  pageText: string;
  pageSubtitle: string;
  pageAccent: string;

  // Cards
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardText: string;
  cardTextMuted: string;
  subtleBg: string;
  divider: string;

  // Interactive buttons & accents
  primaryBtn: string;
  accentText: string;
  badgeActiveBg: string;
  badgeActiveText: string;

  // Stat Card Details
  statTrendBg: string;
  statTrendText: string;
  statDecorativeBar: string;
  statIconLightFilter: boolean;

  // Schedule Card Details
  scheduleTimelineDot: string;
  scheduleTimelineLine: string;
  scheduleActiveCard: string;
  scheduleInactiveCard: string;
  scheduleActiveTitle: string;
  scheduleActiveSubtext: string;
  scheduleInactiveTitle: string;
  scheduleInactiveSubtext: string;

  // Activity Card Details
  activityQuoteBg: string;
  activityQuoteBorder: string;
  activityQuoteText: string;
  activityActorText: string;
  activityBodyText: string;
}

export const MENTOR_THEMES: Record<MentorTheme, ThemeConfig> = {
  light: {
    id: "light",
    name: "Light Mode",
    description: "Crisp white clinical palette with emerald accents",
    icon: Sun,
    swatchBg: "bg-white",
    swatchBorder: "border-gray-300",

    pageBg: "bg-[#f9fafb]",
    pageText: "text-gray-900",
    pageSubtitle: "text-gray-500",
    pageAccent: "text-[#194611]",

    cardBg: "bg-white",
    cardBorder: "border-gray-200",
    cardShadow: "shadow-xs hover:shadow-sm",
    cardText: "text-gray-900",
    cardTextMuted: "text-gray-500",
    subtleBg: "bg-gray-100",
    divider: "divide-gray-100",

    primaryBtn: "bg-[#194611] text-white hover:bg-[#0f2f0b] shadow-xs",
    accentText: "text-[#194611] hover:text-[#0f2f0b]",
    badgeActiveBg: "bg-emerald-50 border-emerald-200",
    badgeActiveText: "text-[#194611]",

    statTrendBg: "bg-gray-100",
    statTrendText: "text-gray-600",
    statDecorativeBar: "bg-gray-100",
    statIconLightFilter: false,

    scheduleTimelineDot: "bg-[#194611]",
    scheduleTimelineLine: "bg-[#194611]/30",
    scheduleActiveCard: "bg-white border-gray-200 border-l-4 border-l-[#194611] shadow-xs text-gray-900",
    scheduleInactiveCard: "bg-gray-50/80 text-gray-600 border border-gray-100",
    scheduleActiveTitle: "text-gray-900",
    scheduleActiveSubtext: "text-gray-600",
    scheduleInactiveTitle: "text-gray-700",
    scheduleInactiveSubtext: "text-gray-500",

    activityQuoteBg: "bg-gray-50",
    activityQuoteBorder: "border-gray-200",
    activityQuoteText: "text-gray-600",
    activityActorText: "text-gray-900",
    activityBodyText: "text-gray-700",
  },

  dark: {
    id: "dark",
    name: "Black Mode",
    description: "Deep obsidian dark mode for nighttime & low eye fatigue",
    icon: Moon,
    swatchBg: "bg-[#09090b]",
    swatchBorder: "border-neutral-700",

    pageBg: "bg-[#090a0f]",
    pageText: "text-white",
    pageSubtitle: "text-neutral-400",
    pageAccent: "text-emerald-400",

    cardBg: "bg-[#12131a]",
    cardBorder: "border-[#22232f]",
    cardShadow: "shadow-lg shadow-black/40",
    cardText: "text-white",
    cardTextMuted: "text-neutral-400",
    subtleBg: "bg-[#1c1d27]",
    divider: "divide-[#1f202c]",

    primaryBtn: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/40",
    accentText: "text-emerald-400 hover:text-emerald-300",
    badgeActiveBg: "bg-emerald-950/70 border-emerald-700/50",
    badgeActiveText: "text-emerald-300",

    statTrendBg: "bg-[#1d1e2a]",
    statTrendText: "text-neutral-300",
    statDecorativeBar: "bg-[#252737]",
    statIconLightFilter: true,

    scheduleTimelineDot: "bg-emerald-400 ring-4 ring-emerald-950/60",
    scheduleTimelineLine: "bg-emerald-600/40",
    scheduleActiveCard: "bg-[#181924] border-[#2d2f42] border-l-4 border-l-emerald-500 shadow-md text-white",
    scheduleInactiveCard: "bg-[#0d0e14] text-neutral-400 border border-[#1b1c26]",
    scheduleActiveTitle: "text-white",
    scheduleActiveSubtext: "text-neutral-300",
    scheduleInactiveTitle: "text-neutral-300",
    scheduleInactiveSubtext: "text-neutral-500",

    activityQuoteBg: "bg-[#171822]",
    activityQuoteBorder: "border-[#27293a]",
    activityQuoteText: "text-neutral-300",
    activityActorText: "text-white",
    activityBodyText: "text-neutral-300",
  },

  gray: {
    id: "gray",
    name: "Slate Gray",
    description: "Modern balanced cool slate palette with neutral contrasts",
    icon: Laptop,
    swatchBg: "bg-[#2d3748]",
    swatchBorder: "border-slate-500",

    pageBg: "bg-[#1a202c]",
    pageText: "text-slate-50",
    pageSubtitle: "text-slate-300",
    pageAccent: "text-emerald-300",

    cardBg: "bg-[#242d3d]",
    cardBorder: "border-[#364359]",
    cardShadow: "shadow-md shadow-slate-950/30",
    cardText: "text-slate-50",
    cardTextMuted: "text-slate-300",
    subtleBg: "bg-[#303c51]",
    divider: "divide-[#2f3b50]",

    primaryBtn: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm",
    accentText: "text-emerald-300 hover:text-emerald-200",
    badgeActiveBg: "bg-slate-800 border-slate-600",
    badgeActiveText: "text-emerald-300",

    statTrendBg: "bg-[#2f3b50]",
    statTrendText: "text-slate-200",
    statDecorativeBar: "bg-[#38465f]",
    statIconLightFilter: true,

    scheduleTimelineDot: "bg-emerald-400 ring-4 ring-slate-800",
    scheduleTimelineLine: "bg-emerald-400/40",
    scheduleActiveCard: "bg-[#2c374b] border-[#3f4f6b] border-l-4 border-l-emerald-400 shadow-md text-slate-50",
    scheduleInactiveCard: "bg-[#1c2331] text-slate-300 border border-[#2b3547]",
    scheduleActiveTitle: "text-slate-50",
    scheduleActiveSubtext: "text-slate-200",
    scheduleInactiveTitle: "text-slate-200",
    scheduleInactiveSubtext: "text-slate-400",

    activityQuoteBg: "bg-[#2a3447]",
    activityQuoteBorder: "border-[#3b4962]",
    activityQuoteText: "text-slate-200",
    activityActorText: "text-slate-50",
    activityBodyText: "text-slate-200",
  },

  forest: {
    id: "forest",
    name: "Forest Night",
    description: "Rich botanical deep green theme honoring midwifery care",
    icon: Trees,
    swatchBg: "bg-[#102914]",
    swatchBorder: "border-emerald-600",

    pageBg: "bg-[#09150b]",
    pageText: "text-emerald-50",
    pageSubtitle: "text-emerald-200/80",
    pageAccent: "text-emerald-300",

    cardBg: "bg-[#0f2313]",
    cardBorder: "border-[#1c3e23]",
    cardShadow: "shadow-md shadow-emerald-950/50",
    cardText: "text-emerald-50",
    cardTextMuted: "text-emerald-200/75",
    subtleBg: "bg-[#16331c]",
    divider: "divide-[#17351d]",

    primaryBtn: "bg-emerald-500 text-gray-950 font-bold hover:bg-emerald-400 shadow-sm",
    accentText: "text-emerald-300 hover:text-emerald-200",
    badgeActiveBg: "bg-[#183920] border-emerald-700/60",
    badgeActiveText: "text-emerald-200",

    statTrendBg: "bg-[#183920]",
    statTrendText: "text-emerald-200",
    statDecorativeBar: "bg-[#1f4728]",
    statIconLightFilter: true,

    scheduleTimelineDot: "bg-emerald-400 ring-4 ring-emerald-950",
    scheduleTimelineLine: "bg-emerald-400/40",
    scheduleActiveCard: "bg-[#132c18] border-[#26532f] border-l-4 border-l-emerald-400 shadow-md text-emerald-50",
    scheduleInactiveCard: "bg-[#0a1b0d] text-emerald-200/80 border border-[#16331a]",
    scheduleActiveTitle: "text-emerald-50",
    scheduleActiveSubtext: "text-emerald-200",
    scheduleInactiveTitle: "text-emerald-200",
    scheduleInactiveSubtext: "text-emerald-300/60",

    activityQuoteBg: "bg-[#132b17]",
    activityQuoteBorder: "border-[#214929]",
    activityQuoteText: "text-emerald-100",
    activityActorText: "text-emerald-50",
    activityBodyText: "text-emerald-200/90",
  },
};

interface MentorThemeContextValue {
  theme: MentorTheme;
  config: ThemeConfig;
  setTheme: (theme: MentorTheme) => void;
}

const MentorThemeContext = createContext<MentorThemeContextValue>({
  theme: "light",
  config: MENTOR_THEMES.light,
  setTheme: () => {},
});

const STORAGE_KEY = "digital_midwife_mentor_theme";

export function MentorThemeProvider({
  children,
  defaultTheme = "light",
}: {
  children: React.ReactNode;
  defaultTheme?: MentorTheme;
}) {
  const [theme, setThemeState] = useState<MentorTheme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as MentorTheme | null;
      if (saved && MENTOR_THEMES[saved]) {
        setThemeState(saved);
      }
    } catch {
      // LocalStorage unavailable
    }
    setMounted(true);
  }, []);

  const setTheme = (next: MentorTheme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // LocalStorage unavailable
    }
  };

  const activeTheme = mounted ? theme : defaultTheme;
  const config = MENTOR_THEMES[activeTheme] || MENTOR_THEMES.light;

  return (
    <MentorThemeContext.Provider value={{ theme: activeTheme, config, setTheme }}>
      {children}
    </MentorThemeContext.Provider>
  );
}

export function useMentorTheme() {
  return useContext(MentorThemeContext);
}
