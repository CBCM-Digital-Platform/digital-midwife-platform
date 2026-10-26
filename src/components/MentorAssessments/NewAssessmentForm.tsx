"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, Paperclip, Upload, X } from "lucide-react";
import type { MyMentee } from "@/types/my-mentee";
import { createAssessment } from "@/services/mentor-assessments.service";
import { MenteeAvatar } from "@/components/MyMentees/MenteeParts";
import { Field, inputClass } from "@/components/Settings/FormField";
import {
    ALLOWED_EXTENSIONS,
    MAX_FILES,
    MAX_FILE_MB,
    assessmentSchema,
    fileExtension,
    type AssessmentFormValues,
} from "./assessmentSchema";

interface Props {
    mentees: MyMentee[];
    types: string[];
    initialMenteeId?: string;
}

function formatSize(bytes: number) {
    return bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function Card({
    icon,
    title,
    children,
}: {
    icon: ReactNode;
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-gray-900">
                <span className="text-[#194611]">{icon}</span>
                {title}
            </h2>
            <div className="space-y-4">{children}</div>
        </section>
    );
}

export function NewAssessmentForm({ mentees, types, initialMenteeId }: Props) {
    const router = useRouter();
    const fileInput = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);

    const today = new Date().toISOString().slice(0, 10);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<AssessmentFormValues>({
        resolver: zodResolver(assessmentSchema),
        defaultValues: {
            menteeId: mentees.find((m) => m.id === initialMenteeId)?.id ?? "",
            type: "",
            dueDate: "",
            instructions: "",
            referenceLink: "",
            feedback: "",
            notifyMentee: true,
        },
    });

    const selected = mentees.find((m) => m.id === watch("menteeId"));

    const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
        const picked = Array.from(e.target.files ?? []);
        e.target.value = ""; // allow picking the same file again
        if (picked.length === 0) return;

        const wrongType = picked.find((f) => !ALLOWED_EXTENSIONS.includes(fileExtension(f.name)));
        if (wrongType) {
            setFileError(`"${wrongType.name}" is not a supported file type.`);
            return;
        }
        const tooBig = picked.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
        if (tooBig) {
            setFileError(`"${tooBig.name}" is larger than ${MAX_FILE_MB} MB.`);
            return;
        }

        const merged = [
            ...files,
            ...picked.filter((p) => !files.some((f) => f.name === p.name && f.size === p.size)),
        ];
        if (merged.length > MAX_FILES) {
            setFileError(`You can attach up to ${MAX_FILES} files.`);
            return;
        }
        setFiles(merged);
        setFileError(null);
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setFileError(null);
    };

    const onSubmit = async (values: AssessmentFormValues) => {
        setServerError(null);
        try {
            await createAssessment({ ...values, attachmentNames: files.map((f) => f.name) }, files);
            const menteeName = mentees.find((m) => m.id === values.menteeId)?.name || "Mentee";
            router.push(
                `/my-mentees?assignedMenteeId=${encodeURIComponent(values.menteeId)}&assignedType=${encodeURIComponent(values.type)}&menteeName=${encodeURIComponent(menteeName)}`
            );
            router.refresh();
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Couldn't assign the assessment. Please try again."
            );
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-3xl space-y-6">
            <div>
                <nav className="mb-3 text-xs text-gray-500">
                    <Link href="/my-assessments" className="hover:text-gray-800">
                        Assessments
                    </Link>
                    <span className="mx-1.5">&gt;</span>
                    <span className="font-medium text-gray-800">New Assessment</span>
                </nav>
                <h1 className="text-3xl font-bold tracking-tight text-[#194611]">New Assessment</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Assign an assessment or reading task to one of your mentees.
                </p>
            </div>

            <Card icon={<ClipboardList className="h-5 w-5" />} title="Assessment Details">
                <Field label="Mentee *" htmlFor="menteeId" error={errors.menteeId?.message}>
                    <select id="menteeId" {...register("menteeId")} className={inputClass}>
                        <option value="">Select a mentee</option>
                        {mentees.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name} ({m.code})
                            </option>
                        ))}
                    </select>
                </Field>

                {selected && (
                    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
                        <MenteeAvatar name={selected.name} avatarUrl={selected.avatarUrl} className="h-9 w-9" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                            <p className="text-xs text-gray-500">
                                {selected.title} · {selected.facility}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Assessment Type *" htmlFor="type" error={errors.type?.message}>
                        <select id="type" {...register("type")} className={inputClass}>
                            <option value="">Select assessment type</option>
                            {types.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Due Date *" htmlFor="dueDate" error={errors.dueDate?.message}>
                        <input id="dueDate" type="date" min={today} {...register("dueDate")} className={inputClass} />
                    </Field>
                </div>

                <Field
                    label="Task / Instructions *"
                    htmlFor="instructions"
                    error={errors.instructions?.message}
                >
                    <textarea
                        id="instructions"
                        rows={5}
                        placeholder="Describe what the mentee needs to do or study..."
                        {...register("instructions")}
                        className={inputClass}
                    />
                </Field>
            </Card>

            <Card icon={<Paperclip className="h-5 w-5" />} title="Materials & Feedback">
                <div>
                    <p className="mb-1.5 text-sm font-medium text-gray-700">
                        Reading materials <span className="font-normal text-gray-400">(optional)</span>
                    </p>
                    <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:border-[#194611] hover:bg-green-50"
                    >
                        <Upload className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Click to upload files</span>
                        <span className="text-xs text-gray-500">
                            PDF, Word, PowerPoint, images or MP4 · up to {MAX_FILES} files, {MAX_FILE_MB} MB each
                        </span>
                    </button>
                    <input
                        ref={fileInput}
                        type="file"
                        multiple
                        accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
                        onChange={onPickFiles}
                        className="hidden"
                    />
                    {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}

                    {files.length > 0 && (
                        <ul className="mt-3 space-y-2">
                            {files.map((f, i) => (
                                <li
                                    key={`${f.name}-${f.size}`}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <Paperclip className="h-4 w-4 shrink-0 text-gray-500" />
                                        <span className="truncate text-gray-800">{f.name}</span>
                                        <span className="shrink-0 text-xs text-gray-400">{formatSize(f.size)}</span>
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={`Remove ${f.name}`}
                                        onClick={() => removeFile(i)}
                                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <Field
                    label="Reference link (optional)"
                    htmlFor="referenceLink"
                    error={errors.referenceLink?.message}
                >
                    <input
                        id="referenceLink"
                        type="url"
                        placeholder="https://..."
                        {...register("referenceLink")}
                        className={inputClass}
                    />
                </Field>

                <Field
                    label="Comment / feedback for the mentee (optional)"
                    htmlFor="feedback"
                    error={errors.feedback?.message}
                >
                    <textarea
                        id="feedback"
                        rows={4}
                        placeholder="Add encouragement, feedback or things to focus on..."
                        {...register("feedback")}
                        className={inputClass}
                    />
                </Field>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        {...register("notifyMentee")}
                        className="h-4 w-4 rounded border-gray-300 accent-[#194611]"
                    />
                    Notify the mentee about this assessment
                </label>
            </Card>

            {serverError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {serverError}
                </p>
            )}

            <div className="flex items-center justify-end gap-3">
                <Link
                    href="/my-assessments"
                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-[#194611] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f2f0b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? "Assigning..." : "Assign Assessment"}
                </button>
            </div>
        </form>
    );
}