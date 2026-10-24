"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, LayoutGrid, List, SlidersHorizontal, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompetencyLevel, MyMentee } from "@/types/my-mentee";
import { LEVEL_LABEL, formatSessionDate } from "./MenteeParts";
import { MenteesTable } from "./MenteesTable";
import { MenteeCards } from "./MenteeCards";
import { MenteesPagination } from "./MenteesPagination";

const PAGE_SIZE = 3; // matches the design ("Showing 1 to 3 of 24"); raise it for a longer page
const LEVELS: CompetencyLevel[] = ["NOVICE", "QUALIFIED", "ADVANCED"];

function downloadRoster(rows: MyMentee[]) {
    const header = ["Mentee ID", "Name", "Facility", "Competency Level", "Last Session", "Overdue"];
    const lines = rows.map((m) =>
        [
            m.code,
            m.name,
            m.facility,
            LEVEL_LABEL[m.level],
            formatSessionDate(m.lastSession),
            m.overdue ? "Yes" : "No",
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
    a.download = "my-mentees-roster.csv";
    a.click();
    URL.revokeObjectURL(url);
}

export function MyMenteesView({ mentees }: { mentees: MyMentee[] }) {
    const [facility, setFacility] = useState("ALL");
    const [level, setLevel] = useState("ALL");
    const [view, setView] = useState<"list" | "grid">("list");
    const [page, setPage] = useState(1);

    const facilities = useMemo(
        () => Array.from(new Set(mentees.map((m) => m.facility))).sort(),
        [mentees]
    );

    const filtered = useMemo(
        () =>
            mentees.filter(
                (m) =>
                    (facility === "ALL" || m.facility === facility) &&
                    (level === "ALL" || m.level === level)
            ),
        [mentees, facility, level]
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const selectClass =
        "rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 outline-none focus:border-[#194611]";
    const toggleClass = (active: boolean) =>
        cn(
            "rounded-md p-1.5",
            active ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:bg-gray-100"
        );

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Mentees</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Managing {mentees.length} active clinical mentees
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() => downloadRoster(filtered)}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-200"
                    >
                        <Download className="h-4 w-4" />
                        Export Roster
                    </button>
                    <Link
                        href="/assessments/new"
                        className="flex items-center gap-2 rounded-lg bg-[#194611] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f2f0b]"
                    >
                        <UserPlus className="h-4 w-4" />
                        New Assessment
                    </Link>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                    </span>
                    <select
                        aria-label="Filter by facility"
                        value={facility}
                        onChange={(e) => {
                            setFacility(e.target.value);
                            setPage(1);
                        }}
                        className={selectClass}
                    >
                        <option value="ALL">All Facilities</option>
                        {facilities.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label="Filter by competency level"
                        value={level}
                        onChange={(e) => {
                            setLevel(e.target.value);
                            setPage(1);
                        }}
                        className={selectClass}
                    >
                        <option value="ALL">All Levels</option>
                        {LEVELS.map((l) => (
                            <option key={l} value={l}>
                                {LEVEL_LABEL[l]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                    <button
                        type="button"
                        aria-label="List view"
                        aria-pressed={view === "list"}
                        onClick={() => setView("list")}
                        className={toggleClass(view === "list")}
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Grid view"
                        aria-pressed={view === "grid"}
                        onClick={() => setView("grid")}
                        className={toggleClass(view === "grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {view === "list" ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                    <MenteesTable mentees={visible} />
                    <MenteesPagination
                        page={safePage}
                        totalPages={totalPages}
                        total={filtered.length}
                        pageSize={PAGE_SIZE}
                        onChange={setPage}
                    />
                </div>
            ) : (
                <>
                    <MenteeCards mentees={visible} />
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                        <MenteesPagination
                            page={safePage}
                            totalPages={totalPages}
                            total={filtered.length}
                            pageSize={PAGE_SIZE}
                            onChange={setPage}
                        />
                    </div>
                </>
            )}
        </div>
    );
}