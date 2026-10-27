import Link from "next/link";
import { Check, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CurriculumModule, Lesson } from "@/types/mentee-dashboard";

export const pctOf = (done: number, total: number) =>
    total > 0 ? Math.round((done / total) * 100) : 0;

function LessonRow({ lesson, index }: { lesson: Lesson; index: number }) {
    const label = `Lesson ${index + 1}: ${lesson.title}`;

    if (lesson.status === "CURRENT") {
        return (
            <li className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {index + 1}
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">{label}</span>
                {lesson.detail && (
                    <span className="hidden text-xs text-gray-500 sm:inline">{lesson.detail}</span>
                )}
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {lesson.progressPct ?? 0}% Done
                </span>
            </li>
        );
    }

    const completed = lesson.status === "COMPLETED";
    return (
        <li className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50">
            {completed ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Check className="h-3.5 w-3.5" />
                </span>
            ) : (
                <Circle className="h-5 w-5 shrink-0 text-gray-300" />
            )}
            <span className="min-w-0 flex-1 text-sm text-gray-800">{label}</span>
            <span className={cn("text-xs font-medium", completed ? "text-green-700" : "text-amber-700")}>
                {completed ? "Completed" : (lesson.note ?? "Not started")}
            </span>
        </li>
    );
}

function OpenModule({ module: m }: { module: CurriculumModule }) {
    const pct = pctOf(m.lessonsDone, m.lessonsTotal);

    return (
        <div className="rounded-lg border border-amber-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Module {m.number}
                        {m.kind ? ` • ${m.kind}` : ""}
                    </p>
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-gray-900">
                        {m.title}
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                            In Progress
                        </span>
                    </p>
                </div>
                <p className="text-xs text-gray-600">
                    {m.lessonsDone} of {m.lessonsTotal} Lessons Completed • {pct}%
                </p>
            </div>

            <ul className="space-y-1.5 p-3">
                {m.lessons?.map((lesson, i) => (
                    <LessonRow key={lesson.id} lesson={lesson} index={i} />
                ))}
            </ul>

            <div className="flex justify-end px-3 pb-3">
                {/* TODO: deep-link to the module once the lesson player exists */}
                <Link
                    href="/learning"
                    className="rounded-lg bg-[#194611] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f2f0b]"
                >
                    Continue Module {m.number} ›
                </Link>
            </div>
        </div>
    );
}

export function ModuleRow({ module: m }: { module: CurriculumModule }) {
    if (m.status === "IN_PROGRESS" && m.lessons && m.lessons.length > 0) {
        return <OpenModule module={m} />;
    }

    const pct = pctOf(m.lessonsDone, m.lessonsTotal);
    const title = `Module ${m.number}: ${m.title}`;
    const rowBase = "flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm";

    if (m.status === "LOCKED") {
        return (
            <div className={cn(rowBase, "bg-gray-50 text-gray-400")}>
                <span className="flex min-w-0 items-center gap-2">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    {title}
                </span>
                <span className="text-xs">
                    Locked{m.lockedNote ? ` (${m.lockedNote})` : ""}
                </span>
            </div>
        );
    }

    if (m.status === "PASSED") {
        return (
            <div className={cn(rowBase, "bg-[#F1F5EC]")}>
                <span className="flex min-w-0 items-center gap-2 text-gray-900">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-green-600" />
                    {title}
                </span>
                <span className="flex items-center gap-3 text-xs text-gray-600">
                    {m.lessonsDone}/{m.lessonsTotal} Lessons Completed
                    <span className="rounded bg-green-100 px-2 py-0.5 font-semibold text-green-800">
                        100% Passed
                    </span>
                </span>
            </div>
        );
    }

    const active = m.status === "IN_PROGRESS";
    return (
        <div className={cn(rowBase, "bg-gray-50")}>
            <span className="flex min-w-0 items-center gap-2 text-gray-900">
                <span
                    className={cn("h-2 w-2 shrink-0 rounded-full", active ? "bg-amber-500" : "bg-gray-400")}
                />
                {title}
            </span>
            {active ? (
                <span className="flex items-center gap-3 text-xs text-gray-600">
                    {m.lessonsDone}/{m.lessonsTotal} Lessons Completed
                    <span className="rounded bg-white px-2 py-0.5 font-semibold text-gray-700">{pct}%</span>
                </span>
            ) : (
                <span className="text-xs text-gray-600">
                    {m.lessonsDone}/{m.lessonsTotal} Lessons ({pct}%)
                </span>
            )}
        </div>
    );
}