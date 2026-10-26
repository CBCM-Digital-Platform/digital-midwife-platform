"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MentorAssessment } from "@/types/mentor-assessment";
import { AssessmentsTable, type SortKey, type SortState } from "./AssessmentsTable";
import { AssessmentsPagination } from "./AssessmentsPagination";
import { AssessmentDetailDialog } from "./AssessmentDetailDialog";
import { getStoredAssessments } from "@/services/mentor-assessments.service";

type Tab = "ALL" | "PENDING" | "COMPLETED";

const PAGE_SIZE = 8; // 24 entries = 3 pages, like the design

export function AssessmentsView({ assessments: initialAssessments }: { assessments: MentorAssessment[] }) {
    const [assessments, setAssessments] = useState<MentorAssessment[]>(initialAssessments);
    const [tab, setTab] = useState<Tab>("ALL");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<SortState>(null);
    const [page, setPage] = useState(1);

    // Detail dialog state
    const [selectedAssessment, setSelectedAssessment] = useState<MentorAssessment | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Sync client-side stored assessments
    useEffect(() => {
        const syncStored = () => {
            const stored = getStoredAssessments();
            if (!stored || stored.length === 0) return;

            setAssessments((prev) => {
                const storedIds = new Set(stored.map((s) => s.id));
                const remaining = prev.filter((p) => !storedIds.has(p.id));
                return [...stored, ...remaining];
            });
        };

        syncStored();

        window.addEventListener("cbcm-assessments-updated", syncStored);
        return () => {
            window.removeEventListener("cbcm-assessments-updated", syncStored);
        };
    }, []);

    const pendingCount = useMemo(
        () => assessments.filter((a) => a.status === "PENDING").length,
        [assessments]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const rows = assessments.filter(
            (a) =>
                (tab === "ALL" ||
                    (tab === "PENDING" ? a.status === "PENDING" : a.status !== "PENDING")) &&
                (!q || a.menteeName.toLowerCase().includes(q) || a.type.toLowerCase().includes(q))
        );
        if (!sort) return rows;

        const field = sort.key === "name" ? "menteeName" : sort.key === "date" ? "date" : "type";
        const dir = sort.dir === "asc" ? 1 : -1;
        return [...rows].sort((x, y) => x[field].localeCompare(y[field]) * dir);
    }, [assessments, tab, search, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const onSort = (key: SortKey) => {
        setSort((prev) =>
            prev && prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { key, dir: "asc" }
        );
        setPage(1);
    };

    const handleSelectAssessment = (a: MentorAssessment) => {
        setSelectedAssessment(a);
        setIsDetailOpen(true);
    };

    const handleAssessmentUpdated = (updated: MentorAssessment) => {
        setSelectedAssessment(updated);
        setAssessments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    };

    const tabs: { id: Tab; label: string }[] = [
        { id: "ALL", label: "All Assessments" },
        { id: "PENDING", label: `Pending (${pendingCount})` },
        { id: "COMPLETED", label: "Completed" },
    ];

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#194611]">Assessments</h1>
                    <p className="mt-1 max-w-md text-sm text-gray-600">
                        Review and manage mentee evaluations and clinical competencies.
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-2xs">
                        <Search className="h-4 w-4 text-gray-600" />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search mentees or tasks..."
                            className="w-44 bg-transparent text-sm outline-none placeholder:text-gray-400"
                        />
                    </label>
                    <Link
                        href="/my-assessments/new"
                        className="flex items-center gap-2 rounded-lg bg-[#194611] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f2f0b] transition shadow-xs"
                    >
                        <Plus className="h-4 w-4" />
                        New Assessment
                    </Link>
                </div>
            </div>

            <div role="tablist" className="flex gap-6 border-b border-gray-200">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        onClick={() => {
                            setTab(t.id);
                            setPage(1);
                        }}
                        className={cn(
                            "-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition cursor-pointer",
                            tab === t.id
                                ? "border-[#194611] text-[#194611]"
                                : "border-transparent text-gray-600 hover:text-gray-900"
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                <AssessmentsTable
                    rows={visible}
                    sort={sort}
                    onSort={onSort}
                    onSelectAssessment={handleSelectAssessment}
                />
                <AssessmentsPagination
                    page={safePage}
                    totalPages={totalPages}
                    total={filtered.length}
                    pageSize={PAGE_SIZE}
                    onChange={setPage}
                />
            </div>

            {/* Assessment Detail Modal */}
            <AssessmentDetailDialog
                assessment={selectedAssessment}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                onAssessmentUpdated={handleAssessmentUpdated}
            />
        </div>
    );
}