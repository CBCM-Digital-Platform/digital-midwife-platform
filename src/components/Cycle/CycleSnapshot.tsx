"use client";

import { ClipboardList, TrendingUp, X } from "lucide-react";
import type { Cycle } from "@/types/cycle";
import CycleStatusBadge from "./CycleStatusBadge";

interface Props {
    cycle: Cycle;
    onClose: () => void;
}

export default function CycleSnapshot({ cycle, onClose }: Props) {
    return (
        <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-lg font-semibold text-gray-900">Cycle Snapshot</h2>
                <button
                    type="button"
                    aria-label="Close snapshot"
                    onClick={onClose}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-5 text-center">
                <h3 className="text-xl font-bold text-gray-900">{cycle.name}</h3>
                <div className="mt-2">
                    <CycleStatusBadge status={cycle.status} />
                </div>
            </div>

            <div className="mt-5 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                    <div className="rounded-lg bg-green-100 p-2 text-[#0B5D3B]">
                        <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-gray-900">{cycle.assignmentsLinked}</p>
                        <p className="text-xs text-gray-500">Assignments Linked</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 pt-3">
                    <div className="rounded-lg bg-yellow-100 p-2 text-yellow-600">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-gray-900">{cycle.averageScore}%</p>
                        <p className="text-xs text-gray-500">Average Score</p>
                    </div>
                </div>
            </div>

            {cycle.milestones.length > 0 && (
                <div className="mt-5">
                    <p className="text-xs font-semibold tracking-wide text-gray-500">
                        RECENT MILESTONES
                    </p>
                    <ul className="mt-3 space-y-3">
                        {cycle.milestones.map((m) => (
                            <li key={m.id} className="flex gap-3">
                                <span
                                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.done ? "bg-[#0B5D3B]" : "bg-gray-300"
                                        }`}
                                />
                                <div>
                                    <p className={`text-sm ${m.done ? "text-gray-900" : "text-gray-500"}`}>
                                        {m.title}
                                    </p>
                                    <p className="text-xs text-gray-400">{m.when}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <button
                type="button"
                className="mt-6 rounded-lg bg-[#0B5D3B] px-5 py-2 text-sm font-medium text-white hover:bg-[#094d31]"
            >
                View Details
            </button>
        </aside>
    );
}