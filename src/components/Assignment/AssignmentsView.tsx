"use client";

import { useMemo, useState } from "react";
import { Download, UserPlus } from "lucide-react";
import type {
    Assignment,
    AssignmentFiltersState,
    AssignmentStats,
    AssignmentTab,
} from "@/types/assignment";
import AssignmentFilters, { DEFAULT_FILTERS } from "./AssignmentFilters";
import AssignmentStatsCards from "./AssignmentStatsCards";
import AssignmentTable from "./AssignmentTable";

interface AssignmentsViewProps {
    assignments: Assignment[];
    stats: AssignmentStats;
}

export default function AssignmentsView({ assignments, stats }: AssignmentsViewProps) {
    const [tab, setTab] = useState<AssignmentTab>("all");
    const [filters, setFilters] = useState<AssignmentFiltersState>(DEFAULT_FILTERS);
    const [compact, setCompact] = useState(false);

    const tabCounts = useMemo(
        () => ({
            all: assignments.length,
            active: assignments.filter((a) => a.status === "active").length,
            pending: assignments.filter((a) => a.status === "pending").length,
        }),
        [assignments],
    );

    const options = useMemo(() => {
        const mentors = new Map(assignments.map((a) => [a.mentor.id, a.mentor.name]));
        const unique = (values: string[]) => [...new Set(values)].map((v) => ({ value: v, label: v }));
        return {
            mentors: [...mentors].map(([value, label]) => ({ value, label })),
            facilities: unique(assignments.map((a) => a.facility)),
            domains: unique(assignments.map((a) => a.thematicDomain)),
        };
    }, [assignments]);

    const visible = useMemo(() => {
        const q = filters.search.trim().toLowerCase();
        return assignments.filter((a) => {
            if (tab !== "all" && a.status !== tab) return false;
            if (filters.status !== "all" && a.status !== filters.status) return false;
            if (filters.mentorId !== "all" && a.mentor.id !== filters.mentorId) return false;
            if (filters.facility !== "all" && a.facility !== filters.facility) return false;
            if (filters.domain !== "all" && a.thematicDomain !== filters.domain) return false;
            if (q) {
                const haystack = `${a.mentor.name} ${a.mentor.code} ${a.mentee.name}`.toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [assignments, tab, filters]);

    const tabs: { id: AssignmentTab; label: string }[] = [
        { id: "all", label: "All Assignments" },
        { id: "active", label: "Active Pairings" },
        { id: "pending", label: "Pending Start" },
    ];

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#194611]">Mentorship Assignments</h1>
                    <p className="mt-1 max-w-md text-sm text-gray-600">
                        Match certified institutional mentors with clinical trainees and audit active cohort
                        health.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50"
                    >
                        <Download className="size-4" />
                        Export Data
                    </button>
                    <button
                        type="button"
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#194611] px-4 text-sm font-medium text-white hover:bg-[#194611]/90"
                    >
                        <UserPlus className="size-4" />
                        Add New Assignment
                    </button>
                </div>
            </header>

            <AssignmentStatsCards stats={stats} />

            <section className="rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 pt-3">
                    <div role="tablist" className="flex gap-5">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                role="tab"
                                aria-selected={tab === t.id}
                                onClick={() => setTab(t.id)}
                                className={`-mb-px border-b-2 pb-3 text-sm font-medium ${tab === t.id
                                        ? "border-[#194611] text-[#194611]"
                                        : "border-transparent text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                {t.label}{" "}
                                <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">
                                    {tabCounts[t.id]}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="mb-2 inline-flex rounded-lg border border-gray-200 p-0.5 text-xs">
                        {[
                            { id: false, label: "Detailed" },
                            { id: true, label: "Compact" },
                        ].map((m) => (
                            <button
                                key={m.label}
                                type="button"
                                onClick={() => setCompact(m.id)}
                                className={`rounded-md px-3 py-1 ${compact === m.id ? "bg-gray-100 font-medium" : "text-gray-500"
                                    }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4">
                    <AssignmentFilters
                        filters={filters}
                        onChange={setFilters}
                        mentorOptions={options.mentors}
                        facilityOptions={options.facilities}
                        domainOptions={options.domains}
                    />
                </div>

                <AssignmentTable data={visible} compact={compact} />
            </section>
        </div>
    );
}