import type { ReactNode } from "react";
import { CheckCircle2, ClipboardCheck, GraduationCap, Star, Users } from "lucide-react";
import type { ReportKpis } from "@/types/report";

function KpiCard({
    label,
    value,
    icon,
    accent,
    children,
}: {
    label: string;
    value: string;
    icon: ReactNode;
    accent: string; // tailwind border color class
    children: ReactNode;
}) {
    return (
        <div className={`rounded-xl border border-gray-200 border-t-4 bg-white p-4 shadow-sm ${accent}`}>
            <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold tracking-wide text-gray-500">{label}</p>
                <span className="rounded-lg bg-green-50 p-1.5 text-[#0B5D3B]">{icon}</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function Chip({ strong, text }: { strong: string; text: string }) {
    return (
        <p className="flex items-center gap-2 text-xs text-gray-500">
            <span className="rounded bg-green-100 px-1.5 py-0.5 font-semibold text-green-800">
                {strong}
            </span>
            {text}
        </p>
    );
}

export default function ReportKpiCards({ kpis }: { kpis: ReportKpis }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
                label="TOTAL MENTORS"
                value={kpis.totalMentors.toLocaleString()}
                icon={<Users className="h-4 w-4" />}
                accent="border-t-[#0B5D3B]"
            >
                <Chip strong={`+${kpis.mentorsChangePct}%`} text="vs. previous cycle" />
            </KpiCard>

            <KpiCard
                label="TOTAL MENTEES"
                value={kpis.totalMentees.toLocaleString()}
                icon={<GraduationCap className="h-4 w-4" />}
                accent="border-t-[#0B5D3B]"
            >
                <Chip strong={`+${kpis.menteesChangePct}%`} text="new enrollments" />
            </KpiCard>

            <KpiCard
                label="ACTIVE ASSIGNMENTS"
                value={kpis.activeAssignments.toLocaleString()}
                icon={<ClipboardCheck className="h-4 w-4" />}
                accent="border-t-yellow-400"
            >
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Pairing capacity target</span>
                    <span className="font-semibold text-gray-800">{kpis.pairingCapacityPct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                        className="h-full rounded-full bg-[#0B5D3B]"
                        style={{ width: `${kpis.pairingCapacityPct}%` }}
                    />
                </div>
            </KpiCard>

            <KpiCard
                label="AVG KNOWLEDGE SCORE"
                value={`${kpis.avgKnowledgeScore}%`}
                icon={<Star className="h-4 w-4" />}
                accent="border-t-yellow-400"
            >
                <Chip strong={`+${kpis.scoreDeltaPts} pts`} text="pre vs. post cohort delta" />
            </KpiCard>

            <KpiCard
                label="COMPLETED CYCLES"
                value={String(kpis.completedCycles)}
                icon={<CheckCircle2 className="h-4 w-4" />}
                accent="border-t-[#0B5D3B]"
            >
                <Chip strong={`${kpis.onScheduleCompletionPct}%`} text="on-schedule completion" />
            </KpiCard>
        </div>
    );
}