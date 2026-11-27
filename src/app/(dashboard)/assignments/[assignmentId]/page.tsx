import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    GraduationCap,
    ShieldCheck,
    Stethoscope,
    Users,
    Sparkles,
} from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Avatar from "@/components/Assignment/Avatar";
import { getAssignmentById } from "@/services/assignments.service";
import { isAdminRole } from "@/types/navigation";

function formatDate(iso?: string) {
    if (!iso) return "Date not specified";
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return iso;
    }
}

export default async function AssignmentDetailPage({
    params,
}: {
    params: Promise<{ assignmentId: string }>;
}) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!isAdminRole(role)) redirect("/dashboard");

    const { assignmentId } = await params;
    if (!/^\d+$/.test(assignmentId)) notFound();

    let assignment;
    try {
        assignment = await getAssignmentById(assignmentId);
    } catch (error) {
        console.error(`Could not load assignment ${assignmentId} from the backend:`, error);
        return (
            <main className="mx-auto max-w-4xl space-y-6">
                <Link
                    href="/assignments"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#194611] hover:underline"
                >
                    <ArrowLeft className="size-4" />
                    Back to Assignments
                </Link>
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
                    <h1 className="font-semibold text-base">Unable to load assignment details</h1>
                    <p className="mt-1 text-red-700">
                        {error instanceof Error ? error.message : "The backend request failed. Please try again."}
                    </p>
                </div>
            </main>
        );
    }

    if (!assignment) notFound();

    const mentees = assignment.mentees?.length ? assignment.mentees : [assignment.mentee];
    const isActive = assignment.status === "active";

    // Clean up matching reason by stripping any internal tagging bracket if present
    const cleanMatchingReason = assignment.matchingReason
        ? assignment.matchingReason.replace(/\[Domain:\s*[^\]]+\]/i, "").trim()
        : null;

    return (
        <main className="mx-auto max-w-5xl space-y-6">
            {/* Navigation & Header */}
            <div>
                <Link
                    href="/assignments"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#194611] transition"
                >
                    <ArrowLeft className="size-4" />
                    Back to Assignments
                </Link>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-gray-500">
                                Assignment #{assignment.id}
                            </span>
                            {assignment.isNew && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                                    <Sparkles className="size-3" />
                                    New
                                </span>
                            )}
                        </div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#194611] sm:text-3xl">
                            Mentorship Pairing Details
                        </h1>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                                isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-amber-200 bg-amber-50 text-amber-800"
                            }`}
                        >
                            {isActive ? (
                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                            ) : (
                                <Clock className="size-3.5 text-amber-600" />
                            )}
                            {isActive ? "Active Mentorship" : "Pending Start"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Clinical Thematic Area Hero Card */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
                <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-50/60 via-gray-50/40 to-white p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#194611] text-[#FDD028] shadow-xs">
                                <Stethoscope className="size-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                    Thematic Clinical Area
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                                    {assignment.thematicDomain}
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Accredited Ministry of Health Clinical Mentorship Curriculum
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-lg bg-[#194611]/10 px-3 py-1.5 text-xs font-semibold text-[#194611]">
                                {assignment.thematicDomain}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Facility & Mentorship Cycle Metadata Bar */}
                <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 bg-gray-50/50">
                    <div className="flex items-center gap-3 p-4">
                        <Building2 className="size-5 shrink-0 text-[#194611]" />
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">Assigned Facility</p>
                            <p className="truncate text-sm font-semibold text-gray-900">
                                {assignment.facility}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4">
                        <Calendar className="size-5 shrink-0 text-[#194611]" />
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">Mentorship Cycle</p>
                            {assignment.cycleId ? (
                                <Link
                                    href={`/cycles/${assignment.cycleId}`}
                                    className="truncate text-sm font-semibold text-[#194611] hover:underline block"
                                    title="View Mentorship Cycle Details"
                                >
                                    {assignment.cycleName || `Cycle #${assignment.cycleId}`}
                                </Link>
                            ) : (
                                <p className="truncate text-sm font-semibold text-gray-900">
                                    {assignment.cycleName || "Cohort Mentorship Cycle"}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4">
                        <Clock className="size-5 shrink-0 text-[#194611]" />
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">Assignment Effective Date</p>
                            <p className="truncate text-sm font-semibold text-gray-900">
                                {formatDate(assignment.assignedDate)}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Paired Participants Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* 1. MENTOR PROFILE CARD */}
                <section className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs">
                    <div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#194611] px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase">
                                <ShieldCheck className="size-3.5" />
                                Lead Clinical Mentor
                            </span>
                            <span className="font-mono text-xs font-semibold text-[#194611] bg-[#194611]/10 px-2.5 py-1 rounded-md">
                                {assignment.mentor.code}
                            </span>
                        </div>

                        <div className="mt-5 flex items-start gap-4">
                            <Avatar
                                person={assignment.mentor}
                                size="lg"
                                className="size-16 text-lg ring-4 ring-emerald-500/10 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {assignment.mentor.name}
                                </h3>
                                <p className="mt-0.5 text-sm text-gray-600 font-medium">
                                    {assignment.mentor.subtitle || "Senior Clinical Preceptor"}
                                </p>
                                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                    <Building2 className="size-3.5 text-gray-400" />
                                    <span>{assignment.facility}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Mentorship Role & Responsibilities
                            </p>
                            <ul className="mt-2 space-y-1.5 text-xs text-gray-600">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                                    <span>Conducts weekly clinical bedside observation & feedback</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                                    <span>Evaluates clinical milestone logbooks in {assignment.thematicDomain}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-500 flex items-center justify-between">
                        <span>Cohort Supervised:</span>
                        <span className="font-semibold text-gray-900">{mentees.length} / 3 Mentees</span>
                    </div>
                </section>

                {/* 2. ASSIGNED MENTEES CARD */}
                <section className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs">
                    <div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                                <Users className="size-4 text-[#194611]" />
                                Assigned Mentees ({mentees.length})
                            </h3>
                            <span className="text-xs text-gray-500">
                                Clinical trainees
                            </span>
                        </div>

                        <div className="mt-5 space-y-3">
                            {mentees.map((mentee) => (
                                <div
                                    key={mentee.id}
                                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar
                                            person={mentee}
                                            className="size-11 text-xs shrink-0 ring-2 ring-emerald-500/10"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 truncate">
                                                {mentee.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                                {mentee.subtitle || "Resident Midwife"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                            <GraduationCap className="size-3" />
                                            In Training
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Curriculum Pathway
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                            Midwives are advancing their competency evaluations in <strong className="text-gray-900">{assignment.thematicDomain}</strong> under direct mentor verification.
                        </p>
                    </div>
                </section>
            </div>

            {/* Supervision Notes & Matching Reason Card */}
            {(cleanMatchingReason || assignment.notes) && (
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <FileText className="size-4 text-[#194611]" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                            Supervisory Objectives & Matching Notes
                        </h3>
                    </div>

                    <div className="mt-4 space-y-4 text-sm text-gray-700">
                        {cleanMatchingReason && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Clinical Matching Focus</p>
                                <p className="mt-1 rounded-lg bg-gray-50 p-3.5 text-sm text-gray-800 border border-gray-100">
                                    {cleanMatchingReason}
                                </p>
                            </div>
                        )}

                        {assignment.notes && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Special Instructions</p>
                                <p className="mt-1 rounded-lg bg-gray-50 p-3.5 text-sm text-gray-800 border border-gray-100">
                                    {assignment.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </main>
    );
}
