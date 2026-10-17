"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    Download,
    UserPlus,
    Sparkles,
    Users,
    History,
    CheckCircle2,
    X,
    LayoutList,
    TableProperties,
} from "lucide-react";
import type {
    Assignment,
    AssignmentFiltersState,
    AssignmentStats,
    AssignmentTab,
} from "@/types/assignment";
import {
    getStoredCreatedAssignments,
    removeCreatedAssignment,
    groupAssignmentsByMentor,
} from "@/services/assignments.service";
import AssignmentFilters, { DEFAULT_FILTERS } from "./AssignmentFilters";
import AssignmentStatsCards from "./AssignmentStatsCards";
import AssignmentTable from "./AssignmentTable";
import HorizontalMentorMenteeView from "./HorizontalMentorMenteeView";

interface AssignmentsViewProps {
    assignments: Assignment[];
    stats: AssignmentStats;
}

export default function AssignmentsView({
    assignments: serverAssignments,
    stats,
}: AssignmentsViewProps) {
    const [tab, setTab] = useState<AssignmentTab>("all");
    const [filters, setFilters] = useState<AssignmentFiltersState>(DEFAULT_FILTERS);
    const [compact, setCompact] = useState(false);
    const [viewMode, setViewMode] = useState<"horizontal" | "table">("horizontal");
    const [createdAssignments, setCreatedAssignments] = useState<Assignment[]>([]);
    const [justCreated, setJustCreated] = useState<Assignment | null>(null);

    // Sync client-side created assignments on mount
    useEffect(() => {
        const stored = getStoredCreatedAssignments();
        setCreatedAssignments(stored);

        // Flash banner check from submission
        const flash = sessionStorage.getItem("cbcm_just_created_assignment");
        if (flash) {
            try {
                const parsed = JSON.parse(flash);
                setJustCreated(parsed);
                sessionStorage.removeItem("cbcm_just_created_assignment");
            } catch {
                // ignore error
            }
        }

        // Query param tab synchronization
        const params = new URLSearchParams(window.location.search);
        if (params.get("tab") === "new") {
            setTab("new");
            setViewMode("horizontal");
        } else if (params.get("tab") === "previous") {
            setTab("previous");
            setViewMode("horizontal");
        }
    }, []);

    // Combine newly created assignments on top of server assignments
    const allAssignments = useMemo(() => {
        const createdIds = new Set(createdAssignments.map((a) => a.id));
        const filteredServer = serverAssignments.filter((a) => !createdIds.has(a.id));
        // Newly created assignments are placed strictly at the top of the list!
        return [...createdAssignments, ...filteredServer];
    }, [createdAssignments, serverAssignments]);

    // Handle removing/dismissing a locally created assignment
    function handleRemoveCreated(id: string) {
        removeCreatedAssignment(id);
        setCreatedAssignments((prev) => prev.filter((a) => a.id !== id));
        if (justCreated?.id === id) {
            setJustCreated(null);
        }
    }

    // Filter options for dropdowns
    const options = useMemo(() => {
        const mentors = new Map(allAssignments.map((a) => [a.mentor.id, a.mentor.name]));
        const unique = (values: string[]) => [...new Set(values)].map((v) => ({ value: v, label: v }));
        return {
            mentors: [...mentors].map(([value, label]) => ({ value, label })),
            facilities: unique(allAssignments.map((a) => a.facility)),
            domains: unique(allAssignments.map((a) => a.thematicDomain)),
        };
    }, [allAssignments]);

    // Apply active filters across assignments
    const filterAssignment = (a: Assignment) => {
        const q = filters.search.trim().toLowerCase();
        if (filters.status !== "all" && a.status !== filters.status) return false;
        if (filters.mentorId !== "all" && a.mentor.id !== filters.mentorId) return false;
        if (filters.facility !== "all" && a.facility !== filters.facility) return false;
        if (filters.domain !== "all" && a.thematicDomain !== filters.domain) return false;
        if (q) {
            const menteeNames = a.mentees ? a.mentees.map((m) => m.name).join(" ") : a.mentee.name;
            const haystack = `${a.mentor.name} ${a.mentor.code} ${menteeNames}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        return true;
    };

    // 1. All assignments (with newly created at the very top)
    const filteredAll = useMemo(() => {
        return allAssignments.filter(filterAssignment);
    }, [allAssignments, filters]);

    // 2. New assignments (only newly created assignments)
    const filteredNew = useMemo(() => {
        return allAssignments.filter((a) => a.isNew).filter(filterAssignment);
    }, [allAssignments, filters]);

    // 3. Previous assignments (grouped by mentor with their respective assigned mentees)
    const previousGrouped = useMemo(() => {
        const previousOnly = allAssignments.filter((a) => !a.isNew);
        const grouped = groupAssignmentsByMentor(previousOnly);
        return grouped.filter(filterAssignment);
    }, [allAssignments, filters]);

    // Tab counts
    const tabCounts = useMemo(
        () => ({
            all: allAssignments.length,
            new: allAssignments.filter((a) => a.isNew).length,
            previous: previousGrouped.length,
        }),
        [allAssignments, previousGrouped],
    );

    const tabs: { id: AssignmentTab; label: string; icon: React.ReactNode; count: number }[] = [
        {
            id: "all",
            label: "All Assignments",
            icon: <Users className="size-4" />,
            count: tabCounts.all,
        },
        {
            id: "new",
            label: "New Assignments",
            icon: <Sparkles className="size-4 text-emerald-600" />,
            count: tabCounts.new,
        },
        {
            id: "previous",
            label: "Previous Assignments",
            icon: <History className="size-4 text-gray-500" />,
            count: tabCounts.previous,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#194611]">Mentorship Assignments</h1>
                    <p className="mt-1 max-w-xl text-sm text-gray-600">
                        Pair certified clinical mentors with midwifery trainees, view horizontal mentor-mentee
                        relationships, and manage cohort transitions.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50 shadow-2xs"
                    >
                        <Download className="size-4" />
                        Export Data
                    </button>
                    <Link
                        href="/assignments/new"
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#194611] px-4 text-sm font-medium text-white hover:bg-[#194611]/90 shadow-xs"
                    >
                        <UserPlus className="size-4" />
                        Add New Assignment
                    </Link>
                </div>
            </header>

            {/* Just-Created Success Banner */}
            {justCreated && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                            <CheckCircle2 className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">
                                Mentorship Assignment Created Successfully!
                            </p>
                            <p className="text-xs text-emerald-800 mt-0.5">
                                Mentor <span className="font-semibold">{justCreated.mentor.name}</span> has been
                                paired with{" "}
                                <span className="font-semibold">
                                    {justCreated.mentees?.length || 1} mentee(s)
                                </span>{" "}
                                and placed at the top of the All Assignments list.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setJustCreated(null)}
                        className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 transition"
                        title="Dismiss banner"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <AssignmentStatsCards stats={stats} />

            {/* Main Tabs and Content Section */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-2xs">
                {/* Tabs & View Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 pt-3">
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
                                {t.icon}
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

                    {/* View Switchers */}
                    <div className="mb-2 flex items-center gap-3">
                        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50/70 p-0.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setViewMode("horizontal")}
                                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition cursor-pointer ${
                                    viewMode === "horizontal"
                                        ? "bg-white text-gray-900 shadow-2xs"
                                        : "text-gray-500 hover:text-gray-900"
                                }`}
                                title="Horizontal mentor with list of mentees view"
                            >
                                <LayoutList className="size-3.5 text-[#194611]" />
                                Horizontal View
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("table")}
                                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition cursor-pointer ${
                                    viewMode === "table"
                                        ? "bg-white text-gray-900 shadow-2xs"
                                        : "text-gray-500 hover:text-gray-900"
                                }`}
                                title="Standard table view"
                            >
                                <TableProperties className="size-3.5 text-[#194611]" />
                                Table View
                            </button>
                        </div>

                        {viewMode === "table" && (
                            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs">
                                {[
                                    { id: false, label: "Detailed" },
                                    { id: true, label: "Compact" },
                                ].map((m) => (
                                    <button
                                        key={m.label}
                                        type="button"
                                        onClick={() => setCompact(m.id)}
                                        className={`rounded-md px-2.5 py-1 ${
                                            compact === m.id
                                                ? "bg-gray-100 font-medium text-gray-900"
                                                : "text-gray-500"
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-gray-100">
                    <AssignmentFilters
                        filters={filters}
                        onChange={setFilters}
                        mentorOptions={options.mentors}
                        facilityOptions={options.facilities}
                        domainOptions={options.domains}
                    />
                </div>

                {/* Content based on Active Tab */}
                <div className="p-4">
                    {tab === "all" && (
                        <div>
                            {viewMode === "horizontal" ? (
                                <HorizontalMentorMenteeView
                                    data={filteredAll}
                                    onRemove={handleRemoveCreated}
                                    emptyTitle="No assignments found"
                                    emptyDescription="Try clearing search filters or add a new assignment."
                                />
                            ) : (
                                <AssignmentTable data={filteredAll} compact={compact} />
                            )}
                        </div>
                    )}

                    {tab === "new" && (
                        <div>
                            {viewMode === "horizontal" ? (
                                <HorizontalMentorMenteeView
                                    data={filteredNew}
                                    onRemove={handleRemoveCreated}
                                    emptyTitle="No New Assignments Created Yet"
                                    emptyDescription="When you create an assignment, the mentor and their list of assigned mentees will appear here horizontally and at the top of the All Assignments list."
                                    actionHref="/assignments/new"
                                    actionLabel="Create First Assignment"
                                />
                            ) : (
                                <AssignmentTable data={filteredNew} compact={compact} />
                            )}
                        </div>
                    )}

                    {tab === "previous" && (
                        <div>
                            {viewMode === "horizontal" ? (
                                <HorizontalMentorMenteeView
                                    data={previousGrouped}
                                    emptyTitle="No previous assignments found"
                                    emptyDescription="No prior mentor-mentee pairings match the chosen criteria."
                                />
                            ) : (
                                <AssignmentTable data={previousGrouped} compact={compact} />
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}