"use client";

import { useMemo, useState } from "react";
import { Download, LayoutGrid, List, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MyMentee } from "@/types/my-mentee";
import { LEVEL_LABEL, formatSessionDate } from "@/components/MyMentees/MenteeParts";
import { MenteesTable } from "@/components/MyMentees/MenteesTable";
import { MenteesPagination } from "@/components/MyMentees/MenteesPagination";
import { FacilityDropdown } from "./FacilityDropdown";
import { RosterCards } from "./RosterCards";

type StatusFilter = "ACTIVE" | "INACTIVE" | "ALL";

const PAGE_SIZE = 9;

function downloadList(rows: MyMentee[]) {
    const header = [
        "Mentee ID",
        "Name",
        "Title",
        "Facility",
        "Competency Level",
        "Status",
        "Last Session",
    ];
    const lines = rows.map((m) =>
        [
            m.code,
            m.name,
            m.title,
            m.facility,
            LEVEL_LABEL[m.level],
            m.active ? "Active" : "Inactive",
            formatSessionDate(m.lastSession),
        ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mentee-roster.csv";
    a.click();
    URL.revokeObjectURL(url);
}

export function FacilityRosterView({
    mentees,
    asOf,
    initialFacility = "ALL",
}: {
    mentees: MyMentee[];
    asOf: string;
    initialFacility?: string;
}) {
    const [search, setSearch] = useState("");
    const [facility, setFacility] = useState(
        mentees.some((m) => m.facility === initialFacility) ? initialFacility : "ALL"
    );
    const [status, setStatus] = useState<StatusFilter>("ACTIVE");
    const [view, setView] = useState<"grid" | "list">("grid");
    const [page, setPage] = useState(1);

    const byStatus = useMemo(
        () =>
            mentees.filter(
                (m) => status === "ALL" || (status === "ACTIVE" ? m.active : !m.active)
            ),
        [mentees, status]
    );

    // Dropdown counts follow the status filter, so they match what the list shows
    const options = useMemo(() => {
        const names = Array.from(new Set(mentees.map((m) => m.facility)));
        return names
            .map((name) => ({ name, count: byStatus.filter((m) => m.facility === name).length }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }, [mentees, byStatus]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return byStatus.filter(
            (m) =>
                (facility === "ALL" || m.facility === facility) &&
                (!q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
        );
    }, [byStatus, facility, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const toggleClass = (active: boolean) =>
        cn(
            "rounded-md p-1.5",
            active ? "bg-green-100 text-[#194611]" : "text-gray-500 hover:bg-gray-100"
        );

    const pagination = (
        <MenteesPagination
            page={safePage}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
        />
    );

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mentee Roster</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage and track progress for your assigned clinical mentees.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => downloadList(filtered)}
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-[#194611] bg-white px-4 py-2.5 text-sm font-semibold text-[#194611] hover:bg-green-50"
                >
                    <Download className="h-4 w-4" />
                    Export List
                </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <Search className="h-4 w-4 text-gray-500" />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by name or ID"
                            className="w-44 bg-transparent text-sm outline-none placeholder:text-gray-400"
                        />
                    </label>

                    <FacilityDropdown
                        value={facility}
                        total={byStatus.length}
                        options={options}
                        onChange={(value) => {
                            setFacility(value);
                            setPage(1);
                        }}
                    />

                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">
                        <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                        Status:
                        <select
                            aria-label="Filter by status"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value as StatusFilter);
                                setPage(1);
                            }}
                            className="bg-transparent font-semibold text-gray-900 outline-none"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="ALL">All</option>
                        </select>
                    </label>
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                    <button
                        type="button"
                        aria-label="Grid view"
                        aria-pressed={view === "grid"}
                        onClick={() => setView("grid")}
                        className={toggleClass(view === "grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="List view"
                        aria-pressed={view === "list"}
                        onClick={() => setView("list")}
                        className={toggleClass(view === "list")}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {view === "grid" ? (
                <>
                    <RosterCards mentees={visible} asOf={asOf} />
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                        {pagination}
                    </div>
                </>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                    <MenteesTable mentees={visible} />
                    {pagination}
                </div>
            )}
        </div>
    );
}