"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, AlertTriangle, ExternalLink, CheckCircle2 } from "lucide-react";
import { createAssignment } from "@/services/assignment-form.service";
import {
    MAX_MENTEES_PER_ASSIGNMENT,
    type AssignmentFormOptions,
    type AssignmentType,
} from "@/types/assignment-form";
import MenteePicker from "./MenteePicker";
import MentorPicker from "./MentorPicker";
import ThematicAreaInput from "./ThematicAreaInput";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface AddAssignmentFormProps {
    options: AssignmentFormOptions;
}

type FormErrors = Partial<
    Record<
        "cycleId" | "thematicAreas" | "mentorIds" | "menteeIds" | "startDate" | "endDate" | "override",
        string
    >
>;

const inputClass =
    "h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDD028]";

function borderFor(hasError: boolean) {
    return hasError ? "border-red-400" : "border-gray-200";
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-800">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-xl border border-gray-200 border-l-4 border-l-[#194611] bg-white p-6">
            <h2 className="border-b border-gray-100 pb-3 text-base font-semibold text-gray-900">{title}</h2>
            <div className="mt-4 space-y-5">{children}</div>
        </section>
    );
}

export default function AddAssignmentForm({ options }: AddAssignmentFormProps) {
    const router = useRouter();

    const [type, setType] = useState<AssignmentType>("individual");
    const [cycleId, setCycleId] = useState("");
    const [thematicAreas, setThematicAreas] = useState<string[]>([]);
    const [mentorIds, setMentorIds] = useState<string[]>([]);
    const [menteeIds, setMenteeIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");
    const [overrideReason, setOverrideReason] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const selectedCycle = useMemo(
        () => options.cycles.find((c) => c.id === cycleId),
        [options.cycles, cycleId]
    );

    // A selected mentor is "over capacity" when their current load plus the
    // mentees in this assignment (at least 1) would go past their maximum.
    const overloadedMentors = useMemo(() => {
        const incoming = Math.max(menteeIds.length, 1);
        return options.mentors.filter(
            (m) => mentorIds.includes(m.id) && m.currentLoad + incoming > m.maxLoad,
        );
    }, [options.mentors, mentorIds, menteeIds.length]);

    function handleTypeChange(next: AssignmentType) {
        setType(next);
        if (next === "individual") setMentorIds((ids) => ids.slice(0, 1));
    }

    function toggleMentor(id: string) {
        setMentorIds((ids) => {
            if (ids.includes(id)) return ids.filter((i) => i !== id);
            return type === "individual" ? [id] : [...ids, id];
        });
    }

    function toggleMentee(id: string) {
        setMenteeIds((ids) => {
            if (ids.includes(id)) return ids.filter((i) => i !== id);
            if (ids.length >= MAX_MENTEES_PER_ASSIGNMENT) return ids;
            return [...ids, id];
        });
    }

    function handleCycleChange(id: string) {
        setCycleId(id);
        // Option 1: Reset thematic areas when cycle changes to avoid unassigned area selection
        setThematicAreas([]);
        setErrors((prev) => ({
            ...prev,
            cycleId: undefined,
            thematicAreas: undefined,
        }));

        const cycle = options.cycles.find((c) => c.id === id);
        if (cycle) {
            setStartDate((d) => d || cycle.startDate);
            setEndDate((d) => d || cycle.endDate);
        }
    }

    function validate(): FormErrors {
        const next: FormErrors = {};
        if (!cycleId) next.cycleId = "Select a mentorship cycle.";
        if (thematicAreas.length === 0) {
            if (!selectedCycle) {
                next.thematicAreas = "Select a mentorship cycle first, then choose an accredited thematic area.";
            } else if (!selectedCycle.thematicAreaNames || selectedCycle.thematicAreaNames.length === 0) {
                next.thematicAreas = "This cycle has no thematic areas linked. Please link thematic areas in Cycle Management first.";
            } else {
                next.thematicAreas = "Add at least one thematic area.";
            }
        }
        if (mentorIds.length === 0) next.mentorIds = "Select at least one mentor.";
        if (menteeIds.length === 0) next.menteeIds = "Select at least one mentee.";
        if (!startDate) next.startDate = "Choose a start date.";
        if (!endDate) next.endDate = "Choose an expected end date.";
        else if (startDate && endDate < startDate) {
            next.endDate = "The end date must be on or after the start date.";
        }
        if (overloadedMentors.length > 0 && !overrideReason.trim()) {
            next.override = "Add a justification to go over a mentor's capacity.";
        }
        return next;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setSubmitting(true);
        setSubmitError("");
        try {
            const selectedMentor = options.mentors.find((m) => mentorIds.includes(m.id));
            const selectedMentees = options.mentees.filter((me) => menteeIds.includes(me.id));
            if (!selectedMentor || selectedMentees.length !== menteeIds.length) {
                throw new Error("The selected mentor or mentee could not be resolved from the backend options.");
            }

            const created = await createAssignment({
                type,
                cycleId,
                cycleName: selectedCycle?.name,
                facilityId: selectedMentees[0]?.facilityId || selectedMentor.facilityId,
                thematicAreas,
                mentorIds,
                menteeIds,
                startDate,
                endDate,
                notes: notes.trim(),
                capacityOverrideReason: overloadedMentors.length > 0 ? overrideReason.trim() : undefined,
            });

            if (created.ids.length === 0) {
                throw new Error("The backend did not confirm creation of any assignments.");
            }
            router.push(`/assignments/${created.ids[0]}`);
            router.refresh();
        } catch (err: any) {
            console.error("Assignment creation error:", err);
            setSubmitError(err?.message || "The assignment couldn't be created on the backend database.");
        } finally {
            setSubmitting(false);
        }
    }

    const hasCycleThematicAreas = selectedCycle && (selectedCycle.thematicAreaNames?.length || 0) > 0;

    return (
        <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-3xl space-y-6 pb-8">
            <div>
                <nav aria-label="Breadcrumb" className="mb-3 text-xs text-gray-500">
                    <Link href="/assignments" className="hover:underline">
                        Clinical Assignments
                    </Link>{" "}
                    &gt; <span className="font-medium text-[#194611]">Add New Assignment</span>
                </nav>
                <h1 className="text-3xl font-bold text-[#194611]">Add New Assignment</h1>
                <p className="mt-1 text-sm text-gray-600">Create a new mentorship link between clinical staff.</p>
            </div>

            {/* 1. Assignment details */}
            <Section title="1. Assignment Details">
                <Field label="Assignment Type">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {(
                            [
                                { id: "individual", label: "Individual Mentor" },
                                { id: "team", label: "Mentoring Team" },
                            ] as { id: AssignmentType; label: string }[]
                        ).map((option) => (
                            <label
                                key={option.id}
                                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                                    type === option.id ? "border-[#194611] bg-gray-50" : "border-gray-200"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="assignment-type"
                                    value={option.id}
                                    checked={type === option.id}
                                    onChange={() => handleTypeChange(option.id)}
                                    className="accent-[#194611]"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </Field>

                <Field label="Mentorship Cycle" error={errors.cycleId}>
                    <SearchableSelect
                        options={options.cycles.map((cycle) => ({
                            value: cycle.id,
                            label: cycle.name,
                        }))}
                        value={cycleId}
                        onChange={handleCycleChange}
                        placeholder="Select a cycle..."
                        searchPlaceholder="Search cycles..."
                        size="lg"
                        error={errors.cycleId}
                    />

                    {selectedCycle && (
                        <div className="mt-2.5 space-y-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-xs">
                            <div className="flex items-center justify-between text-gray-600">
                                <span className="font-medium text-gray-700">{selectedCycle.name}</span>
                                {selectedCycle.startDate && selectedCycle.endDate && (
                                    <span className="text-[11px] text-gray-500">
                                        {selectedCycle.startDate} to {selectedCycle.endDate}
                                    </span>
                                )}
                            </div>

                            {hasCycleThematicAreas ? (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span className="text-gray-500 text-[11px]">Accredited areas in this cycle:</span>
                                    {selectedCycle.thematicAreaNames?.map((name) => (
                                        <span
                                            key={name}
                                            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-[#194611] border border-emerald-200/60"
                                        >
                                            <CheckCircle2 className="size-3 text-[#194611]" />
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                                        <div className="space-y-1.5 flex-1">
                                            <p className="font-semibold text-amber-950">
                                                No Thematic Areas Linked to This Cycle
                                            </p>
                                            <p className="text-amber-800 leading-relaxed text-[11px]">
                                                This cycle doesn&apos;t have any accredited thematic areas linked yet. Please link thematic areas in Cycle Management first to establish assignments.
                                            </p>
                                            <div className="pt-1">
                                                <Link
                                                    href={`/cycles/${selectedCycle.id}`}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1.5 rounded-md bg-[#194611] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#13360d] transition shadow-2xs"
                                                >
                                                    <span>Open Cycle Management</span>
                                                    <ExternalLink className="size-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Field>

                <Field label="Thematic Area" error={errors.thematicAreas}>
                    <ThematicAreaInput
                        value={thematicAreas}
                        onChange={(val) => {
                            setThematicAreas(val);
                            if (errors.thematicAreas) {
                                setErrors((prev) => ({ ...prev, thematicAreas: undefined }));
                            }
                        }}
                        suggestions={selectedCycle?.thematicAreaNames || []}
                        thematicAreaItems={options.thematicAreaItems}
                        cycleThematicAreaNames={selectedCycle ? (selectedCycle.thematicAreaNames || []) : undefined}
                        disabled={!selectedCycle || !hasCycleThematicAreas}
                        placeholder={
                            !selectedCycle
                                ? "Select a mentorship cycle first to view accredited thematic areas..."
                                : !hasCycleThematicAreas
                                ? "No thematic areas linked to this cycle. Link them in Cycle Management."
                                : "Select accredited thematic area for this cycle..."
                        }
                        invalid={!!errors.thematicAreas}
                    />
                    {!selectedCycle && (
                        <p className="mt-1 text-xs text-gray-500">
                            Thematic areas are filtered based on the selected mentorship cycle.
                        </p>
                    )}
                </Field>
            </Section>

            {/* 2. Participant selection */}
            <Section title="2. Participant Selection">
                <Field
                    label={type === "team" ? "Select Mentors" : "Select Mentor"}
                    error={errors.mentorIds}
                >
                    <MentorPicker
                        mentors={options.mentors}
                        selectedIds={mentorIds}
                        onToggle={toggleMentor}
                        invalid={!!errors.mentorIds}
                    />
                </Field>

                {overloadedMentors.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <p className="flex items-start gap-2">
                            <Info className="mt-0.5 size-4 shrink-0" />
                            <span>
                                {overloadedMentors.map((m) => m.name).join(", ")}{" "}
                                {overloadedMentors.length === 1 ? "would exceed" : "would exceed"} the maximum
                                mentee capacity with this assignment. Select an alternative mentor, reduce the
                                mentees, or override with justification.
                            </span>
                        </p>
                        <textarea
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            rows={2}
                            placeholder="Justification for exceeding the capacity limit..."
                            className={`mt-3 w-full rounded-lg border bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDD028] ${borderFor(
                                !!errors.override,
                            )}`}
                        />
                        {errors.override && <p className="mt-1 text-xs text-red-600">{errors.override}</p>}
                    </div>
                )}

                <Field
                    label={`Select Mentees (up to ${MAX_MENTEES_PER_ASSIGNMENT})`}
                    error={errors.menteeIds}
                >
                    <MenteePicker
                        mentees={options.mentees}
                        selectedIds={menteeIds}
                        onToggle={toggleMentee}
                        max={MAX_MENTEES_PER_ASSIGNMENT}
                        invalid={!!errors.menteeIds}
                    />
                </Field>
            </Section>

            {/* 3. Timeline and notes */}
            <Section title="3. Timeline & Notes">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Start Date" error={errors.startDate}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`${inputClass} ${borderFor(!!errors.startDate)}`}
                        />
                    </Field>
                    <Field label="Expected End Date" error={errors.endDate}>
                        <input
                            type="date"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={`${inputClass} ${borderFor(!!errors.endDate)}`}
                        />
                    </Field>
                </div>

                <Field label="Notes / Special Instructions">
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={5}
                        placeholder="Enter any specific goals, focus areas, or logistical notes for this assignment..."
                        className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDD028]"
                    />
                </Field>
            </Section>

            {submitError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <p className="font-semibold">Unable to complete assignment</p>
                    <p className="mt-1 text-xs text-red-700">{submitError}</p>
                </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                <Link
                    href="/assignments"
                    className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium hover:bg-gray-50"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-10 items-center rounded-lg bg-[#194611] px-5 text-sm font-medium text-white hover:bg-[#194611]/90 disabled:opacity-60 cursor-pointer"
                >
                    {submitting ? "Creating..." : "Create Assignment"}
                </button>
            </div>
        </form>
    );
}
