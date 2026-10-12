"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { createAssignment } from "@/services/assignment-form.service";
import {
    MAX_MENTEES_PER_ASSIGNMENT,
    type AssignmentFormOptions,
    type AssignmentType,
} from "@/types/assignment-form";
import MenteePicker from "./MenteePicker";
import MentorPicker from "./MentorPicker";
import ThematicAreaInput from "./ThematicAreaInput";

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
        // An individual assignment has exactly one mentor
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
        const cycle = options.cycles.find((c) => c.id === id);
        // Prefill the dates from the cycle, but never overwrite what was typed
        if (cycle) {
            setStartDate((d) => d || cycle.startDate);
            setEndDate((d) => d || cycle.endDate);
        }
    }

    function validate(): FormErrors {
        const next: FormErrors = {};
        if (!cycleId) next.cycleId = "Select a mentorship cycle.";
        if (thematicAreas.length === 0) next.thematicAreas = "Add at least one thematic area.";
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
            await createAssignment({
                type,
                cycleId,
                thematicAreas,
                mentorIds,
                menteeIds,
                startDate,
                endDate,
                notes: notes.trim(),
                capacityOverrideReason: overloadedMentors.length > 0 ? overrideReason.trim() : undefined,
            });
            router.push("/assignments");
        } catch {
            setSubmitError("The assignment couldn't be created. Check your connection and try again.");
            setSubmitting(false);
        }
    }

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
                                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${type === option.id ? "border-[#194611] bg-gray-50" : "border-gray-200"
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
                    <select
                        value={cycleId}
                        onChange={(e) => handleCycleChange(e.target.value)}
                        className={`${inputClass} ${borderFor(!!errors.cycleId)}`}
                    >
                        <option value="">Select a cycle...</option>
                        {options.cycles.map((cycle) => (
                            <option key={cycle.id} value={cycle.id}>
                                {cycle.name}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field label="Thematic Area" error={errors.thematicAreas}>
                    <ThematicAreaInput
                        value={thematicAreas}
                        onChange={setThematicAreas}
                        suggestions={options.thematicAreas}
                        invalid={!!errors.thematicAreas}
                    />
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
                <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                </p>
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
                    className="inline-flex h-10 items-center rounded-lg bg-[#194611] px-5 text-sm font-medium text-white hover:bg-[#194611]/90 disabled:opacity-60"
                >
                    {submitting ? "Creating..." : "Create Assignment"}
                </button>
            </div>
        </form>
    );
}