"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList, TrendingUp, X, Trash2, AlertTriangle } from "lucide-react";
import type { Cycle } from "@/types/cycle";
import CycleStatusBadge from "./CycleStatusBadge";

interface Props {
    cycle: Cycle;
    onClose: () => void;
    onDelete?: (id: string) => void;
}

export default function CycleSnapshot({ cycle, onClose, onDelete }: Props) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(cycle.id);
            setConfirmDelete(false);
        } catch {
            // Error handled by parent
        } finally {
            setIsDeleting(false);
        }
    };

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
                                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                        m.done ? "bg-[#0B5D3B]" : "bg-gray-300"
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

            <div className="mt-6 flex flex-col gap-2">
                <Link
                    href={`/cycles/${cycle.id}`}
                    className="w-full text-center rounded-lg bg-[#0B5D3B] px-5 py-2 text-sm font-medium text-white hover:bg-[#094d31] transition"
                >
                    View Details
                </Link>

                {onDelete && (
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Cycle
                    </button>
                )}
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
        </aside>
    );
}