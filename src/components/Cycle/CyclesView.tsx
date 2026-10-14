"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Calendar, Filter, Plus } from "lucide-react";
import type { Cycle, CycleStatus } from "@/types/cycle";
import CycleCard from "./CycleCard";
import CycleSnapshot from "./CycleSnapshot";

export default function CyclesView({ cycles }: { cycles: Cycle[] }) {
    const [status, setStatus] = useState<"ALL" | CycleStatus>("ALL");
    const [year, setYear] = useState("ALL");
    const [selectedId, setSelectedId] = useState<string | null>(
        cycles.find((c) => c.status === "ACTIVE")?.id ?? null
    );

    const years = useMemo(
        () =>
            Array.from(new Set(cycles.map((c) => new Date(c.startDate).getUTCFullYear()))).sort(
                (a, b) => b - a
            ),
        [cycles]
    );

    const filtered = useMemo(
        () =>
            cycles.filter(
                (c) =>
                    (status === "ALL" || c.status === status) &&
                    (year === "ALL" || new Date(c.startDate).getUTCFullYear() === Number(year))
            ),
        [cycles, status, year]
    );

    const selected = filtered.find((c) => c.id === selectedId) ?? null;

    const selectClass =
        "appearance-none bg-transparent pr-1 text-sm font-medium text-gray-800 outline-none";

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Mentorship Cycles</h1>

                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as "ALL" | CycleStatus)}
                            className={selectClass}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PLANNING">Planning</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </label>

                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className={selectClass}
                        >
                            <option value="ALL">All Years</option>
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </label>

                    <Link
                        href="/cycles/new"
                        className="flex items-center gap-2 rounded-lg bg-[#0B5D3B] px-4 py-2 text-sm font-medium text-white hover:bg-[#094d31]"
                    >
                        <Plus className="h-4 w-4" />
                        Create New Cycle
                    </Link>
                </div>
            </div>

            <div
                className={`grid gap-6 ${selected ? "lg:grid-cols-[1fr_340px]" : "grid-cols-1"} items-start`}
            >
                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                            No cycles match these filters.
                        </p>
                    ) : (
                        filtered.map((cycle) => (
                            <CycleCard
                                key={cycle.id}
                                cycle={cycle}
                                selected={cycle.id === selectedId}
                                onSelect={() => setSelectedId(cycle.id)}
                            />
                        ))
                    )}
                </div>

                {selected && (
                    <CycleSnapshot cycle={selected} onClose={() => setSelectedId(null)} />
                )}
            </div>
        </div>
    );
}