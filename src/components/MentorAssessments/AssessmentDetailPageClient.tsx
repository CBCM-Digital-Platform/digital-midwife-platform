"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    HelpCircle,
    Paperclip,
    Send,
    User,
    UserCheck,
    X,
    XCircle,
} from "lucide-react";
import type {
    AssessmentChecklistItem,
    AssessmentCriterionScore,
    AssessmentStatus,
    MentorAssessment,
} from "@/types/mentor-assessment";
import {
    setAssessmentChecklistItems,
    setAssessmentCriteriaScores,
    updateAssessmentStatus,
} from "@/services/mentor-assessments.service";
import { cn } from "@/lib/utils";

interface AssessmentDetailPageClientProps {
    assessment: MentorAssessment;
}

export function AssessmentDetailPageClient({
    assessment: initialAssessment,
}: AssessmentDetailPageClientProps) {
    const router = useRouter();
    const [assessment, setAssessment] = useState<MentorAssessment>(initialAssessment);
    const [feedbackText, setFeedbackText] = useState(assessment.feedback || "");
    const [criteriaScores, setCriteriaScores] = useState<AssessmentCriterionScore[]>(
        assessment.criteriaScores || [
            { criterion: "Aseptic Technique & Hand Hygiene", score: 85 },
            { criterion: "Clinical Patient Communication", score: 80 },
            { criterion: "Procedural Adherence & Safety", score: 75 },
        ]
    );
    const [checklist, setChecklist] = useState<AssessmentChecklistItem[]>(
        assessment.checklistItems || [
            { item: "Pre-procedure patient explanation and consent verified", checked: true },
            { item: "Emergency supplies and medication tray prepared", checked: true },
            { item: "Active management of third stage performed to standard", checked: assessment.status === "PASS" },
            { item: "Immediate postpartum vitals and monitoring documented", checked: assessment.status === "PASS" },
        ]
    );

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    const averageScore = Math.round(
        criteriaScores.reduce((sum, c) => sum + Number(c.score || 0), 0) /
            (criteriaScores.length || 1)
    );

    const handleScoreChange = (index: number, newScore: number) => {
        setCriteriaScores((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], score: Math.max(0, Math.min(100, newScore)) };
            return next;
        });
    };

    const handleToggleChecklist = (index: number) => {
        setChecklist((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], checked: !next[index].checked };
            return next;
        });
    };

    const handleSaveCriteria = async () => {
        setIsSaving(true);
        setSaveSuccess(null);
        try {
            await setAssessmentCriteriaScores(assessment.id, criteriaScores);
            await setAssessmentChecklistItems(assessment.id, checklist);
            const updated = await updateAssessmentStatus(
                assessment.id,
                assessment.status,
                averageScore,
                feedbackText
            );
            if (updated) {
                setAssessment(updated);
            }
            setSaveSuccess("Assessment progress saved successfully.");
            setTimeout(() => setSaveSuccess(null), 3000);
        } catch (e) {
            console.error("Save failed:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinalize = async (status: AssessmentStatus) => {
        setIsSaving(true);
        try {
            const finalScore = status === "PASS" ? Math.max(75, averageScore) : Math.min(68, averageScore);
            const updated = await updateAssessmentStatus(
                assessment.id,
                status,
                finalScore,
                feedbackText || `Clinical evaluation marked as ${status}.`
            );
            if (updated) {
                setAssessment(updated);
            }
            setSaveSuccess(`Assessment marked as ${status}.`);
            setTimeout(() => setSaveSuccess(null), 3000);
        } catch (e) {
            console.error("Finalize failed:", e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 pb-12">
            {/* Header & Back Link */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href="/my-assessments"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 transition hover:text-[#194611]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Assessments
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                            {assessment.type}
                        </h1>
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                                assessment.status === "PASS"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : assessment.status === "NEEDS_REVIEW"
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : "bg-blue-50 text-blue-800 border border-blue-200"
                            )}
                        >
                            {assessment.status === "PASS" && <CheckCircle2 className="h-3.5 w-3.5" />}
                            {assessment.status === "NEEDS_REVIEW" && <HelpCircle className="h-3.5 w-3.5" />}
                            {assessment.status === "PENDING" && <Clock className="h-3.5 w-3.5" />}
                            {assessment.status.replace("_", " ")}
                        </span>
                    </div>
                </div>

                {/* Score Summary Badge */}
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-xs">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#194611]">
                        <Award className="h-5 w-5" />
                    </span>
                    <div>
                        <div className="text-xs font-medium text-gray-500">Aggregate Score</div>
                        <div className="text-lg font-bold text-gray-900">
                            {assessment.scorePct !== null ? `${assessment.scorePct}%` : `${averageScore}% (Pending)`}
                        </div>
                    </div>
                </div>
            </div>

            {saveSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 font-medium">
                    ✓ {saveSuccess}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left 2 Cols: Details, Criteria, Checklist, Feedback */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Mentee Overview Card */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                            Candidate & Clinical Context
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-[#194611]">
                                    {assessment.menteeName
                                        .split(" ")
                                        .map((p) => p[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">{assessment.menteeName}</div>
                                    <div className="text-xs text-gray-500">{assessment.menteeTitle}</div>
                                </div>
                            </div>

                            <div className="space-y-1 text-xs text-gray-600 sm:border-l sm:border-gray-100 sm:pl-4">
                                <div>
                                    <span className="font-semibold text-gray-700">Assigned Date: </span>
                                    {assessment.date}
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Due Date: </span>
                                    {assessment.dueDate || assessment.date}
                                </div>
                                {assessment.facilityName && (
                                    <div>
                                        <span className="font-semibold text-gray-700">Facility: </span>
                                        {assessment.facilityName}
                                    </div>
                                )}
                            </div>
                        </div>

                        {assessment.instructions && (
                            <div className="mt-4 rounded-lg bg-gray-50 p-3.5 text-xs text-gray-700">
                                <span className="font-semibold text-gray-900">Instructions: </span>
                                {assessment.instructions}
                            </div>
                        )}
                    </div>

                    {/* Criteria Scoring Form */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">Clinical Criteria Scores</h2>
                                <p className="text-xs text-gray-500">
                                    Assess specific clinical competencies on a scale of 0 to 100.
                                </p>
                            </div>
                            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#194611]">
                                Avg: {averageScore}%
                            </span>
                        </div>

                        <div className="space-y-4">
                            {criteriaScores.map((c, idx) => (
                                <div key={idx} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-800">{c.criterion}</span>
                                        <span className="font-bold text-gray-900">{c.score}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={c.score}
                                        onChange={(e) => handleScoreChange(idx, Number(e.target.value))}
                                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#194611]"
                                    />
                                    <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                                        <span>0 - Unsatisfactory</span>
                                        <span>50 - Developing</span>
                                        <span>75 - Competent</span>
                                        <span>100 - Mastered</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Procedural Checklist */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                        <h2 className="mb-1 text-base font-semibold text-gray-900">Procedural Checklist</h2>
                        <p className="mb-4 text-xs text-gray-500">
                            Check off clinical procedural steps verified during direct observation.
                        </p>

                        <div className="space-y-2.5">
                            {checklist.map((item, idx) => (
                                <label
                                    key={idx}
                                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition hover:bg-gray-100/70"
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleToggleChecklist(idx)}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#194611] focus:ring-[#194611]"
                                    />
                                    <span
                                        className={cn(
                                            "text-xs leading-relaxed",
                                            item.checked ? "text-gray-900 font-medium" : "text-gray-600"
                                        )}
                                    >
                                        {item.item}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Preceptor Feedback */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                        <h2 className="mb-1 text-base font-semibold text-gray-900">Preceptor Feedback & Notes</h2>
                        <p className="mb-3 text-xs text-gray-500">
                            Provide constructive feedback, clinical observations, and learning targets.
                        </p>

                        <textarea
                            rows={4}
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Add evaluation remarks, areas of strength, and improvement focus..."
                            className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none transition focus:border-[#194611] focus:ring-1 focus:ring-[#194611]"
                        />

                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={handleSaveCriteria}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#194611] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#12330c] disabled:opacity-50"
                            >
                                <Check className="h-3.5 w-3.5" />
                                {isSaving ? "Saving..." : "Save Progress"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Col: Actions & Attached Evidence */}
                <div className="space-y-6">
                    {/* Finalize Action Card */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                        <h3 className="mb-3 text-sm font-bold text-gray-900">Assessment Decision</h3>
                        <p className="mb-4 text-xs text-gray-600">
                            Record final decision and submit official grading to the CBCM platform.
                        </p>

                        <div className="space-y-2.5">
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleFinalize("PASS")}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Mark as Passed ({Math.max(75, averageScore)}%)
                            </button>

                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleFinalize("NEEDS_REVIEW")}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 py-2.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
                            >
                                <HelpCircle className="h-4 w-4" />
                                Request Remediation / Review
                            </button>
                        </div>
                    </div>

                    {/* Attached Evidence Files */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                            <Paperclip className="h-4 w-4 text-[#194611]" />
                            Evidence & Attachments
                        </h3>

                        {assessment.evidence && assessment.evidence.length > 0 ? (
                            <div className="space-y-2">
                                {assessment.evidence.map((ev, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                                            <span className="truncate font-medium text-gray-800">{ev.title}</span>
                                        </div>
                                        {ev.file_id && (
                                            <a
                                                href={`${process.env.NEXT_PUBLIC_API_URL || "https://cbcm-backend-tntq.onrender.com/api/v1"}/uploads/${ev.file_id}/content`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : assessment.attachmentNames && assessment.attachmentNames.length > 0 ? (
                            <div className="space-y-2">
                                {assessment.attachmentNames.map((name, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs text-gray-700"
                                    >
                                        <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                                        <span className="truncate font-medium">{name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500">No external evidence files attached.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
