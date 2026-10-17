"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserPlus, ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { Assignment } from "@/types/assignment";
import HorizontalMentorMenteeCard from "./HorizontalMentorMenteeCard";

interface HorizontalMentorMenteeViewProps {
    data: Assignment[];
    onRemove?: (id: string) => void;
    emptyTitle?: string;
    emptyDescription?: string;
    actionHref?: string;
    actionLabel?: string;
}

export default function HorizontalMentorMenteeView({
    data,
    onRemove,
    emptyTitle = "No assignments found",
    emptyDescription = "There are no mentorship pairings matching the current filters.",
    actionHref = "/assignments/new",
    actionLabel = "Add New Assignment",
}: HorizontalMentorMenteeViewProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);

    const total = data.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const currentPage = Math.min(page, totalPages);
    const fromIndex = (currentPage - 1) * pageSize;
    const pagedData = data.slice(fromIndex, fromIndex + pageSize);

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-[#194611] mb-3">
                    <Users className="size-7" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{emptyTitle}</h3>
                <p className="mt-1 max-w-sm text-sm text-gray-500">{emptyDescription}</p>
                {actionHref && (
                    <Link
                        href={actionHref}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#194611] px-4 py-2 text-sm font-medium text-white hover:bg-[#194611]/90 shadow-xs"
                    >
                        <UserPlus className="size-4" />
                        {actionLabel}
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-4">
                {pagedData.map((assignment) => (
                    <HorizontalMentorMenteeCard
                        key={assignment.id}
                        assignment={assignment}
                        onRemove={onRemove}
                    />
                ))}
            </div>

            {/* Pagination Controls */}
            {total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600">
                    <p>
                        Showing {fromIndex + 1}–{Math.min(fromIndex + pageSize, total)} of {total} mentor pairings
                    </p>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            Show:
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                            >
                                {[6, 12, 24].map((n) => (
                                    <option key={n} value={n}>
                                        {n} pairings
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                aria-label="Previous page"
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage <= 1}
                                className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                            <span className="px-2 text-xs">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                type="button"
                                aria-label="Next page"
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage >= totalPages}
                                className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
