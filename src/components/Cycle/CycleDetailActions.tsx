"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, Clock, CheckCircle2, Trash2, AlertTriangle, MoreHorizontal } from "lucide-react";
import type { CycleStatus } from "@/types/cycle";
import { deleteCycle, transitionCycleStatus } from "@/services/cycle-data.service";

interface Props {
    cycleId: string;
    cycleName: string;
    currentStatus: CycleStatus;
}

export default function CycleDetailActions({ cycleId, cycleName, currentStatus }: Props) {
    const router = useRouter();
    const [status, setStatus] = useState<CycleStatus>(currentStatus);
    const [isUpdating, setIsUpdating] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStatusTransition = async (nextStatus: CycleStatus) => {
        setIsUpdating(true);
        setError(null);
        try {
            const backendStatus =
                nextStatus === "PLANNING"
                    ? "planned"
                    : (nextStatus.toLowerCase() as "draft" | "planned" | "active" | "completed" | "cancelled");

            await transitionCycleStatus(cycleId, backendStatus);
            setStatus(nextStatus);
            setMenuOpen(false);
            router.refresh();
        } catch (err: any) {
            setError(err?.message || "Failed to update cycle status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await deleteCycle(cycleId);
            setConfirmDelete(false);
            router.push("/cycles");
            router.refresh();
        } catch (err: any) {
            setError(err?.message || "Failed to delete cycle");
            setIsDeleting(false);
        }
    };

    return (
        <div className="relative flex items-center gap-2">
            {error && (
                <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded">
                    {error}
                </span>
            )}

            {/* Quick Status Buttons */}
            {/* Status transitions */}
            {status !== "ACTIVE" && status !== "COMPLETED" && (
                <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusTransition("ACTIVE")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition cursor-pointer"
                >
                    <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Set Active</span>
                </button>
            )}

            {status !== "COMPLETED" ? (
                <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusTransition("COMPLETED")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 disabled:opacity-50 transition cursor-pointer"
                >
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                    <span>Mark as Done</span>
                </button>
            ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/70 px-3 py-1.5 text-xs font-semibold text-purple-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                    <span>Done & Completed</span>
                </span>
            )}

            {status !== "PLANNING" && status !== "COMPLETED" && (
                <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusTransition("PLANNING")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition cursor-pointer"
                >
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Set Planning</span>
                </button>
            )}

            {/* Delete button */}
            <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition cursor-pointer"
            >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Cycle</span>
            </button>

            {/* Confirmation Modal */}
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
                            Are you sure you want to delete <span className="font-semibold text-gray-900">"{cycleName}"</span>? This will cancel and decommission this cycle in the backend.
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
        </div>
    );
}
