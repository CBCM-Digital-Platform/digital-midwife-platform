import React from "react";
import Link from "next/link";

export interface MenteeDashboardViewProps {
  displayName: string;
}

export function MenteeDashboardView({ displayName }: MenteeDashboardViewProps) {
  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#194611]">
        Welcome back, {displayName}!
      </h1>

      <div className="bg-[#194611] text-white p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-emerald-200">
            Active Clinical Pathway • Chapter 2 of 4
          </p>
          <h2 className="text-lg sm:text-xl font-medium">
            You are currently completing Chapter 2: Intrapartum Care & Clinical Obstetric Skills.
          </h2>
          <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm bg-white/10 p-3 rounded-lg">
            <span className="font-bold tracking-wider text-emerald-200">
              NEXT UP IN MODULE 4
            </span>
            <span className="font-semibold">
              Lesson 2: Fundal Height & Palpation Assessment (75% Complete)
            </span>
          </div>
        </div>
        <Link
          href="/learning"
          className="bg-[#FDD028] text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400 transition shrink-0 w-full md:w-auto text-center cursor-pointer shadow-xs inline-block"
        >
          Resume Lesson
        </Link>
      </div>
    </div>
  );
}
