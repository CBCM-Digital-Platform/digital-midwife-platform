import { AlertTriangle, ChevronRight, Users, Zap } from "lucide-react";
import type { AssignmentStats } from "@/types/assignment";
import Avatar from "./Avatar";

interface AssignmentStatsCardsProps {
    stats: AssignmentStats;
}

function percent(part: number, total: number) {
    return total === 0 ? 0 : Math.round((part / total) * 100);
}

export default function AssignmentStatsCards({ stats }: AssignmentStatsCardsProps) {
    const { availableMentors: mentors, unassignedMentees: mentees } = stats;
    const total = mentors.vacant + mentors.balanced + mentors.atLimit;

    const workload = [
        { label: "0/3 Workload (Vacant)", value: mentors.vacant, bar: "bg-[#194611]" },
        { label: "1–2/3 (Balanced)", value: mentors.balanced, bar: "bg-amber-600" },
        { label: "3/3 (At Limit)", value: mentors.atLimit, bar: "bg-red-600" },
    ];

    return (
        <div className="grid gap-4 lg:grid-cols-5">
            {/* Available mentors */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-3">
                <header className="flex items-start justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Facility roster health</p>
                        <h2 className="text-lg font-semibold text-[#194611]">Available Mentors</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">{mentors.readyToIntake}</p>
                        <p className="text-xs text-gray-500">Ready to intake</p>
                    </div>
                </header>

                <div className="mt-4 grid grid-cols-3 gap-3">
                    {workload.map((item) => (
                        <div key={item.label} className="rounded-lg border border-gray-200 p-3">
                            <p className="text-[11px] text-gray-500">{item.label}</p>
                            <div className="mt-1 flex items-baseline justify-between">
                                <span className="text-xl font-semibold">{item.value}</span>
                                <span className="text-xs text-gray-500">{percent(item.value, total)}%</span>
                            </div>
                            <div className="mt-2 h-1 rounded bg-gray-100">
                                <div
                                    className={`h-1 rounded ${item.bar}`}
                                    style={{ width: `${percent(item.value, total)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500">Ready candidate leads:</span>
                    {mentors.leads.map((lead) => (
                        <span
                            key={lead.id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-0.5 pl-0.5 pr-2.5 text-xs"
                        >
                            <Avatar size="sm" person={{ name: lead.name, initials: lead.initials }} />
                            {lead.name} · {lead.specialty} · {lead.load}
                        </span>
                    ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">
                        100% compliant with Regional Health Authority capping rules
                    </p>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                        Auto-Match Intake
                        <Zap className="size-4" />
                    </button>
                </div>
            </section>

            {/* Unassigned mentees */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
                <header className="flex items-start justify-between">
                    <div>
                        <p className="text-xs text-gray-500">
                            Queue priority{" "}
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                                {mentees.urgent} High Urgency
                            </span>
                        </p>
                        <h2 className="text-lg font-semibold text-[#194611]">Unassigned Mentees</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">{mentees.total}</p>
                        <p className="text-xs text-gray-500">Awaiting pairing</p>
                    </div>
                </header>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <span className="inline-flex items-center gap-2">
                        <AlertTriangle className="size-4" />
                        {mentees.waitingOver14Days} residents waiting &gt; 14 days
                    </span>
                    <button type="button" className="text-xs font-semibold text-amber-800 hover:underline">
                        Escalate
                    </button>
                </div>

                <div className="mt-4">
                    <p className="text-xs text-gray-500">Distribution by specialty need:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {mentees.bySpecialty.map((item) => (
                            <span key={item.label} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">
                                {item.label} {item.count}
                            </span>
                        ))}
                    </div>
                </div>

                {mentees.nextInQueue && (
                    <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-500">
                            Next in queue: {mentees.nextInQueue.name} ({mentees.nextInQueue.specialty})
                        </p>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#194611] px-4 py-2 text-sm font-medium text-white hover:bg-[#194611]/90"
                        >
                            <Users className="size-4" />
                            Assign Next Mentee
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}