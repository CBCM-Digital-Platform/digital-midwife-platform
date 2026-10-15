import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Calendar, CheckCircle2, Layers, Users } from "lucide-react";
import { getCycleById } from "@/services/cycle-data.service";
import CycleStatusBadge from "@/components/Cycle/CycleStatusBadge";

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
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Facilities</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{cycle.facilities}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mentors</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{cycle.mentors}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mentees</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{cycle.mentees}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Overall Progress</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{cycle.progress}%</p>
                </div>
            </div>

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
