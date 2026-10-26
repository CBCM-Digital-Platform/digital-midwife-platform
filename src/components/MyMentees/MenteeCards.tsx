import React from "react";
import Link from "next/link";
import { Building2, Clock, CheckCircle2, AlertCircle, FileText, Plus, Eye } from "lucide-react";
import type { MyMentee } from "@/types/my-mentee";
import type { MentorAssessment } from "@/types/mentor-assessment";
import { CompetencyBadge, LastSession, MenteeAvatar, formatSessionDate } from "./MenteeParts";
import { cn } from "@/lib/utils";

interface MenteeCardsProps {
    mentees: MyMentee[];
    onSelectAssessment?: (assessment: MentorAssessment, mentee: MyMentee) => void;
    highlightMenteeId?: string | null;
}

export function MenteeCards({ mentees, onSelectAssessment, highlightMenteeId }: MenteeCardsProps) {
    if (mentees.length === 0) {
        return (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                No mentees match these filters.
            </p>
        );
    }

    return (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentees.map((m) => {
                const isHighlighted = highlightMenteeId === m.id;
                const assigned = m.assignedAssessment;

                return (
                    <li
                        key={m.id}
                        id={`mentee-card-${m.id}`}
                        className={cn(
                            "flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition duration-150 hover:shadow-md",
                            isHighlighted && "bg-emerald-50/70 ring-2 ring-emerald-500/40"
                        )}
                    >
                        <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <MenteeAvatar name={m.name} avatarUrl={m.avatarUrl} className="h-12 w-12" />
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-gray-900">{m.name}</p>
                                        <p className="text-xs text-gray-500">ID: {m.code}</p>
                                    </div>
                                </div>
                                {isHighlighted && (
                                    <span className="shrink-0 rounded-full bg-[#194611] px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-2xs">
                                        Just Assigned
                                    </span>
                                )}
                            </div>

                            {/* Facility & Level */}
                            <p className="mt-4 flex items-center gap-1.5 text-sm text-gray-800">
                                <Building2 className="h-4 w-4 text-gray-500 shrink-0" />
                                <span className="truncate">{m.facility}</span>
                            </p>

                            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                                <CompetencyBadge level={m.level} />
                                <LastSession iso={m.lastSession} overdue={m.overdue} />
                            </div>

                            {/* Assigned Assessment Block */}
                            <div className="mt-4 border-t border-gray-100 pt-3">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    Assigned Assessment
                                </span>

                                {assigned ? (
                                    <div className="mt-1.5 rounded-lg border border-gray-200/90 bg-gray-50/70 p-3 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                                                {assigned.type}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between gap-1 text-[11px]">
                                            {assigned.status === "PENDING" ? (
                                                <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                                                    <Clock className="h-3 w-3 text-amber-600" />
                                                    Due {formatSessionDate(assigned.dueDate || assigned.date)}
                                                </span>
                                            ) : assigned.status === "PASS" ? (
                                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                    Passed {assigned.scorePct !== null ? `(${assigned.scorePct}%)` : ""}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 font-semibold text-rose-800">
                                                    <AlertCircle className="h-3 w-3 text-rose-600" />
                                                    Needs Review
                                                </span>
                                            )}

                                            {onSelectAssessment && (
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectAssessment(assigned, m)}
                                                    className="inline-flex items-center gap-1 font-semibold text-[#194611] hover:underline"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    Details
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-1.5 flex items-center justify-between rounded-lg border border-dashed border-gray-200 p-2.5 text-xs text-gray-500">
                                        <span>No active task</span>
                                        <Link
                                            href={`/my-assessments/new?menteeId=${m.id}`}
                                            className="font-semibold text-[#194611] hover:underline flex items-center gap-0.5"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Assign
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                            {assigned && onSelectAssessment ? (
                                <button
                                    type="button"
                                    onClick={() => onSelectAssessment(assigned, m)}
                                    className="text-xs font-semibold text-gray-700 hover:text-[#194611] transition"
                                >
                                    View Details
                                </button>
                            ) : (
                                <span className="text-[11px] text-gray-600">Clinical Rotation Active</span>
                            )}

                            <Link
                                href={`/my-assessments/new?menteeId=${m.id}`}
                                className="text-xs font-semibold text-[#194611] hover:underline"
                            >
                                {assigned ? "Assess Again" : "Assess"}
                            </Link>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}