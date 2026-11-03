"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Plus, CheckCircle2, Trash2, Loader2, AlertCircle } from "lucide-react";
import type { CycleThematicArea } from "@/types/cycle";
import type { ThematicArea } from "@/types/thematic-area";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";

interface Props {
    cycleId: string;
    cycleName: string;
    assignedAreas: CycleThematicArea[];
    allAvailableAreas: ThematicArea[];
}

export default function CycleThematicAreasManager({
    cycleId,
    cycleName,
    assignedAreas: initialAssigned,
    allAvailableAreas,
}: Props) {
    const router = useRouter();
    const [assigned, setAssigned] = useState<CycleThematicArea[]>(initialAssigned);
    const [selectedAreaId, setSelectedAreaId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const assignedIds = new Set(assigned.map((a) => Number(a.id)));
    const unassignedOptions = allAvailableAreas.filter((a) => !assignedIds.has(Number(a.id)));

    const handleAssignArea = async () => {
        if (!selectedAreaId) return;
        setLoading(true);
        setFeedback(null);
        const numericId = Number(selectedAreaId);

        try {
            await apiClient(ENDPOINTS.CYCLES.THEMATIC_AREAS(cycleId), {
                method: "POST",
                body: { thematic_area_id: numericId },
            });

            const matched = allAvailableAreas.find((a) => Number(a.id) === numericId);
            const newArea: CycleThematicArea = {
                id: numericId,
                name: matched?.name || `Thematic Area #${numericId}`,
                code: matched?.code || `TA-${numericId}`,
            };

            setAssigned((prev) => [...prev, newArea]);
            setSelectedAreaId("");
            setFeedback({
                type: "success",
                message: `Successfully linked "${newArea.name}" to this cycle.`,
            });
            router.refresh();
        } catch (err: any) {
            setFeedback({
                type: "error",
                message: err?.message || "Failed to link thematic area to cycle. Administrator permissions required.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveArea = async (areaId: number, areaName: string) => {
        setDeletingId(areaId);
        setFeedback(null);
        try {
            await apiClient(ENDPOINTS.CYCLES.THEMATIC_AREA_DETAIL(cycleId, areaId), {
                method: "DELETE",
            });

            setAssigned((prev) => prev.filter((a) => a.id !== areaId));
            setFeedback({
                type: "success",
                message: `Removed "${areaName}" from this cycle.`,
            });
            router.refresh();
        } catch (err: any) {
            setFeedback({
                type: "error",
                message: err?.message || "Failed to remove thematic area from cycle.",
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[#194611]" />
                    <h2 className="text-base font-semibold text-gray-900">
                        Thematic Areas ({assigned.length})
                    </h2>
                </div>
                <span className="text-xs text-gray-500">
                    Accredited clinical learning domains in this cycle
                </span>
            </div>

            {feedback && (
                <div
                    className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                        feedback.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                >
                    {feedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                    )}
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* List of currently assigned thematic areas */}
            {assigned.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                    {assigned.map((area) => (
                        <span
                            key={area.id}
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-900 border border-emerald-200/80 shadow-2xs"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#194611]" />
                            <span>
                                {area.name} {area.code && `(${area.code})`}
                            </span>
                            <button
                                type="button"
                                disabled={deletingId === area.id}
                                onClick={() => handleRemoveArea(area.id, area.name)}
                                title={`Remove ${area.name} from cycle`}
                                className="ml-1 text-gray-400 hover:text-red-600 cursor-pointer transition disabled:opacity-50"
                            >
                                {deletingId === area.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Trash2 className="h-3 w-3" />
                                )}
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-500 italic py-1">
                    No thematic areas are currently assigned to this cycle. Link one below to allow clinical assignments.
                </p>
            )}

            {/* Form to link a new thematic area to this cycle */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                <select
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    disabled={loading || unassignedOptions.length === 0}
                    className="h-9 min-w-64 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FDD028] disabled:bg-gray-100"
                >
                    <option value="">
                        {unassignedOptions.length === 0
                            ? "All available thematic areas are linked"
                            : "Select thematic area to link to cycle..."}
                    </option>
                    {unassignedOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                            {opt.name} ({opt.code})
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    disabled={!selectedAreaId || loading}
                    onClick={handleAssignArea}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#194611] px-4 text-xs font-semibold text-white hover:bg-[#194611]/90 disabled:opacity-50 cursor-pointer transition"
                >
                    {loading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Plus className="h-3.5 w-3.5" />
                    )}
                    <span>Link to Cycle</span>
                </button>
            </div>
        </section>
    );
}
