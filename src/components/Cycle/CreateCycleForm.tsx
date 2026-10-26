"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Calendar,
    Clock,
    FileText,
    Info,
    SlidersHorizontal,
    Sparkles,
    Target,
    X,
    Loader2,
    CheckCircle2,
    ArrowRight,
    Eye,
} from "lucide-react";
import type { Facility } from "@/types/newCycle";
import { createCycle } from "@/services/cycle-data.service";
import {
    ASSESSMENT_FREQUENCIES,
    THEMATIC_AREAS,
    cycleSchema,
    type CycleFormValues,
} from "./cycleSchema";

const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0B5D3B] focus:ring-1 focus:ring-[#0B5D3B]";

function Section({
    icon,
    title,
    children,
}: {
    icon: ReactNode;
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-gray-900">
                <span className="text-[#0B5D3B]">{icon}</span>
                {title}
            </h2>
            <div className="space-y-4">{children}</div>
        </section>
    );
}

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500"> *</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

interface CreatedCycleData {
    id: string;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    durationWeeks?: number | null;
    facilitiesCount: number;
    facilityNames: string[];
    thematicAreasCount: number;
    thematicAreas: string[];
    assessmentFrequency: string;
    maxMenteesPerMentor: number;
    maxFacilitiesPerMentor: number;
    description?: string;
    notes?: string;
}

export default function CreateCycleForm({ facilities }: { facilities: Facility[] }) {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [createdCycle, setCreatedCycle] = useState<CreatedCycleData | null>(null);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CycleFormValues>({
        resolver: zodResolver(cycleSchema),
        defaultValues: {
            name: "",
            code: "",
            description: "",
            startDate: "",
            endDate: "",
            facilityIds: [],
            thematicAreas: [],
            maxMenteesPerMentor: 3,
            maxFacilitiesPerMentor: 2,
            assessmentFrequency: "BI_WEEKLY",
            notes: "",
        },
    });

    const startDate = watch("startDate");
    const endDate = watch("endDate");
    const facilityIds = watch("facilityIds");
    const thematicAreas = watch("thematicAreas");

    const weeks =
        startDate && endDate && endDate > startDate
            ? Math.ceil(
                (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                (7 * 24 * 60 * 60 * 1000)
            )
            : null;

    const selectedFacilities = facilities.filter((f) => facilityIds.includes(f.id));
    const suggestions = facilities.filter(
        (f) =>
            !facilityIds.includes(f.id) &&
            f.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    const setFacilities = (ids: string[]) =>
        setValue("facilityIds", ids, { shouldValidate: true, shouldDirty: true });

    const toggleArea = (area: string) => {
        const next = thematicAreas.includes(area)
            ? thematicAreas.filter((a) => a !== area)
            : [...thematicAreas, area];
        setValue("thematicAreas", next, { shouldValidate: true, shouldDirty: true });
    };

    const autoGenerateCode = () => {
        const year = startDate ? new Date(startDate).getUTCFullYear() : new Date().getFullYear();
        const suffix = Math.floor(100 + Math.random() * 900);
        setValue("code", `CYC-${year}-${suffix}`, { shouldValidate: true, shouldDirty: true });
    };

    const onSubmit = async (values: CycleFormValues) => {
        setServerError(null);
        try {
            const res = await createCycle(values);
            if (res?.id) {
                // Save complete form metadata to localStorage so detail page can display all inputs
                try {
                    const meta = {
                        ...values,
                        id: res.id,
                        durationWeeks: weeks,
                        facilityNames: selectedFacilities.map((f) => f.name),
                    };
                    localStorage.setItem(`cycle_meta_${res.id}`, JSON.stringify(meta));
                } catch (e) {
                    console.warn("Could not write cycle_meta to localStorage", e);
                }

                setCreatedCycle({
                    id: res.id,
                    name: values.name,
                    code: values.code,
                    startDate: values.startDate,
                    endDate: values.endDate,
                    durationWeeks: weeks,
                    facilitiesCount: values.facilityIds.length,
                    facilityNames: selectedFacilities.map((f) => f.name),
                    thematicAreasCount: values.thematicAreas.length,
                    thematicAreas: values.thematicAreas,
                    assessmentFrequency: values.assessmentFrequency,
                    maxMenteesPerMentor: values.maxMenteesPerMentor,
                    maxFacilitiesPerMentor: values.maxFacilitiesPerMentor,
                    description: values.description,
                    notes: values.notes,
                });
            } else {
                router.push("/cycles");
            }
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Couldn't create the cycle. Please try again."
            );
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6">
            <nav className="mb-4 text-xs text-gray-500">
                <Link href="/cycles" className="hover:text-gray-800">
                    Cycles
                </Link>
                <span className="mx-1.5">&gt;</span>
                <span className="font-medium text-gray-800">Create New Cycle</span>
            </nav>

            <h1 className="text-3xl font-bold text-gray-900">Create New Cycle</h1>
            <p className="mt-1 mb-6 text-sm text-gray-500">
                Configure the parameters, scope, and objectives for a new mentorship cycle.
            </p>

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Cycle Information */}
                <Section icon={<Info className="h-4 w-4" />} title="Cycle Information">
                    <Field label="Cycle Name / Title" required error={errors.name?.message}>
                        <input
                            {...register("name")}
                            placeholder="e.g., 2024 H1 Adolescent Health"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Cycle Code" required error={errors.code?.message}>
                        <div className="flex gap-3">
                            <input
                                {...register("code")}
                                placeholder="Enter code or auto-generate"
                                className={inputClass}
                            />
                            <button
                                type="button"
                                onClick={autoGenerateCode}
                                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                <Sparkles className="h-4 w-4" />
                                Auto-generate
                            </button>
                        </div>
                    </Field>

                    <Field label="Description" error={errors.description?.message}>
                        <textarea
                            {...register("description")}
                            rows={4}
                            placeholder="Brief overview of this cycle's focus..."
                            className={inputClass}
                        />
                    </Field>
                </Section>

                {/* Duration */}
                <Section icon={<Calendar className="h-4 w-4" />} title="Duration">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Start Date" required error={errors.startDate?.message}>
                            <input type="date" {...register("startDate")} className={inputClass} />
                        </Field>
                        <Field label="End Date" required error={errors.endDate?.message}>
                            <input type="date" {...register("endDate")} className={inputClass} />
                        </Field>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg bg-gray-100 px-4 py-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                            <p className="text-[10px] font-semibold tracking-wide text-gray-500">
                                EXPECTED DURATION
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                                {weeks !== null ? `${weeks} ${weeks === 1 ? "week" : "weeks"}` : "-- weeks"}
                            </p>
                        </div>
                    </div>
                </Section>

                {/* Scope & Targets */}
                <Section icon={<Target className="h-4 w-4" />} title="Scope & Targets">
                    <Field label="Select Facilities" required error={errors.facilityIds?.message}>
                        <div className="relative">
                            <div
                                className={`flex min-h-[42px] flex-wrap items-center gap-2 rounded-lg border bg-white px-2 py-1.5 ${open ? "border-[#0B5D3B] ring-1 ring-[#0B5D3B]" : "border-gray-300"
                                    }`}
                            >
                                {selectedFacilities.map((f) => (
                                    <span
                                        key={f.id}
                                        className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
                                    >
                                        {f.name}
                                        <button
                                            type="button"
                                            aria-label={`Remove ${f.name}`}
                                            onClick={() => setFacilities(facilityIds.filter((id) => id !== f.id))}
                                            className="text-gray-500 hover:text-gray-900"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onFocus={() => setOpen(true)}
                                    onBlur={() => setOpen(false)}
                                    placeholder="Search facilities..."
                                    className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-gray-400"
                                />
                            </div>

                            {open && suggestions.length > 0 && (
                                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                    {suggestions.map((f) => (
                                        <li key={f.id}>
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault(); // keep the input focused
                                                    setFacilities([...facilityIds, f.id]);
                                                    setSearch("");
                                                }}
                                                className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                                            >
                                                {f.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </Field>

                    <Field label="Thematic Areas Covered" required error={errors.thematicAreas?.message}>
                        <div className="flex flex-wrap gap-2">
                            {THEMATIC_AREAS.map((area) => {
                                const active = thematicAreas.includes(area);
                                return (
                                    <button
                                        key={area}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => toggleArea(area)}
                                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${active
                                                ? "border-[#0B5D3B] bg-green-50 text-[#0B5D3B]"
                                                : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {area}
                                    </button>
                                );
                            })}
                        </div>
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Target Number of Mentors" required error={errors.targetMentors?.message}>
                            <input
                                type="number"
                                min={1}
                                placeholder="e.g. 10"
                                {...register("targetMentors", { valueAsNumber: true })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Target Number of Mentees" required error={errors.targetMentees?.message}>
                            <input
                                type="number"
                                min={1}
                                placeholder="e.g. 30"
                                {...register("targetMentees", { valueAsNumber: true })}
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </Section>

                {/* Mentorship Settings */}
                <Section icon={<SlidersHorizontal className="h-4 w-4" />} title="Mentorship Settings">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Max Mentees / Mentor" error={errors.maxMenteesPerMentor?.message}>
                            <input
                                type="number"
                                min={1}
                                {...register("maxMenteesPerMentor", { valueAsNumber: true })}
                                className={`${inputClass} text-center`}
                            />
                        </Field>
                        <Field label="Max Facilities / Mentor" error={errors.maxFacilitiesPerMentor?.message}>
                            <input
                                type="number"
                                min={1}
                                {...register("maxFacilitiesPerMentor", { valueAsNumber: true })}
                                className={`${inputClass} text-center`}
                            />
                        </Field>
                        <Field label="Assessment Frequency" error={errors.assessmentFrequency?.message}>
                            <select {...register("assessmentFrequency")} className={inputClass}>
                                {ASSESSMENT_FREQUENCIES.map((f) => (
                                    <option key={f.value} value={f.value}>
                                        {f.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </Section>

                {/* Objectives & Notes */}
                <Section icon={<FileText className="h-4 w-4" />} title="Objectives & Notes">
                    <Field label="Additional Notes / Objectives" error={errors.notes?.message}>
                        <textarea
                            {...register("notes")}
                            rows={4}
                            placeholder="Specific goals or operational notes for admins..."
                            className={inputClass}
                        />
                    </Field>
                </Section>

                {serverError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {serverError}
                    </p>
                )}
            </div>

            {/* Sticky action bar */}
            <div className="sticky bottom-0 -mx-6 mt-6 border-t border-gray-200 bg-white/90 px-6 py-4 backdrop-blur">
                <div className="mx-auto flex max-w-3xl justify-start gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/cycles")}
                        className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0B5D3B] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#094d31] disabled:cursor-not-allowed disabled:opacity-60 transition cursor-pointer"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                                <span>Creating Cycle in Backend...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                <span>Create Cycle</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* SUCCESS MODAL WITH VIEW DETAIL BUTTON */}
            {createdCycle && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-emerald-100 p-3 text-[#0B5D3B] shrink-0">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Cycle Created Successfully!
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Mentorship cycle <span className="font-semibold text-gray-800">"{createdCycle.name}"</span> has been created and initialized in the backend.
                                </p>
                            </div>
                        </div>

                        {/* SUMMARY CARD OF CREATED CYCLE */}
                        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-2.5 text-xs text-gray-700">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                                <span className="font-medium text-gray-500 uppercase tracking-wide">Cycle Code</span>
                                <span className="font-bold text-gray-900">{createdCycle.code}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                                <span className="font-medium text-gray-500 uppercase tracking-wide">Timeline</span>
                                <span className="font-semibold text-gray-900">
                                    {createdCycle.startDate} to {createdCycle.endDate}
                                    {createdCycle.durationWeeks ? ` (${createdCycle.durationWeeks} Weeks)` : ""}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                                <span className="font-medium text-gray-500 uppercase tracking-wide">Facilities Linked</span>
                                <span className="font-semibold text-gray-900">{createdCycle.facilitiesCount} Selected</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                                <span className="font-medium text-gray-500 uppercase tracking-wide">Thematic Areas</span>
                                <span className="font-semibold text-gray-900">{createdCycle.thematicAreasCount} Areas</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-500 uppercase tracking-wide">Mentorship Rules</span>
                                <span className="font-semibold text-gray-900">
                                    {createdCycle.maxMenteesPerMentor} Mentees/Mentor &bull; {createdCycle.assessmentFrequency}
                                </span>
                            </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Link
                                href={`/cycles/${createdCycle.id}`}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B5D3B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#094d31] transition shadow-sm"
                            >
                                <Eye className="h-4 w-4" />
                                <span>View Cycle Details</span>
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>

                            <button
                                type="button"
                                onClick={() => router.push("/cycles")}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Go to Cycles List
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}