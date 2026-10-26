import React from "react";
import Link from "next/link";
import { Building2, Clock, CheckCircle2, AlertCircle, FileText, Plus, Eye } from "lucide-react";
import type { MyMentee } from "@/types/my-mentee";
import type { MentorAssessment } from "@/types/mentor-assessment";
import { CompetencyBadge, LastSession, MenteeAvatar, formatSessionDate } from "./MenteeParts";
import { cn } from "@/lib/utils";

interface MenteesTableProps {
    mentees: MyMentee[];
    onSelectAssessment?: (assessment: MentorAssessment, mentee: MyMentee) => void;
    highlightMenteeId?: string | null;
}

export function MenteesTable({ mentees, onSelectAssessment, highlightMenteeId }: MenteesTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="bg-gray-100/70 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                        <th className="px-6 py-3.5">Mentee</th>
                        <th className="px-4 py-3.5">Facility</th>
                        <th className="px-4 py-3.5">Competency Level</th>
                        <th className="px-4 py-3.5">Assigned Assessment</th>
                        <th className="px-4 py-3.5">Last Session</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {mentees.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                No mentees match these filters.
                            </td>
                        </tr>
                    ) : (
                        mentees.map((m) => {
                            const isHighlighted = highlightMenteeId === m.id;
                            const assigned = m.assignedAssessment;

                            return (
                                <tr
                                    key={m.id}
                                    id={`mentee-row-${m.id}`}
                                    className={cn(
                                        "transition-colors duration-150 hover:bg-gray-50/80",
                                        isHighlighted && "bg-emerald-50/80 ring-2 ring-emerald-500/30"
                                    )}
                                >
                                    {/* 1. Mentee Info */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <MenteeAvatar name={m.name} avatarUrl={m.avatarUrl} />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-900">{m.name}</p>
                                                    {isHighlighted && (
                                                        <span className="rounded-full bg-[#194611] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                                                            New Assignment
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">ID: {m.code}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 2. Facility */}
                                    <td className="px-4 py-4 text-gray-800">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                            <Building2 className="h-3.5 w-3.5 text-gray-500" />
                                            {m.facility}
                                        </span>
                                    </td>

                                    {/* 3. Competency Level */}
                                    <td className="px-4 py-4">
                                        <CompetencyBadge level={m.level} />
                                    </td>

                                    {/* 4. Assigned Assessment (NEW) */}
                                    <td className="px-4 py-4">
                                        {assigned ? (
                                            <div className="space-y-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectAssessment && onSelectAssessment(assigned, m)}
                                                    className="group flex items-center gap-1.5 text-left text-xs font-semibold text-gray-900 hover:text-[#194611] transition"
                                                >
                                                    <FileText className="h-3.5 w-3.5 text-[#194611] shrink-0 group-hover:scale-110 transition-transform" />
                                                    <span className="underline decoration-gray-300 underline-offset-2 group-hover:decoration-[#194611] truncate max-w-[200px]">
                                                        {assigned.type}
                                                    </span>
                                                </button>

                                                <div className="flex items-center gap-2">
                                                    {assigned.status === "PENDING" ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                                            <Clock className="h-2.5 w-2.5 text-amber-600" />
                                                            Pending · Due {formatSessionDate(assigned.dueDate || assigned.date)}
                                                        </span>
                                                    ) : assigned.status === "PASS" ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                                            Passed {assigned.scorePct !== null ? `(${assigned.scorePct}%)` : ""}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                                                            <AlertCircle className="h-2.5 w-2.5 text-rose-600" />
                                                            Needs Review {assigned.scorePct !== null ? `(${assigned.scorePct}%)` : ""}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>None active</span>
                                                <Link
                                                    href={`/my-assessments/new?menteeId=${m.id}`}
                                                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#194611] hover:underline"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    Assign
                                                </Link>
                                            </div>
                                        )}
                                    </td>

                                    {/* 5. Last Session */}
                                    <td className="px-4 py-4 text-xs">
                                        <LastSession iso={m.lastSession} overdue={m.overdue} />
                                    </td>

                                    {/* 6. Actions */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {assigned && onSelectAssessment && (
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectAssessment(assigned, m)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-[#194611] transition"
                                                    title="View assignment details"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    <span>View</span>
                                                </button>
                                            )}

                                            <Link
                                                href={`/my-assessments/new?menteeId=${m.id}`}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#194611] hover:underline"
                                            >
                                                <span>{assigned ? "Assess Again" : "Assess"}</span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}