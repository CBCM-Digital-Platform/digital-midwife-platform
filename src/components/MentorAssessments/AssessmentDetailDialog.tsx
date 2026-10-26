"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    FileText,
    HelpCircle,
    Paperclip,
    UserCheck,
    X,
    XCircle,
    Award,
    Building2,
} from "lucide-react";
import type { MentorAssessment, AssessmentStatus } from "@/types/mentor-assessment";
import type { MyMentee } from "@/types/my-mentee";
import { CompetencyBadge, MenteeAvatar, formatSessionDate } from "@/components/MyMentees/MenteeParts";
import { updateAssessmentStatus } from "@/services/mentor-assessments.service";
import { cn } from "@/lib/utils";

interface AssessmentDetailDialogProps {
    assessment: MentorAssessment | null;
    mentee?: MyMentee | null;
    isOpen: boolean;
    onClose: () => void;
    onAssessmentUpdated?: (updated: MentorAssessment) => void;
}

export function AssessmentDetailDialog({
    assessment,
    mentee,
    isOpen,
    onClose,
    onAssessmentUpdated,
}: AssessmentDetailDialogProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [scoreInput, setScoreInput] = useState<string>("");
    const [showScorePrompt, setShowScorePrompt] = useState(false);

    if (!isOpen || !assessment) return null;

    const handleMarkPass = async (score: number = 90) => {
        setIsUpdating(true);
        try {
            const updated = await updateAssessmentStatus(assessment.id, "PASS", score);
            if (updated && onAssessmentUpdated) {
                onAssessmentUpdated(updated);
            }
            setShowScorePrompt(false);
        } catch (e) {
            console.error("Failed to update assessment status:", e);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMarkNeedsReview = async () => {
        setIsUpdating(true);
        try {
            const updated = await updateAssessmentStatus(assessment.id, "NEEDS_REVIEW", 65);
            if (updated && onAssessmentUpdated) {
                onAssessmentUpdated(updated);
            }
        } catch (e) {
            console.error("Failed to update assessment status:", e);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog Card */}
            <div className="relative z-50 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#194611]">
                            <FileText className="h-5 w-5" />
                        </span>
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Assigned Assessment
                            </span>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">
                                {assessment.type}
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body Content (scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Mentee Profile Summary Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-linear-to-r from-gray-50 to-white p-4">
                        <div className="flex items-center gap-3">
                            <MenteeAvatar
                                name={mentee?.name || assessment.menteeName}
                                avatarUrl={mentee?.avatarUrl}
                                className="h-12 w-12 text-sm shadow-xs"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-gray-900">
                                        {mentee?.name || assessment.menteeName}
                                    </h3>
                                    {mentee?.code && (
                                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[11px] font-mono font-medium text-gray-700">
                                            {mentee.code}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-600">
                                    {mentee?.title || assessment.menteeTitle}
                                </p>
                                {mentee?.facility && (
                                    <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                        <Building2 className="h-3 w-3" />
                                        {mentee.facility}
                                    </p>
                                )}
                            </div>
                        </div>

                        {mentee?.level && (
                            <div className="flex sm:flex-col items-start sm:items-end justify-between gap-1 border-t sm:border-t-0 pt-2 sm:pt-0">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase">
                                    Clinical Level
                                </span>
                                <CompetencyBadge level={mentee.level} />
                            </div>
                        )}
                    </div>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-gray-200/80 bg-gray-50/60 p-3">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Status
                            </span>
                            <div className="mt-1 flex items-center gap-1.5">
                                {assessment.status === "PENDING" ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                        <Clock className="h-3 w-3" />
                                        Pending
                                    </span>
                                ) : assessment.status === "PASS" ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Passed
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
                                        <XCircle className="h-3 w-3" />
                                        Needs Review
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200/80 bg-gray-50/60 p-3">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Assigned Date
                            </span>
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-gray-900">
                                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                {formatSessionDate(assessment.date)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200/80 bg-gray-50/60 p-3">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Due Date
                            </span>
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-gray-900">
                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                                {assessment.dueDate ? formatSessionDate(assessment.dueDate) : "Flexible"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200/80 bg-gray-50/60 p-3">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                Score / Mastery
                            </span>
                            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-gray-900">
                                <Award className="h-3.5 w-3.5 text-[#194611]" />
                                {assessment.scorePct !== null ? `${assessment.scorePct}%` : "Not graded"}
                            </p>
                        </div>
                    </div>

                    {/* Task & Instructions */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Task & Instructions
                        </h4>
                        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {assessment.instructions ||
                                "Review the competency checklist and demonstrate procedural preparedness."}
                        </div>
                    </div>

                    {/* Attached Reading Materials */}
                    {assessment.attachmentNames && assessment.attachmentNames.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Attached Reading Materials ({assessment.attachmentNames.length})
                            </h4>
                            <ul className="grid gap-2 sm:grid-cols-2">
                                {assessment.attachmentNames.map((name, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-2xs hover:bg-gray-50 transition"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-[#194611]" />
                                            <span className="truncate font-medium text-gray-800">
                                                {name}
                                            </span>
                                        </div>
                                        <span className="shrink-0 text-[10px] font-semibold text-gray-500">
                                            Attached
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Reference Link */}
                    {assessment.referenceLink && (
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Reference & Guidelines Link
                            </h4>
                            <a
                                href={assessment.referenceLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#194611] hover:underline"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {assessment.referenceLink}
                            </a>
                        </div>
                    )}

                    {/* Mentor Feedback / Notes */}
                    {assessment.feedback && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Mentor Notes & Feedback
                            </h4>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs text-gray-800 leading-relaxed">
                                {assessment.feedback}
                            </div>
                        </div>
                    )}

                    {/* Quick Evaluation Toolbar */}
                    {assessment.status === "PENDING" && (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-800">
                                    Quick Mentor Actions
                                </span>
                                <span className="text-[11px] text-gray-500">
                                    Evaluate or update this assignment
                                </span>
                            </div>

                            {showScorePrompt ? (
                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="Enter score (e.g. 90%)"
                                        value={scoreInput}
                                        onChange={(e) => setScoreInput(e.target.value)}
                                        className="w-44 rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-[#194611]"
                                    />
                                    <button
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={() => handleMarkPass(Number(scoreInput) || 90)}
                                        className="rounded-lg bg-[#194611] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f2f0b] disabled:opacity-50"
                                    >
                                        Save Passed
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowScorePrompt(false)}
                                        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={() => setShowScorePrompt(true)}
                                        className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Mark as Passed
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={handleMarkNeedsReview}
                                        className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
                                    >
                                        <XCircle className="h-3.5 w-3.5" />
                                        Request Revision
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3.5">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/my-assessments/new?menteeId=${mentee?.id || assessment.menteeId}`}
                            onClick={onClose}
                            className="text-xs font-semibold text-[#194611] hover:underline flex items-center gap-1"
                        >
                            + Assign Another Assessment
                        </Link>
                        <Link
                            href={`/assessments/${assessment.id}`}
                            onClick={onClose}
                            className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                        >
                            Open Full Assessment View →
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

