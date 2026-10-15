"use client";

import { Calendar, MoreVertical } from "lucide-react";
import type { Cycle } from "@/types/cycle";
import CycleStatusBadge from "./CycleStatusBadge";

function formatRange(start: string, end: string) {
    const opts: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "2-digit",
        timeZone: "UTC",
    };
    const s = new Date(start).toLocaleDateString("en-US", opts);
    const e = new Date(end).toLocaleDateString("en-US", { ...opts, year: "numeric" });
    return `${s} - ${e}`;
}

interface Props {
    cycle: Cycle;
    selected: boolean;
    onSelect: () => void;
}

export default function CycleCard({ cycle, selected, onSelect }: Props) {
    const isTerminal = cycle.status === "COMPLETED" || cycle.status === "CANCELLED";
    const progressLabel = cycle.status === "PLANNING" || cycle.status === "DRAFT" ? "Readiness" : "Progress";
    const barColor = cycle.status === "PLANNING" || cycle.status === "DRAFT" ? "bg-amber-400" : "bg-[#0B5D3B]";

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect();
                }
            }}
            className={`cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition ${selected ? "border-2 border-[#0B5D3B]" : "border-gray-200 hover:border-gray-300"
                } ${isTerminal ? "opacity-70" : ""}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cycle.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatRange(cycle.startDate, cycle.endDate)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <CycleStatusBadge status={cycle.status} />
                    <button
                        type="button"
                        aria-label="Cycle actions"
                        onClick={(e) => e.stopPropagation()} // TODO: edit / delete menu
                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {!isTerminal && (
                <>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        {[
                            { label: "FACILITIES", value: cycle.facilities },
                            { label: "MENTORS", value: cycle.mentors },
                            { label: "MENTEES", value: cycle.mentees },
                        ].map((stat) => (
                            <div key={stat.label} className="rounded-lg border border-gray-200 p-3">
                                <p className="text-[11px] font-medium tracking-wide text-gray-500">
                                    {stat.label}
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4">
                        <div className="mb-1 flex justify-between text-sm text-gray-600">
                            <span>{progressLabel}</span>
                            <span>{cycle.progress}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${cycle.progress}%` }}
                            />
                        </div>
                    </div>
                </>
            )}
        </article>
    );
}