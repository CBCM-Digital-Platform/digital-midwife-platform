import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Layers,
    UserCheck,
    Users,
    Mail,
    Phone,
} from "lucide-react";
import { getCycleById } from "@/services/cycle-data.service";
import CycleStatusBadge from "@/components/Cycle/CycleStatusBadge";
import CycleDetailActions from "@/components/Cycle/CycleDetailActions";
import CycleConfigDisplay from "@/components/Cycle/CycleConfigDisplay";

interface Props {
    params: Promise<{ cycleId: string }>;
}

export default async function CycleDetailPage({ params }: Props) {
    const { cycleId } = await params;
    const cycle = await getCycleById(cycleId);

    if (!cycle) {
        notFound();
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <nav className="text-xs text-gray-500">
                <Link href="/cycles" className="inline-flex items-center gap-1 hover:text-gray-900 font-medium">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Mentorship Cycles
                </Link>
            </nav>

            <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{cycle.name}</h1>
                        <CycleStatusBadge status={cycle.status} />
                    </div>
                    <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                            {cycle.startDate} &mdash; {cycle.endDate}
                        </span>
                        {cycle.durationWeeks && (
                            <span className="font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs ml-1">
                                {cycle.durationWeeks} Weeks
                            </span>
                        )}
                    </p>
                </div>

                <CycleDetailActions
                    cycleId={cycle.id}
                    cycleName={cycle.name}
                    currentStatus={cycle.status}
                />
            </header>

            {/* KPI STATS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Facilities</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{cycle.facilities}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned Mentors</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{cycle.mentors}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned Mentees</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{cycle.mentees}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Overall Progress</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{cycle.progress}%</p>
                </div>
            </div>

            {/* CYCLE FORM SPECIFICATIONS & GOVERNANCE RULES */}
            <CycleConfigDisplay cycle={cycle} />

            {/* ASSIGNED MENTORS LIST */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-[#0B5D3B]" />
                        Assigned Mentors ({cycle.mentorList?.length || 0})
                    </h2>
                    <span className="text-xs text-gray-500">Clinical Preceptor Registry</span>
                </div>

                {cycle.mentorList && cycle.mentorList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {cycle.mentorList.map((m) => (
                            <div
                                key={m.id}
                                className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 hover:border-gray-200 transition"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900">{m.name}</p>
                                        <p className="text-xs text-[#0B5D3B] font-medium mt-0.5">{m.profession}</p>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                        {m.assignedMenteesCount ?? 0} Mentees
                                    </span>
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-200/60 space-y-1 text-xs text-gray-600">
                                    <p className="flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span className="truncate">{m.facility}</span>
                                    </p>
                                    {m.email && (
                                        <p className="flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            <span className="truncate">{m.email}</span>
                                        </p>
                                    )}
                                    {m.phone && (
                                        <p className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            <span>{m.phone}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic py-2">No mentors assigned to this cycle yet.</p>
                )}
            </section>

            {/* ASSIGNED MENTEES LIST */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="h-5 w-5 text-[#0B5D3B]" />
                        Assigned Mentees ({cycle.menteeList?.length || 0})
                    </h2>
                    <span className="text-xs text-gray-500">Student & Resident Cohort</span>
                </div>

                {cycle.menteeList && cycle.menteeList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {cycle.menteeList.map((m) => (
                            <div
                                key={m.id}
                                className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 hover:border-gray-200 transition"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900">{m.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{m.cadreLevel}</p>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        {m.mentorName ? `Mentor: ${m.mentorName}` : "Unpaired"}
                                    </span>
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-200/60 space-y-1 text-xs text-gray-600">
                                    <p className="flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span className="truncate">{m.facility}</span>
                                    </p>
                                    {m.email && (
                                        <p className="flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            <span className="truncate">{m.email}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic py-2">No mentees assigned to this cycle yet.</p>
                )}
            </section>

            {/* ASSIGNED FACILITIES */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#0B5D3B]" />
                    Assigned Facilities ({cycle.facilityList?.length || 0})
                </h2>
                {cycle.facilityList && cycle.facilityList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cycle.facilityList.map((f) => (
                            <div key={f.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <p className="font-medium text-sm text-gray-900">{f.name}</p>
                                {f.region && <p className="text-xs text-gray-500">{f.region}</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No facilities assigned yet.</p>
                )}
            </section>

            {/* THEMATIC AREAS */}
            {cycle.thematicAreaList && cycle.thematicAreaList.length > 0 && (
                <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Layers className="h-5 w-5 text-[#0B5D3B]" />
                        Thematic Areas ({cycle.thematicAreaList.length})
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {cycle.thematicAreaList.map((area) => (
                            <span
                                key={area.id}
                                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 border border-emerald-200"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                {area.name} ({area.code})
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
