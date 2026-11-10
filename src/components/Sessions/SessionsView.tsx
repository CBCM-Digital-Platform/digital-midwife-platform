"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    MapPin,
    Plus,
    Search,
    Send,
    Video,
    X,
    Play,
    Check,
    Stethoscope,
    AlertCircle,
    User,
    Pencil,
} from "lucide-react";
import type {
    ClinicalSession,
    ClinicalSessionNote,
    SessionJoinToken,
    SessionMode,
    SessionStatus,
} from "@/types/clinical-session";
import type { MyMentee } from "@/types/my-mentee";
import {
    addSessionNote,
    createSession,
    getSessionById,
    getSessionJoinToken,
    getSessionNotes,
    recordSessionParticipantJoin,
    updateSession,
    updateSessionStatus,
} from "@/services/sessions.service";
import { cn } from "@/lib/utils";

interface SessionsViewProps {
    initialSessions: ClinicalSession[];
    mentees: MyMentee[];
    loadError?: string | null;
}

type TabFilter = "ALL" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

function formatDateTime(iso: string) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function toLocalDateTimeInput(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 16);
}

function getDefaultScheduleTime(): string {
    return toLocalDateTimeInput(new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString());
}

export function SessionsView({ initialSessions, mentees, loadError = null }: SessionsViewProps) {
    const router = useRouter();
    const [sessions, setSessions] = useState<ClinicalSession[]>(initialSessions);
    const [tab, setTab] = useState<TabFilter>("ALL");
    const [search, setSearch] = useState("");

    // Schedule Modal
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<ClinicalSession | null>(null);
    const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
    const assignmentOptions = useMemo(
        () =>
            mentees.flatMap((mentee) =>
                (mentee.assignmentIds ?? []).map((assignmentId) => ({
                    assignmentId: String(assignmentId),
                    mentee,
                }))
            ),
        [mentees]
    );
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(
        assignmentOptions[0]?.assignmentId ?? ""
    );
    const [mode, setMode] = useState<SessionMode>("in_person");
    const [scheduledAt, setScheduledAt] = useState("");
    const [durationMinutes, setDurationMinutes] = useState(45);
    const [clinicalSetting, setClinicalSetting] = useState("Labor & Delivery Ward");
    const [sessionGoals, setSessionGoals] = useState("");
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Notes Modal
    const [activeSessionForNotes, setActiveSessionForNotes] = useState<ClinicalSession | null>(null);
    const [notesList, setNotesList] = useState<ClinicalSessionNote[]>([]);
    const [newNoteText, setNewNoteText] = useState("");
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [addingNote, setAddingNote] = useState(false);
    const [notesError, setNotesError] = useState<string | null>(null);

    // Call Token Dialog
    const [virtualCallInfo, setVirtualCallInfo] = useState<SessionJoinToken | null>(null);
    const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return sessions.filter((s) => {
            const matchesTab =
                tab === "ALL"
                    ? true
                    : tab === "SCHEDULED"
                    ? s.status === "scheduled" || s.status === "draft"
                    : tab === "IN_PROGRESS"
                    ? s.status === "in_progress"
                    : s.status === "completed";

            const matchesSearch =
                !q ||
                s.menteeName.toLowerCase().includes(q) ||
                (s.clinicalSetting && s.clinicalSetting.toLowerCase().includes(q)) ||
                (s.sessionGoals && s.sessionGoals.toLowerCase().includes(q));

            return matchesTab && matchesSearch;
        });
    }, [sessions, tab, search]);

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setScheduleError(null);

        const selectedAssignment = assignmentOptions.find((option) => option.assignmentId === selectedAssignmentId);
        if (!editingSession && !selectedAssignment) {
            setScheduleError("Select a mentee with an active assignment before scheduling a session.");
            return;
        }

        if (!scheduledAt) {
            setScheduleError("Please select a date and start time.");
            return;
        }

        const scheduledTime = new Date(scheduledAt).getTime();
        if (isNaN(scheduledTime)) {
            setScheduleError("Invalid date/time format.");
            return;
        }

        if (scheduledTime < Date.now() - 5 * 60 * 1000) {
            setScheduleError("Session date & time cannot be in the past.");
            return;
        }

        if (!durationMinutes || durationMinutes < 15 || durationMinutes > 240) {
            setScheduleError("Duration must be between 15 and 240 minutes.");
            return;
        }

        if (!clinicalSetting.trim()) {
            setScheduleError("Please enter a clinical setting / ward.");
            return;
        }

        const assignmentId = Number(selectedAssignmentId);
        if (!editingSession && (!Number.isInteger(assignmentId) || assignmentId <= 0)) {
            setScheduleError("The selected mentee assignment has an invalid ID.");
            return;
        }

        setIsScheduling(true);
        try {
            const values = {
                mode,
                scheduledAt: new Date(scheduledAt).toISOString(),
                durationMinutes,
                clinicalSetting: clinicalSetting.trim(),
                sessionGoals: sessionGoals.trim(),
            };
            const savedSession = editingSession
                ? await updateSession(editingSession.id, values)
                : await createSession({
                    ...values,
                    assignmentId,
                    status: "scheduled",
                });

            // Ensure mentee details are visible
            const resolved = {
                ...savedSession,
                menteeName: selectedAssignment?.mentee.name || editingSession?.menteeName || savedSession.menteeName,
                menteeTitle: selectedAssignment?.mentee.title || editingSession?.menteeTitle || savedSession.menteeTitle,
            };

            setSessions((prev) =>
                editingSession
                    ? prev.map((session) => session.id === resolved.id ? resolved : session)
                    : [resolved, ...prev]
            );
            setIsScheduleOpen(false);
            setEditingSession(null);
            if (!editingSession) setSessionGoals("");
        } catch (err) {
            console.error("Failed to schedule session:", err);
            setScheduleError(err instanceof Error ? err.message : "Failed to schedule session. Please try again.");
        } finally {
            setIsScheduling(false);
        }
    };

    const handleEditSession = async (sessionId: string) => {
        setScheduleError(null);
        setActionError(null);
        setLoadingSessionId(sessionId);
        try {
            const session = await getSessionById(sessionId);
            setEditingSession(session);
            setMode(session.mode);
            setScheduledAt(toLocalDateTimeInput(session.scheduledAt));
            setDurationMinutes(session.durationMinutes);
            setClinicalSetting(session.clinicalSetting ?? "");
            setSessionGoals(session.sessionGoals ?? "");
            if (session.assignmentId !== undefined) {
                setSelectedAssignmentId(String(session.assignmentId));
            }
            setIsScheduleOpen(true);
        } catch (error) {
            console.error(`Could not load session ${sessionId} for editing:`, error);
            setActionError(error instanceof Error ? error.message : "Unable to load session details.");
        } finally {
            setLoadingSessionId(null);
        }
    };

    const handleStatusChange = async (sessionId: string, newStatus: SessionStatus) => {
        setActionError(null);
        try {
            await updateSessionStatus(sessionId, newStatus);
            setSessions((prev) =>
                prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s))
            );
        } catch (error) {
            console.error(`Failed to update session ${sessionId}:`, error);
            setActionError(error instanceof Error ? error.message : "Unable to update the session.");
        }
    };

    const handleOpenNotes = async (session: ClinicalSession) => {
        setActiveSessionForNotes(session);
        setLoadingNotes(true);
        setNotesError(null);
        try {
            const notes = await getSessionNotes(session.id);
            setNotesList(notes);
        } catch (error) {
            console.error(`Could not load notes for session ${session.id}:`, error);
            setNotesError(error instanceof Error ? error.message : "Unable to load session notes.");
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSessionForNotes || !newNoteText.trim()) return;
        setAddingNote(true);
        setNotesError(null);
        try {
            const created = await addSessionNote(activeSessionForNotes.id, newNoteText.trim());
            setNotesList((prev) => [created, ...prev]);
            setNewNoteText("");
        } catch (error) {
            console.error("Could not save clinical session note:", error);
            setNotesError(error instanceof Error ? error.message : "Unable to save the note.");
        } finally {
            setAddingNote(false);
        }
    };

    const handleJoinVirtual = async (sessionId: string) => {
        setJoiningSessionId(sessionId);
        setActionError(null);
        try {
            const tokenData = await getSessionJoinToken(sessionId);
            if (!tokenData.room && !tokenData.joinUrl) {
                throw new Error("The backend did not return a meeting room for this session.");
            }
            await recordSessionParticipantJoin(sessionId);
            setVirtualCallInfo(tokenData);
        } catch (error) {
            console.error(`Unable to join session ${sessionId}:`, error);
            setActionError(error instanceof Error ? error.message : "Unable to join the virtual session.");
        } finally {
            setJoiningSessionId(null);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                        Clinical Mentoring Sessions
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Schedule, supervise, and document direct clinical encounters with assigned midwives.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setEditingSession(null);
                        setScheduledAt(getDefaultScheduleTime());
                        setMode("in_person");
                        setDurationMinutes(45);
                        setClinicalSetting("Labor & Delivery Ward");
                        setSessionGoals("");
                        setScheduleError(null);
                        setIsScheduleOpen(true);
                    }}
                    disabled={assignmentOptions.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#194611] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#12330c]"
                >
                    <Plus className="h-4 w-4" />
                    Schedule Clinical Session
                </button>
            </div>

            {actionError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {actionError}
                </div>
            )}

            {/* Filters Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: "ALL", label: `All (${sessions.length})` },
                        {
                            id: "SCHEDULED",
                            label: `Scheduled (${sessions.filter((s) => s.status === "scheduled" || s.status === "draft").length})`,
                        },
                        {
                            id: "IN_PROGRESS",
                            label: `In Progress (${sessions.filter((s) => s.status === "in_progress").length})`,
                        },
                        {
                            id: "COMPLETED",
                            label: `Completed (${sessions.filter((s) => s.status === "completed").length})`,
                        },
                    ].map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id as TabFilter)}
                            className={cn(
                                "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
                                tab === t.id
                                    ? "border-[#194611] bg-[#194611] text-white"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <label className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 sm:w-64">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search mentee or ward..."
                        className="w-full text-xs outline-none placeholder:text-gray-400"
                    />
                </label>
            </div>

            {loadError ? (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                    <span>{loadError}</span>
                    <button
                        type="button"
                        onClick={() => router.refresh()}
                        className="rounded-lg border border-red-300 bg-white px-3 py-1.5 font-medium hover:bg-red-100"
                    >
                        Retry
                    </button>
                </div>
            ) : (
            /* Sessions Cards Grid */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((s) => (
                    <div
                        key={s.id}
                        className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-[#194611]/30 hover:shadow-sm"
                    >
                        <div>
                            {/* Top row: Mode badge & Status badge */}
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold",
                                        s.mode === "virtual"
                                            ? "bg-purple-50 text-purple-800 border border-purple-200"
                                            : s.mode === "hybrid"
                                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    )}
                                >
                                    {s.mode === "virtual" ? (
                                        <Video className="h-3 w-3" />
                                    ) : (
                                        <MapPin className="h-3 w-3" />
                                    )}
                                    <span className="capitalize">{s.mode.replace("_", " ")}</span>
                                </span>

                                <span
                                    className={cn(
                                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                        s.status === "completed"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : s.status === "in_progress"
                                            ? "bg-amber-100 text-amber-800 animate-pulse"
                                            : s.status === "cancelled"
                                            ? "bg-rose-100 text-rose-800"
                                            : "bg-gray-100 text-gray-700"
                                    )}
                                >
                                    {s.status.replace("_", " ")}
                                </span>
                            </div>

                            {/* Mentee info */}
                            <div className="mt-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#194611]/10 text-xs font-bold text-[#194611]">
                                    {s.menteeName
                                        .split(" ")
                                        .map((p) => p[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">{s.menteeName}</h3>
                                    <div className="text-[11px] text-gray-500">{s.menteeTitle || "Midwife Resident"}</div>
                                </div>
                            </div>

                            {/* Date, Time & Setting */}
                            <div className="mt-4 space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                    <span>{formatDateTime(s.scheduledAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                    <span>{s.durationMinutes} minutes duration</span>
                                </div>
                                <div className="flex items-center gap-2 truncate">
                                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                    <span className="truncate">{s.clinicalSetting}</span>
                                </div>
                            </div>

                            {s.sessionGoals && (
                                <p className="mt-3 line-clamp-2 text-xs text-gray-500 italic">
                                    &ldquo;{s.sessionGoals}&rdquo;
                                </p>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="mt-5 border-t border-gray-100 pt-3 flex flex-wrap items-center gap-2">
                            {(s.status === "scheduled" || s.status === "draft") && (
                                <button
                                    type="button"
                                    onClick={() => handleEditSession(s.id)}
                                    disabled={loadingSessionId === s.id}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    {loadingSessionId === s.id ? "Loading..." : "Edit"}
                                </button>
                            )}
                            {s.mode === "virtual" && s.status !== "completed" && s.status !== "cancelled" && (
                                <button
                                    type="button"
                                    onClick={() => handleJoinVirtual(s.id)}
                                    disabled={joiningSessionId === s.id}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-purple-800 transition"
                                >
                                    <Video className="h-3.5 w-3.5" />
                                    {joiningSessionId === s.id ? "Connecting..." : "Join Call"}
                                </button>
                            )}

                            {s.status === "scheduled" && (
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange(s.id, "in_progress")}
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                                >
                                    <Play className="h-3.5 w-3.5" />
                                    Start
                                </button>
                            )}

                            {s.status === "in_progress" && (
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange(s.id, "completed")}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    Complete
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => handleOpenNotes(s)}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                Notes
                            </button>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
                        No clinical sessions found matching the active criteria.
                    </div>
                )}
            </div>
            )}

            {/* Schedule Session Modal */}
            {isScheduleOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                        onClick={() => {
                            setIsScheduleOpen(false);
                            setEditingSession(null);
                        }}
                    />
                    <div className="relative z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingSession ? "Edit Clinical Session" : "Schedule Clinical Session"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsScheduleOpen(false);
                                    setEditingSession(null);
                                }}
                                className="rounded p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSession} className="space-y-4">
                            {scheduleError && (
                                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                    <div className="flex-1 font-medium">{scheduleError}</div>
                                </div>
                            )}
                            {!editingSession && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700">Resident Mentee</label>
                                        <select
                                            value={selectedAssignmentId}
                                            onChange={(e) => setSelectedAssignmentId(e.target.value)}
                                            disabled={assignmentOptions.length === 0}
                                            className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-xs outline-none focus:border-[#194611]"
                                        >
                                            {assignmentOptions.length === 0 ? (
                                                <option value="">No active mentee assignments</option>
                                            ) : assignmentOptions.map(({ assignmentId, mentee }) => (
                                                <option key={`${assignmentId}-${mentee.id}`} value={assignmentId}>
                                                    {mentee.name} ({mentee.title || "Resident"})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {assignmentOptions.length === 0 && (
                                        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                            A mentee must have an active assignment before a clinical session can be scheduled.
                                        </p>
                                    )}
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700">Session Mode</label>
                                    <select
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value as SessionMode)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-xs outline-none focus:border-[#194611]"
                                    >
                                        <option value="in_person">In-Person (Ward Observation)</option>
                                        <option value="virtual">Virtual (Case Consultation)</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700">Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        min="15"
                                        max="180"
                                        step="15"
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-xs outline-none focus:border-[#194611]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700">Date & Start Time</label>
                                <input
                                    type="datetime-local"
                                    value={scheduledAt}
                                    onChange={(e) => setScheduledAt(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-xs outline-none focus:border-[#194611]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700">Clinical Setting / Ward</label>
                                <input
                                    type="text"
                                    value={clinicalSetting}
                                    onChange={(e) => setClinicalSetting(e.target.value)}
                                    placeholder="e.g. Labor & Delivery Suite, ANC Clinic"
                                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-xs outline-none focus:border-[#194611]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700">Session Goals</label>
                                <textarea
                                    rows={3}
                                    value={sessionGoals}
                                    onChange={(e) => setSessionGoals(e.target.value)}
                                    placeholder="Key procedural techniques, checklist evaluation targets, or case review objectives..."
                                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-xs outline-none focus:border-[#194611]"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsScheduleOpen(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isScheduling}
                                    className="rounded-lg bg-[#194611] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#12330c] disabled:opacity-50"
                                >
                                    {isScheduling
                                        ? editingSession ? "Saving..." : "Scheduling..."
                                        : editingSession ? "Save Changes" : "Schedule Session"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Clinical Notes Drawer / Dialog */}
            {activeSessionForNotes && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setActiveSessionForNotes(null)} />
                    <div className="relative z-50 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">
                                    Clinical Encounter Notes
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {activeSessionForNotes.menteeName} • {activeSessionForNotes.clinicalSetting}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveSessionForNotes(null)}
                                className="rounded p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Existing Notes */}
                        <div className="max-h-60 overflow-y-auto space-y-2.5 mb-4 pr-1">
                            {loadingNotes ? (
                                <p className="text-center text-xs text-gray-400 py-4">Loading notes...</p>
                            ) : notesError ? (
                                <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                                    {notesError}
                                </p>
                            ) : notesList.length > 0 ? (
                                notesList.map((n) => (
                                    <div key={n.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs">
                                        <div className="flex items-center justify-between text-gray-500 mb-1">
                                            <span className="font-semibold text-gray-700">{n.mentorName}</span>
                                            <span className="text-[10px]">{formatDateTime(n.createdAt)}</span>
                                        </div>
                                        <p className="text-gray-800 leading-relaxed">{n.note}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-xs text-gray-400 py-4">
                                    No clinical notes recorded yet for this encounter.
                                </p>
                            )}
                        </div>

                        {/* Add note input */}
                        <form onSubmit={handleAddNote} className="space-y-3 border-t border-gray-100 pt-3">
                            <textarea
                                rows={3}
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                                placeholder="Add observations, clinical guidance, or feedback..."
                                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs outline-none focus:border-[#194611]"
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={!newNoteText.trim() || addingNote}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#194611] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#12330c] disabled:opacity-50"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    {addingNote ? "Saving..." : "Add Note"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Virtual Call Join Dialog */}
            {virtualCallInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setVirtualCallInfo(null)} />
                    <div className="relative z-50 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-700 mb-3">
                            <Video className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Virtual Preceptor Room</h3>
                        <p className="mt-1 text-xs text-gray-500">
                            Room: <span className="font-mono font-semibold">{virtualCallInfo.room}</span>
                        </p>
                        <p className="mt-3 text-xs text-gray-600">
                            Your secure clinical video session room is ready. Click below to launch in a new window.
                        </p>

                        <div className="mt-5 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setVirtualCallInfo(null)}
                                className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <a
                                href={virtualCallInfo.joinUrl || `https://${virtualCallInfo.domain}/${virtualCallInfo.room}${
                                    virtualCallInfo.token ? `?jwt=${virtualCallInfo.token}` : ""
                                }`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 rounded-lg bg-purple-700 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-800"
                            >
                                Launch Meeting →
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
