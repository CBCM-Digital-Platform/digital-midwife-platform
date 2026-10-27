import type { ReactNode } from "react";
import { BookOpen, ClipboardCheck, Zap } from "lucide-react";
import type { CurriculumSummary } from "@/types/mentee-dashboard";
import { ProgressRing } from "./ProgressRing";

function StatCard({
    label,
    icon,
    children,
}: {
    label: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                {children}
            </div>
            {icon}
        </div>
    );
}

function IconBox({ className, children }: { className: string; children: ReactNode }) {
    return <span className={`rounded-lg p-2.5 ${className}`}>{children}</span>;
}

interface Props {
    summary: CurriculumSummary;
    modulePassRate: number;
    cpdHours: number;
    cpdTarget: number;
}

export function SummaryCards({ summary, modulePassRate, cpdHours, cpdTarget }: Props) {
    const chaptersNext = Math.max(
        summary.chaptersTotal - summary.chaptersDone - summary.chaptersActive,
        0
    );

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Curriculum Progress" icon={<ProgressRing value={summary.progressPct} />}>
                <p className="mt-2 text-3xl font-bold text-gray-900">{summary.progressPct}%</p>
                <p className="mt-1 text-xs text-gray-500">
                    {summary.lessonsDone} of {summary.lessonsTotal} Lessons finished
                </p>
            </StatCard>

            <StatCard
                label="Chapters Status"
                icon={
                    <IconBox className="bg-amber-50 text-amber-700">
                        <BookOpen className="h-5 w-5" />
                    </IconBox>
                }
            >
                <p className="mt-2 text-3xl font-bold text-gray-900">
                    {summary.chaptersDone} / {summary.chaptersTotal}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    {summary.chaptersDone} Done • {summary.chaptersActive} Active • {chaptersNext} Next
                </p>
            </StatCard>

            <StatCard
                label="Modules Completed"
                icon={
                    <IconBox className="bg-green-50 text-green-700">
                        <ClipboardCheck className="h-5 w-5" />
                    </IconBox>
                }
            >
                <p className="mt-2 text-3xl font-bold text-gray-900">
                    {summary.modulesPassed} / {summary.modulesTotal}
                </p>
                <p className="mt-1">
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-800">
                        {modulePassRate}% module clearance
                    </span>
                </p>
            </StatCard>

            <StatCard
                label="Clinical CPD Credits"
                icon={
                    <IconBox className="bg-amber-50 text-amber-700">
                        <Zap className="h-5 w-5" />
                    </IconBox>
                }
            >
                <p className="mt-2 text-3xl font-bold text-gray-900">{cpdHours} hrs</p>
                <p className="mt-1 text-xs text-gray-500">Target: {cpdTarget} hrs for Board Renewal</p>
            </StatCard>
        </div>
    );
}