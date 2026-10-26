"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    CheckCircle2,
    Download,
    Eye,
    FileText,
    LayoutGrid,
    List,
    SlidersHorizontal,
    UserPlus,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompetencyLevel, MyMentee } from "@/types/my-mentee";
import type { MentorAssessment } from "@/types/mentor-assessment";
import { LEVEL_LABEL, formatSessionDate } from "./MenteeParts";
import { MenteesTable } from "./MenteesTable";
import { MenteeCards } from "./MenteeCards";
import { MenteesPagination } from "./MenteesPagination";
import { AssessmentDetailDialog } from "@/components/MentorAssessments/AssessmentDetailDialog";
import { getStoredAssessments } from "@/services/mentor-assessments.service";

const PAGE_SIZE = 4; // comfortably displays entries per page
const LEVELS: CompetencyLevel[] = ["NOVICE", "QUALIFIED", "ADVANCED"];

function downloadRoster(rows: MyMentee[]) {
    const header = [
        "Mentee ID",
        "Name",
        "Facility",
        "Competency Level",
        "Assigned Assessment",
        "Assessment Status",
        "Last Session",
        "Overdue",
    ];
    const lines = rows.map((m) =>
        [
            m.code,
            m.name,
            m.facility,
            LEVEL_LABEL[m.level],
            m.assignedAssessment?.type || "None",
            m.assignedAssessment?.status || "N/A",
            formatSessionDate(m.lastSession),
            m.overdue ? "Yes" : "No",
        ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-mentees-roster.csv";
    a.click();
    URL.revokeObjectURL(url);
}

export function MyMenteesView({ mentees: initialMentees }: { mentees: MyMentee[] }) {
    const [mentees, setMentees] = useState<MyMentee[]>(initialMentees);
    const [facility, setFacility] = useState("ALL");
    const [level, setLevel] = useState("ALL");
    const [assessmentFilter, setAssessmentFilter] = useState("ALL");
    const [view, setView] = useState<"list" | "grid">("list");
    const [page, setPage] = useState(1);

    // Success banner state from redirect
    const [newAssignmentBanner, setNewAssignmentBanner] = useState<{
        menteeId: string;
        menteeName: string;
        type: string;
    } | null>(null);

    // Detail dialog state
    const [selectedAssessment, setSelectedAssessment] = useState<MentorAssessment | null>(null);
    const [selectedMentee, setSelectedMentee] = useState<MyMentee | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Synchronize stored assessments from localStorage / client events
    useEffect(() => {
        const syncStored = () => {
            const stored = getStoredAssessments();
            if (!stored || stored.length === 0) return;

            setMentees((prev) =>
                prev.map((m) => {
                    const match = stored.find((a) => a.menteeId === m.id);
                    if (match) {
                        return {
                            ...m,
                            assignedAssessment: match,
                        };
                    }
                    return m;
                })
            );
        };

        // Initial client sync
        syncStored();

        // Listen for new assignments dispatched across the app
        window.addEventListener("cbcm-assessments-updated", syncStored);
        return () => {
            window.removeEventListener("cbcm-assessments-updated", syncStored);
        };
    }, []);

    // Check URL parameters for newly assigned assessment
    useEffect(() => {
        if (typeof window === "undefined") return;

        const params = new URLSearchParams(window.location.search);
        const assignedMenteeId = params.get("assignedMenteeId");
        const assignedType = params.get("assignedType");
        const menteeNameParam = params.get("menteeName");

        if (assignedMenteeId) {
            const targetMentee = mentees.find((m) => m.id === assignedMenteeId);
            const mName = menteeNameParam || targetMentee?.name || "Mentee";
            const aType = assignedType || targetMentee?.assignedAssessment?.type || "Assessment";

            setNewAssignmentBanner({
                menteeId: assignedMenteeId,
                menteeName: mName,
                type: aType,
            });

            // If the target mentee is on another page, calculate and jump to that page
            const targetIndex = mentees.findIndex((m) => m.id === assignedMenteeId);
            if (targetIndex >= 0) {
                const targetPage = Math.floor(targetIndex / PAGE_SIZE) + 1;
                setPage(targetPage);
            }

            // Clean up URL without causing full reload
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, "", cleanUrl);
        }
    }, [mentees]);

    const handleSelectAssessment = (assessment: MentorAssessment, mentee: MyMentee) => {
        setSelectedAssessment(assessment);
        setSelectedMentee(mentee);
        setIsDetailOpen(true);
    };

    const handleAssessmentUpdated = (updated: MentorAssessment) => {
        setSelectedAssessment(updated);
        setMentees((prev) =>
            prev.map((m) =>
                m.id === updated.menteeId
                    ? { ...m, assignedAssessment: updated }
                    : m
            )
        );
    };

    const facilities = useMemo(
        () => Array.from(new Set(mentees.map((m) => m.facility))).sort(),
        [mentees]
    );

    const filtered = useMemo(() => {
        return mentees.filter((m) => {
            const matchFac = facility === "ALL" || m.facility === facility;
            const matchLevel = level === "ALL" || m.level === level;

            let matchAssessment = true;
            if (assessmentFilter === "ASSIGNED") {
                matchAssessment = Boolean(m.assignedAssessment);
            } else if (assessmentFilter === "PENDING") {
                matchAssessment = m.assignedAssessment?.status === "PENDING";
            } else if (assessmentFilter === "UNASSIGNED") {
                matchAssessment = !m.assignedAssessment;
            }

            return matchFac && matchLevel && matchAssessment;
        });
    }, [mentees, facility, level, assessmentFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const selectClass =
        "rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 outline-none focus:border-[#194611]";
    const toggleClass = (active: boolean) =>
        cn(
            "rounded-md p-1.5 transition",
            active ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:bg-gray-100"
        );

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Newly Assigned Assessment Success Notification Banner */}
            {newAssignmentBanner && (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <CheckCircle2 className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-sm font-bold text-emerald-950">
                                Assessment Successfully Assigned!
                            </p>
                            <p className="text-xs text-emerald-800">
                                <span className="font-semibold">{newAssignmentBanner.type}</span> was assigned to{" "}
                                <span className="font-semibold">{newAssignmentBanner.menteeName}</span>. The mentee can now see the task and reading materials.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {(() => {
                            const target = mentees.find((m) => m.id === newAssignmentBanner.menteeId);
                            if (target?.assignedAssessment) {
                                return (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectAssessment(target.assignedAssessment!, target)}
                                        className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 transition"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        View Details
                                    </button>
                                );
                            }
                            return null;
                        })()}
                        <button
                            type="button"
                            onClick={() => setNewAssignmentBanner(null)}
                            className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100"
                            aria-label="Dismiss banner"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Mentees</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Managing {mentees.length} active clinical mentees and tracking their procedural competencies.
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() => downloadRoster(filtered)}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-200 transition"
                    >
                        <Download className="h-4 w-4" />
                        Export Roster
                    </button>
                    <Link
                        href="/my-assessments/new"
                        className="flex items-center gap-2 rounded-lg bg-[#194611] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f2f0b] transition shadow-xs"
                    >
                        <UserPlus className="h-4 w-4" />
                        New Assessment
                    </Link>
                </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                    </span>
                    <select
                        aria-label="Filter by facility"
                        value={facility}
                        onChange={(e) => {
                            setFacility(e.target.value);
                            setPage(1);
                        }}
                        className={selectClass}
                    >
                        <option value="ALL">All Facilities</option>
                        {facilities.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label="Filter by competency level"
                        value={level}
                        onChange={(e) => {
                            setLevel(e.target.value);
                            setPage(1);
                        }}
                        className={selectClass}
                    >
                        <option value="ALL">All Levels</option>
                        {LEVELS.map((l) => (
                            <option key={l} value={l}>
                                {LEVEL_LABEL[l]}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label="Filter by assessment status"
                        value={assessmentFilter}
                        onChange={(e) => {
                            setAssessmentFilter(e.target.value);
                            setPage(1);
                        }}
                        className={selectClass}
                    >
                        <option value="ALL">All Assessments</option>
                        <option value="ASSIGNED">Has Assigned Assessment</option>
                        <option value="PENDING">Pending Review</option>
                        <option value="UNASSIGNED">No Active Assessment</option>
                    </select>
                </div>

                {/* View switcher (list vs cards) */}
                <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                    <button
                        type="button"
                        aria-label="List view"
                        aria-pressed={view === "list"}
                        onClick={() => setView("list")}
                        className={toggleClass(view === "list")}
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Grid view"
                        aria-pressed={view === "grid"}
                        onClick={() => setView("grid")}
                        className={toggleClass(view === "grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Mentee List View / Cards View */}
            {view === "list" ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                    <MenteesTable
                        mentees={visible}
                        onSelectAssessment={handleSelectAssessment}
                        highlightMenteeId={newAssignmentBanner?.menteeId}
                    />
                    <MenteesPagination
                        page={safePage}
                        totalPages={totalPages}
                        total={filtered.length}
                        pageSize={PAGE_SIZE}
                        onChange={setPage}
                    />
                </div>
            ) : (
                <>
                    <MenteeCards
                        mentees={visible}
                        onSelectAssessment={handleSelectAssessment}
                        highlightMenteeId={newAssignmentBanner?.menteeId}
                    />
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                        <MenteesPagination
                            page={safePage}
                            totalPages={totalPages}
                            total={filtered.length}
                            pageSize={PAGE_SIZE}
                            onChange={setPage}
                        />
                    </div>
                </>
            )}

            {/* Assessment Detail Modal Dialog */}
            <AssessmentDetailDialog
                assessment={selectedAssessment}
                mentee={selectedMentee}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                onAssessmentUpdated={handleAssessmentUpdated}
            />
        </div>
    );
}