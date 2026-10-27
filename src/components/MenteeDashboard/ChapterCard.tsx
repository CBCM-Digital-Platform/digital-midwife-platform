"use client";

import { useState } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chapter } from "@/types/mentee-dashboard";
import { ModuleRow, pctOf } from "./ModuleRow";

export function ChapterCard({ chapter }: { chapter: Chapter }) {
    const locked = chapter.status === "LOCKED";
    const [open, setOpen] = useState(!locked);

    const done = chapter.modules.reduce((n, m) => n + m.lessonsDone, 0);
    const total = chapter.modules.reduce((n, m) => n + m.lessonsTotal, 0);
    const pct = pctOf(done, total);
    const openModule = chapter.modules.find((m) => m.status === "IN_PROGRESS" && m.lessons);

    const badge =
        chapter.status === "COMPLETED" ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                <Check className="h-5 w-5" />
            </span>
        ) : chapter.status === "ACTIVE" ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FDD028] text-sm font-bold text-gray-900">
                {chapter.number}
            </span>
        ) : chapter.status === "NEXT" ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-sm font-bold text-gray-700">
                {chapter.number}
            </span>
        ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
                <Lock className="h-4 w-4" />
            </span>
        );

    const status =
        chapter.status === "COMPLETED" ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                ✓ Completed 100%
            </span>
        ) : chapter.status === "ACTIVE" ? (
            <div className="min-w-[200px] text-right">
                <p className="text-xs font-medium text-gray-700">
                    {done} of {total} Lessons
                    {openModule && ` (${pctOf(openModule.lessonsDone, openModule.lessonsTotal)}% on Module ${openModule.number})`}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-[#194611]" style={{ width: `${pct}%` }} />
                </div>
            </div>
        ) : chapter.status === "NEXT" ? (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                Next Up • {pct}% Overall
            </span>
        ) : (
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                <Lock className="h-3 w-3" />
                Locked
            </span>
        );

    const header = (
        <>
            <div className="flex min-w-0 items-center gap-3">
                {badge}
                <div className="min-w-0 text-left">
                    <p className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Chapter {chapter.number} • {chapter.modules.length} Modules
                        {chapter.status === "ACTIVE" && (
                            <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-800">
                                Current Active Chapter
                            </span>
                        )}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900">{chapter.title}</h3>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {status}
                {!locked && (
                    <ChevronDown
                        className={cn("h-5 w-5 shrink-0 text-gray-500 transition-transform", open && "rotate-180")}
                    />
                )}
            </div>
        </>
    );

    const headerClass = "flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4";

    return (
        <section
            className={cn(
                "rounded-xl bg-white",
                chapter.status === "ACTIVE"
                    ? "border-2 border-[#8DB67A] shadow-sm"
                    : "border border-gray-200 shadow-xs",
                locked && "opacity-70"
            )}
        >
            {locked ? (
                <div className={headerClass}>{header}</div>
            ) : (
                <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`chapter-${chapter.id}`}
                    onClick={() => setOpen((o) => !o)}
                    className={cn(headerClass, "rounded-xl hover:bg-gray-50")}
                >
                    {header}
                </button>
            )}

            {open && !locked && (
                <div id={`chapter-${chapter.id}`} className="space-y-2 border-t border-gray-100 px-5 pb-5 pt-4">
                    {chapter.modules.map((m) => (
                        <ModuleRow key={m.id} module={m} />
                    ))}
                </div>
            )}
        </section>
    );
}