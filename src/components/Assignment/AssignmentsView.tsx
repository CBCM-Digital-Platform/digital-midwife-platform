"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import type {
    Assignment,
    AssignmentFiltersState,
    AssignmentStats,
} from "@/types/assignment";
import { groupAssignmentsByMentor } from "@/services/assignments.service";
import AssignmentFilters, { DEFAULT_FILTERS } from "./AssignmentFilters";
import AssignmentStatsCards from "./AssignmentStatsCards";
import AssignmentTable from "./AssignmentTable";

interface AssignmentsViewProps {
    assignments: Assignment[];
    stats: AssignmentStats;
}

type TabType = "all" | "active" | "pending";

export default function AssignmentsView({
    assignments: serverAssignments,
    stats,
}: AssignmentsViewProps) {
    const router = useRouter();
    const [tab, setTab] = useState<TabType>("all");
    const [filters, setFilters] = useState<AssignmentFiltersState>(DEFAULT_FILTERS);

    // Group assignments by mentor so each mentor appears once with all her assigned mentees
    const allAssignments = useMemo(
        () => groupAssignmentsByMentor(serverAssignments),
        [serverAssignments]
    );

    // Filter options for dropdowns
    const options = useMemo(() => {
        const mentorsMap = new Map<string, string>();
        for (const a of allAssignments) {
            if (a.mentor && a.mentor.id) {
                mentorsMap.set(String(a.mentor.id), a.mentor.name);
            }
        }

        const rawDomains = allAssignments
            .map((a) => a.thematicDomain?.trim())
            .filter((d): d is string => Boolean(d));
        const uniqueDomains = [...new Set(rawDomains)].sort();

        return {
            mentors: [...mentorsMap.entries()].map(([value, label]) => ({ value, label })),
            domains: uniqueDomains.map((v) => ({ value: v, label: v })),
        };
    }, [allAssignments]);

    // Compute key facility mentorship metrics
    const activeAssignments = useMemo(
        () => allAssignments.filter((a) => a.status === "active").length,
        [allAssignments],
    );
    const pendingAssignments = useMemo(
        () => allAssignments.filter((a) => a.status !== "active").length,
        [allAssignments],
    );
    const assignedMentorsCount = useMemo(
        () => new Set(allAssignments.map((a) => a.mentor.id)).size,
        [allAssignments],
    );
    const assignedMenteesCount = useMemo(
        () =>
            allAssignments.reduce(
                (sum, a) => sum + (a.mentees && a.mentees.length > 0 ? a.mentees.length : 1),
                0,
            ),
        [allAssignments],
    );
    const newAssignmentsCount = useMemo(
        () => allAssignments.filter((a) => a.isNew).length,
        [allAssignments],
    );

    // Apply active filters across assignments
    const filteredAssignments = useMemo(() => {
        return allAssignments.filter((a) => {
            // 1. Tab Status Filter
            if (tab === "active" && a.status !== "active") return false;
            if (tab === "pending" && a.status === "active") return false;

            // 2. Mentor Filter
            if (
                filters.mentorId !== "all" &&
                String(a.mentor.id).trim() !== String(filters.mentorId).trim()
            ) {
                return false;
            }

            // 3. Thematic Area Filter
            if (filters.domain !== "all") {
                const aDomain = (a.thematicDomain || "").toLowerCase().trim();
                const fDomain = filters.domain.toLowerCase().trim();
                if (aDomain !== fDomain && !aDomain.includes(fDomain)) {
                    return false;
                }
            }

            // 4. Search Filter
            const q = filters.search.trim().toLowerCase();
            if (q) {
                const menteeNames =
                    a.mentees && a.mentees.length > 0
                        ? a.mentees.map((m) => m.name).join(" ")
                        : a.mentee?.name || "";
                const idStr = String(a.id || "");
                const mentorCode = String(a.mentor?.code || "");
                const mentorName = String(a.mentor?.name || "");
                const thematicDomain = String(a.thematicDomain || "");
                const facility = String(a.facility || "");

                const haystack = `${idStr} #${idStr} ${mentorName} ${mentorCode} ${menteeNames} ${thematicDomain} ${facility}`.toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            return true;
        });
    }, [allAssignments, tab, filters]);

    const tabs: { id: TabType; label: string; count: number }[] = [
        {
            id: "all",
            label: "All Assignments",
            count: allAssignments.length,
        },
        {
            id: "active",
            label: "Active Pairings",
            count: activeAssignments,
        },
        {
            id: "pending",
            label: "Pending Start",
            count: pendingAssignments,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#194611]">Mentorship Assignments</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Pair certified clinical mentors with midwifery trainees, oversee clinical cohorts, and track thematic mentorship pathways.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/assignments/new"
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#194611] px-4 text-sm font-semibold text-white transition hover:bg-[#194611]/90 shadow-xs"
                    >
                        <UserPlus className="size-4" />
                        Add New Assignment
                    </Link>
                </div>
            </header>

            {/* Stats Cards */}
            <AssignmentStatsCards
                stats={stats}
                totalAssignments={allAssignments.length}
                activeAssignments={activeAssignments}
                assignedMentorsCount={assignedMentorsCount}
                assignedMenteesCount={assignedMenteesCount}
                newAssignmentsCount={newAssignmentsCount}
            />

            {/* Main Table and Filters Card */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-2xs">
                {/* Tabs */}
                <div className="border-b border-gray-200 px-4 pt-3">
                    <div role="tablist" className="flex flex-wrap gap-6">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                role="tab"
                                aria-selected={tab === t.id}
                                onClick={() => setTab(t.id)}
                                className={`-mb-px inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition cursor-pointer ${
                                    tab === t.id
                                        ? "border-[#194611] text-[#194611] font-semibold"
                                        : "border-transparent text-gray-500 hover:text-gray-800"
                                }`}
                            >
                                {t.label}
                                <span
                                    className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        tab === t.id
                                            ? "bg-emerald-100 text-[#194611]"
                                            : "bg-gray-100 text-gray-600"
                                    }`}
                                >
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="border-b border-gray-100 p-4">
                    <AssignmentFilters
                        filters={filters}
                        onChange={setFilters}
                        mentorOptions={options.mentors}
                        domainOptions={options.domains}
                    />
                </div>

                {/* Assignments Table */}
                <div className="p-4">
                    <AssignmentTable
                        data={filteredAssignments}
                        onRowClick={(a) => router.push(`/assignments/${a.id}`)}
                    />
                </div>
            </section>
        </div>
    );
}
