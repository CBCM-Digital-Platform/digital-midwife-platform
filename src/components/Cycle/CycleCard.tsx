"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Calendar,
    MoreVertical,
    Trash2,
    Eye,
    CheckCircle2,
    PlayCircle,
    Clock,
    AlertTriangle,
} from "lucide-react";
import type { Cycle, CycleStatus } from "@/types/cycle";
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
    onDelete?: (id: string) => void;
    onStatusChange?: (id: string, status: CycleStatus) => void;
}

export default function CycleCard({
    cycle,
    selected,
    onSelect,
    onDelete,
    onStatusChange,
}: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isTerminal = cycle.status === "COMPLETED" || cycle.status === "CANCELLED";
    const progressLabel = cycle.status === "PLANNING" || cycle.status === "DRAFT" ? "Readiness" : "Progress";
    const barColor = cycle.status === "PLANNING" || cycle.status === "DRAFT" ? "bg-amber-400" : "bg-[#0B5D3B]";

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleting(true);
        try {
            if (onDelete) {
                await onDelete(cycle.id);
            }
        } finally {
            setIsDeleting(false);
            setConfirmDelete(false);
            setMenuOpen(false);
        }
    };

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
            className={`relative cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition ${
                selected ? "border-2 border-[#0B5D3B]" : "border-gray-200 hover:border-gray-300"
            } ${isTerminal ? "opacity-75" : ""}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cycle.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatRange(cycle.startDate, cycle.endDate)}
                    </p>
                </div>
                <div className="flex items-center gap-2 relative">
                    <CycleStatusBadge status={cycle.status} />

                    {/* 3-DOTS ACTION MENU BUTTON */}
                    <button
                        type="button"
                        aria-label="Cycle actions"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((prev) => !prev);
                        }}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* FLOATING ACTION DROPDOWN */}
                    {menuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                }}
                            />
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg text-xs"
                            >
                                <Link
                                    href={`/cycles/${cycle.id}`}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                                    <span>View Details</span>
                                </Link>

                                {onStatusChange && cycle.status !== "ACTIVE" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onStatusChange(cycle.id, "ACTIVE");
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50"
                                    >
                                        <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>Set as Active</span>
                                    </button>
                                )}

                                {onStatusChange && cycle.status !== "PLANNING" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onStatusChange(cycle.id, "PLANNING");
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50"
                                    >
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                        <span>Set as Planning</span>
                                    </button>
                                )}

                                {onStatusChange && cycle.status !== "COMPLETED" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onStatusChange(cycle.id, "COMPLETED");
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                                        <span>Mark Completed</span>
                                    </button>
                                )}

                                {onDelete && (
                                    <div className="border-t border-gray-100 my-1 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                setConfirmDelete(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-left font-medium text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Delete Cycle</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* CONFIRM DELETE MODAL */}
            {confirmDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="rounded-full bg-red-100 p-2.5">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Mentorship Cycle</h3>
                        </div>

                        <p className="mt-3 text-sm text-gray-600">
                            Are you sure you want to delete <span className="font-semibold text-gray-900">"{cycle.name}"</span>? This will decommission and cancel this cycle in the backend.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(false)}
                                disabled={isDeleting}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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