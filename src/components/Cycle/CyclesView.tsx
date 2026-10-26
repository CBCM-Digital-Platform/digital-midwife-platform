"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Filter, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Cycle, CycleStatus } from "@/types/cycle";
import { deleteCycle, transitionCycleStatus } from "@/services/cycle-data.service";
import CycleCard from "./CycleCard";
import CycleSnapshot from "./CycleSnapshot";

export default function CyclesView({ cycles }: { cycles: Cycle[] }) {
    const [cycleList, setCycleList] = useState<Cycle[]>(cycles);
    const [status, setStatus] = useState<"ALL" | CycleStatus>("ALL");
    const [year, setYear] = useState("ALL");
    const [selectedId, setSelectedId] = useState<string | null>(
        cycles.find((c) => c.status === "ACTIVE")?.id ?? cycles[0]?.id ?? null
    );
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        setCycleList(cycles);
    }, [cycles]);

    const showFeedback = (type: "success" | "error", message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 4000);
    };

    const handleDeleteCycle = async (id: string) => {
        try {
            await deleteCycle(id);
            setCycleList((prev) => prev.filter((c) => c.id !== id));
            if (selectedId === id) {
                setSelectedId(null);
            }
            showFeedback("success", "Cycle successfully deleted/cancelled.");
        } catch (err: any) {
            console.error("Delete cycle error:", err);
            showFeedback("error", err?.message || "Failed to delete cycle.");
        }
    };

    const handleStatusChange = async (id: string, newStatus: CycleStatus) => {
        try {
            const backendStatus =
                newStatus === "PLANNING"
                    ? "planned"
                    : (newStatus.toLowerCase() as "draft" | "planned" | "active" | "completed" | "cancelled");

            await transitionCycleStatus(id, backendStatus);
            setCycleList((prev) =>
                prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
            );
            showFeedback("success", `Cycle status updated to ${newStatus}.`);
        } catch (err: any) {
            console.error("Status transition error:", err);
            showFeedback("error", err?.message || "Failed to update cycle status.");
        }
    };

    const years = useMemo(
        () =>
            Array.from(new Set(cycleList.map((c) => new Date(c.startDate).getUTCFullYear()))).sort(
                (a, b) => b - a
            ),
        [cycleList]
    );

    const filtered = useMemo(
        () =>
            cycleList.filter(
                (c) =>
                    (status === "ALL" || c.status === status) &&
                    (year === "ALL" || new Date(c.startDate).getUTCFullYear() === Number(year))
            ),
        [cycleList, status, year]
    );

    const selected = filtered.find((c) => c.id === selectedId) ?? null;

    const selectClass =
        "appearance-none bg-transparent pr-1 text-sm font-medium text-gray-800 outline-none";

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Mentorship Cycles</h1>

                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as "ALL" | CycleStatus)}
                            className={selectClass}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PLANNING">Planning</option>
                            <option value="DRAFT">Draft</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </label>

                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className={selectClass}
                        >
                            <option value="ALL">All Years</option>
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </label>

                    <Link
                        href="/cycles/new"
                        className="flex items-center gap-2 rounded-lg bg-[#0B5D3B] px-4 py-2 text-sm font-medium text-white hover:bg-[#094d31]"
                    >
                        <Plus className="h-4 w-4" />
                        Create New Cycle
                    </Link>
                </div>
            </div>

            {feedback && (
                <div
                    className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
                        feedback.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                >
                    {feedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    )}
                    <span>{feedback.message}</span>
                </div>
            )}

            <div
                className={`grid gap-6 ${selected ? "lg:grid-cols-[1fr_340px]" : "grid-cols-1"} items-start`}
            >
                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                            No cycles match these filters.
                        </p>
                    ) : (
                        filtered.map((cycle) => (
                            <CycleCard
                                key={cycle.id}
                                cycle={cycle}
                                selected={cycle.id === selectedId}
                                onSelect={() => setSelectedId(cycle.id)}
                                onDelete={handleDeleteCycle}
                                onStatusChange={handleStatusChange}
                            />
                        ))
                    )}
                </div>

                {selected && (
                    <CycleSnapshot
                        cycle={selected}
                        onClose={() => setSelectedId(null)}
                        onDelete={handleDeleteCycle}
                    />
                )}
            </div>
        </div>
    );
}