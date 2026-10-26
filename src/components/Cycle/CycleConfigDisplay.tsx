"use client";

import { useEffect, useState } from "react";
import { FileText, SlidersHorizontal, Clock, Target, Info, Calendar, ShieldCheck, Tag } from "lucide-react";
import type { Cycle } from "@/types/cycle";

interface Props {
    cycle: Cycle;
}

export default function CycleConfigDisplay({ cycle }: Props) {
    const [config, setConfig] = useState({
        code: cycle.code || `CYC-2026-${cycle.id.padStart(3, "0")}`,
        description:
            cycle.description ||
            "Clinical capacity enhancement and preceptor mentorship cycle across designated regional referral and primary healthcare facilities.",
        durationWeeks: cycle.durationWeeks || 12,
        maxMenteesPerMentor: cycle.maxMenteesPerMentor || 3,
        maxFacilitiesPerMentor: cycle.maxFacilitiesPerMentor || 2,
        assessmentFrequency: cycle.assessmentFrequency || "BI_WEEKLY",
        notes:
            cycle.notes ||
            "All clinical preceptors and resident mentees must log bedside interactions and complete bi-weekly competency reviews.",
    });

    useEffect(() => {
        try {
            const raw = localStorage.getItem(`cycle_meta_${cycle.id}`);
            if (raw) {
                const parsed = JSON.parse(raw);
                setConfig((prev) => ({
                    code: parsed.code || prev.code,
                    description: parsed.description || prev.description,
                    durationWeeks: parsed.durationWeeks || prev.durationWeeks,
                    maxMenteesPerMentor: parsed.maxMenteesPerMentor || prev.maxMenteesPerMentor,
                    maxFacilitiesPerMentor: parsed.maxFacilitiesPerMentor || prev.maxFacilitiesPerMentor,
                    assessmentFrequency: parsed.assessmentFrequency || prev.assessmentFrequency,
                    notes: parsed.notes || prev.notes,
                }));
            }
        } catch {
            // fallback to initial cycle config
        }
    }, [cycle.id]);

    const formatFreq = (freq: string) => {
        switch (freq?.toUpperCase()) {
            case "WEEKLY":
                return "Weekly";
            case "BI_WEEKLY":
                return "Bi-weekly";
            case "MONTHLY":
                return "Monthly";
            default:
                return freq || "Bi-weekly";
        }
    };

    return (
        <div className="space-y-6">
            {/* GOVERNANCE & MENTORSHIP RULES CARD */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-[#0B5D3B]" />
                        Mentorship Rules & Governance
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#0B5D3B] border border-emerald-200">
                        <Tag className="h-3 w-3" />
                        Code: {config.code}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                    <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Max Mentees / Mentor
                        </p>
                        <p className="mt-1 text-xl font-bold text-gray-900">
                            {config.maxMenteesPerMentor}{" "}
                            <span className="text-xs font-normal text-gray-500">Mentees</span>
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Max Facilities / Mentor
                        </p>
                        <p className="mt-1 text-xl font-bold text-gray-900">
                            {config.maxFacilitiesPerMentor}{" "}
                            <span className="text-xs font-normal text-gray-500">Facilities</span>
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Assessment Cadence
                        </p>
                        <p className="mt-1 text-xl font-bold text-gray-900">
                            {formatFreq(config.assessmentFrequency)}
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-3.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Cycle Duration
                        </p>
                        <p className="mt-1 text-xl font-bold text-gray-900">
                            {config.durationWeeks}{" "}
                            <span className="text-xs font-normal text-gray-500">Weeks</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* DESCRIPTION & OBJECTIVES */}
            {config.description && (
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-2">
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#0B5D3B]" />
                        Scope & Objectives
                    </h2>
                    <p className="text-sm text-gray-700 leading-relaxed">{config.description}</p>
                </section>
            )}

            {/* OPERATIONAL GUIDANCE & NOTES */}
            {config.notes && (
                <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm space-y-2">
                    <h2 className="text-sm font-semibold text-amber-900 uppercase tracking-wide flex items-center gap-2">
                        <Info className="h-4 w-4 text-amber-700" />
                        Operational Notes & Guidance
                    </h2>
                    <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">
                        {config.notes}
                    </p>
                </section>
            )}
        </div>
    );
}
