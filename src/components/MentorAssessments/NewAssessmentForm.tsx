"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ClipboardList,
    CheckCircle2,
    Calendar,
    Award,
    BookOpen,
    ListChecks,
    Sliders,
    ExternalLink,
    Send,
    Loader2,
    Sparkles,
    ShieldCheck,
    AlertCircle,
} from "lucide-react";
import type { MyMentee } from "@/types/my-mentee";
import {
    createAssessment,
    PREPARED_ASSESSMENT_TEMPLATES,
} from "@/services/mentor-assessments.service";
import type { PreparedAssessmentTemplate } from "@/types/mentor-assessment";
import { MenteeAvatar } from "@/components/MyMentees/MenteeParts";
import { Field, inputClass } from "@/components/Settings/FormField";
import { assessmentSchema, type AssessmentFormValues } from "./assessmentSchema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
    mentees: MyMentee[];
    types: string[];
    initialMenteeId?: string;
}

function SectionCard({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: ReactNode;
    title: string;
    subtitle?: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
            <div className="mb-5 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#194611]">
                    {icon}
                </span>
                <div>
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="space-y-4">{children}</div>
        </section>
    );
}

export function NewAssessmentForm({ mentees, types, initialMenteeId }: Props) {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    // Default to the first prepared template
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
        PREPARED_ASSESSMENT_TEMPLATES[0]?.id || ""
    );

    const today = new Date().toISOString().slice(0, 10);
    const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    const selectedTemplate =
        PREPARED_ASSESSMENT_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
        PREPARED_ASSESSMENT_TEMPLATES[0];

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<AssessmentFormValues>({
        resolver: zodResolver(assessmentSchema),
        defaultValues: {
            menteeId: mentees.find((m) => m.id === initialMenteeId)?.id ?? mentees[0]?.id ?? "",
            type: selectedTemplate?.title ?? "",
            dueDate: defaultDueDate,
            instructions: selectedTemplate?.instructions ?? "",
            referenceLink: selectedTemplate?.referenceLink ?? "",
            feedback: "",
            notifyMentee: true,
        },
    });

    const selectedMentee = mentees.find((m) => m.id === watch("menteeId"));

    // Handle template selection
    const handleSelectTemplate = (template: PreparedAssessmentTemplate) => {
        setSelectedTemplateId(template.id);
        setValue("type", template.title, { shouldValidate: true });
        setValue("instructions", template.instructions, { shouldValidate: true });
        if (template.referenceLink) {
            setValue("referenceLink", template.referenceLink);
        }
    };

    const onSubmit = async (values: AssessmentFormValues) => {
        setServerError(null);
        try {
            await createAssessment({
                ...values,
                thematicAreaId: selectedTemplate?.thematicAreaId,
                checklistItems: selectedTemplate?.checklistItems,
                criteria: selectedTemplate?.criteria,
                attachmentNames: [],
            });

            router.push("/my-assessments");
            router.refresh();
        } catch (err) {
            console.error("Failed to assign prepared assessment:", err);
            setServerError(
                err instanceof Error
                    ? err.message
                    : "Couldn't assign the assessment. Please try again."
            );
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-4xl space-y-6 pb-20">
            {/* Header */}
            <div>
                <nav className="mb-3 text-xs text-gray-500">
                    <Link href="/my-assessments" className="hover:text-gray-800">
                        Assessments
                    </Link>
                    <span className="mx-1.5">&gt;</span>
                    <span className="font-medium text-gray-800">New Clinical Assessment</span>
                </nav>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#194611] sm:text-3xl">
                            Assign Clinical Assessment
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Select an accredited clinical competency template to assign to your mentee. No file upload required.
                        </p>
                    </div>
                    <Badge variant="outline" className="self-start sm:self-auto border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-1 font-semibold text-xs">
                        <Sparkles className="h-3.5 w-3.5 mr-1 text-[#194611]" />
                        Standardized Clinical Protocols
                    </Badge>
                </div>
            </div>

            {serverError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                    <span>{serverError}</span>
                </div>
            )}

            {/* Step 1: Select Candidate Midwife */}
            <SectionCard
                icon={<ClipboardList className="h-5 w-5" />}
                title="1. Select Candidate Midwife"
                subtitle="Choose the junior midwife or resident who will sit for this clinical evaluation."
            >
                <Field label="Candidate Midwife *" htmlFor="menteeId" error={errors.menteeId?.message}>
                    <select id="menteeId" {...register("menteeId")} className={inputClass}>
                        <option value="">Select a mentee...</option>
                        {mentees.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name} ({m.code}) — {m.facility || "Central Hospital"}
                            </option>
                        ))}
                    </select>
                </Field>

                {selectedMentee && (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
                        <div className="flex items-center gap-3">
                            <MenteeAvatar
                                name={selectedMentee.name}
                                avatarUrl={selectedMentee.avatarUrl}
                                className="h-10 w-10 ring-2 ring-white"
                            />
                            <div>
                                <p className="text-sm font-bold text-gray-900">{selectedMentee.name}</p>
                                <p className="text-xs text-gray-600">
                                    {selectedMentee.title || "Resident Midwife"} · {selectedMentee.facility || "Facility"}
                                </p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-white text-[#194611] font-semibold text-xs border border-gray-200">
                            Active Mentee
                        </Badge>
                    </div>
                )}
            </SectionCard>

            {/* Step 2: Choose Prepared Assessment Template */}
            <SectionCard
                icon={<Award className="h-5 w-5" />}
                title="2. Choose Standardized Assessment Template"
                subtitle="Select from prepared clinical evaluations mapped directly to theory quizzes and practical bedside checklists."
            >
                {/* Hidden input to bind type */}
                <input type="hidden" {...register("type")} />

                <div className="grid gap-3 sm:grid-cols-2">
                    {PREPARED_ASSESSMENT_TEMPLATES.map((template) => {
                        const isSelected = selectedTemplateId === template.id;
                        return (
                            <div
                                key={template.id}
                                onClick={() => handleSelectTemplate(template)}
                                className={cn(
                                    "flex flex-col justify-between rounded-xl border p-4 text-left transition cursor-pointer relative",
                                    isSelected
                                        ? "border-[#194611] bg-emerald-50/40 ring-2 ring-[#194611]/20 shadow-xs"
                                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                                )}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#194611] text-white shadow-2xs">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                    </div>
                                )}
                                <div>
                                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5 pr-6">
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] font-semibold tracking-wide uppercase border-gray-300 text-gray-700 bg-white"
                                        >
                                            {template.thematicArea}
                                        </Badge>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 leading-snug">
                                        {template.title}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                        {template.description}
                                    </p>
                                </div>

                                <div className="mt-3.5 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[11px] text-gray-500 font-medium">
                                    <span className="flex items-center gap-1 text-[#194611]">
                                        <BookOpen className="h-3 w-3" />
                                        Quiz Threshold: {template.passingTheoryThreshold}%
                                    </span>
                                    <span>
                                        Practical: {template.passingPracticalThreshold}/5 Scale
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}

                {/* Selected Template Components Preview */}
                {selectedTemplate && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-[#194611]" />
                                Prepared Clinical Rubric Details: {selectedTemplate.title}
                            </span>
                            <span className="text-[11px] text-gray-500">
                                {selectedTemplate.checklistItems.length} Checklist Items · {selectedTemplate.criteria.length} Criteria
                            </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 text-xs">
                            <div className="space-y-1.5">
                                <span className="font-semibold text-gray-700 flex items-center gap-1">
                                    <ListChecks className="h-3.5 w-3.5 text-[#194611]" />
                                    Procedural Checklist Steps:
                                </span>
                                <ul className="space-y-1 text-gray-600 list-disc list-inside">
                                    {selectedTemplate.checklistItems.slice(0, 4).map((item, i) => (
                                        <li key={i} className="truncate">{item}</li>
                                    ))}
                                    {selectedTemplate.checklistItems.length > 4 && (
                                        <li className="text-gray-400 italic">
                                            + {selectedTemplate.checklistItems.length - 4} more standardized steps
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <div className="space-y-1.5">
                                <span className="font-semibold text-gray-700 flex items-center gap-1">
                                    <Sliders className="h-3.5 w-3.5 text-[#194611]" />
                                    Bedside Criteria Rubrics (1-5):
                                </span>
                                <ul className="space-y-1 text-gray-600 list-disc list-inside">
                                    {selectedTemplate.criteria.map((crit, i) => (
                                        <li key={i} className="truncate">{crit}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Step 3: Instructions & Schedule */}
            <SectionCard
                icon={<Calendar className="h-5 w-5" />}
                title="3. Schedule & Preceptor Instructions"
                subtitle="Review clinical scope, assign due date, and provide any hospital-specific guidance."
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Assessment Due Date *" htmlFor="dueDate" error={errors.dueDate?.message}>
                        <input
                            id="dueDate"
                            type="date"
                            min={today}
                            {...register("dueDate")}
                            className={inputClass}
                        />
                    </Field>

                    <Field
                        label="Reference Protocol URL (Optional)"
                        htmlFor="referenceLink"
                        error={errors.referenceLink?.message}
                    >
                        <input
                            id="referenceLink"
                            type="url"
                            placeholder="https://who.int/..."
                            {...register("referenceLink")}
                            className={inputClass}
                        />
                    </Field>
                </div>

                <Field
                    label="Task Scope & Instructions *"
                    htmlFor="instructions"
                    error={errors.instructions?.message}
                >
                    <textarea
                        id="instructions"
                        rows={4}
                        placeholder="Clinical instructions for the mentee..."
                        {...register("instructions")}
                        className={inputClass}
                    />
                </Field>

                <Field
                    label="Mentor Preceptor Note (Optional)"
                    htmlFor="feedback"
                    error={errors.feedback?.message}
                >
                    <input
                        id="feedback"
                        type="text"
                        placeholder="Focus area (e.g. Focus on hand hygiene and prompt cord clamping)..."
                        {...register("feedback")}
                        className={inputClass}
                    />
                </Field>

                <div className="flex items-center gap-2 pt-1">
                    <input
                        id="notifyMentee"
                        type="checkbox"
                        {...register("notifyMentee")}
                        className="h-4 w-4 rounded border-gray-300 text-[#194611] focus:ring-[#194611]"
                    />
                    <label htmlFor="notifyMentee" className="text-xs font-medium text-gray-700 cursor-pointer">
                        Notify candidate via platform notification and messaging
                    </label>
                </div>
            </SectionCard>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                    href="/my-assessments"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#194611] px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#12330c] disabled:opacity-50 transition cursor-pointer"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Assigning Assessment...</span>
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4" />
                            <span>Assign Prepared Assessment</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
