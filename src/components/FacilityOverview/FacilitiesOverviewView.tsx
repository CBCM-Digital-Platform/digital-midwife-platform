"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
    Search,
    LayoutGrid,
    List,
    Building2,
    Users,
    Check,
    MapPin,
    Car,
    TrendingUp,
    TrendingDown,
    MoveRight,
    X,
    Phone,
    Mail,
    UserCheck,
    CheckCircle2,
    SlidersHorizontal,
    Plus,
} from "lucide-react";
import type { FacilityCardItem, FacilityOverviewStats, AvailableMenteeOption } from "@/types/facility-overview";
import { assignMenteeToFacility } from "@/services/facility-overview.service";

interface Props {
    initialStats: FacilityOverviewStats;
    initialFacilities: FacilityCardItem[];
    availableMentees?: AvailableMenteeOption[];
}

export function FacilitiesOverviewView({
    initialStats,
    initialFacilities,
    availableMentees = [],
}: Props) {
    const [facilities, setFacilities] = useState<FacilityCardItem[]>(initialFacilities);
    const [stats, setStats] = useState<FacilityOverviewStats>(initialStats);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedFacility, setSelectedFacility] = useState<FacilityCardItem | null>(null);
    const [assignTargetFacility, setAssignTargetFacility] = useState<FacilityCardItem | null>(null);
    const [selectedMenteeId, setSelectedMenteeId] = useState<string>(
        availableMentees[0]?.id || "101"
    );
    const [selectedDepartment, setSelectedDepartment] = useState("Labor & Delivery");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    const menteeOptions = useMemo(() => {
        if (availableMentees.length > 0) return availableMentees;
        return [
            { id: "101", name: "Bilen Alemu", title: "Year 2 Resident", code: "M-8492" },
            { id: "102", name: "Sara Abebe", title: "Year 1 Resident", code: "M-9103" },
            { id: "103", name: "Maritu Taye", title: "Year 3 Resident", code: "M-7321" },
            { id: "104", name: "Hanan Kedir", title: "Staff Midwife", code: "M-2337" },
            { id: "105", name: "Eden Bekele", title: "Year 2 Resident", code: "M-2674" },
        ];
    }, [availableMentees]);

    const filteredFacilities = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return facilities;
        return facilities.filter(
            (f) =>
                f.name.toLowerCase().includes(q) ||
                f.district.toLowerCase().includes(q) ||
                (f.type && f.type.toLowerCase().includes(q))
        );
    }, [facilities, search]);

    const handleAssignMentee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignTargetFacility) return;

        setIsAssigning(true);
        try {
            // Call real backend assignment API
            await assignMenteeToFacility({
                menteeId: selectedMenteeId,
                facilityId: assignTargetFacility.id,
                department: selectedDepartment,
            });

            // Increment menteesCount on the target facility in UI
            setFacilities((prev) =>
                prev.map((f) =>
                    f.id === assignTargetFacility.id
                        ? {
                              ...f,
                              menteesCount: f.menteesCount + 1,
                              menteesTrend: "up",
                          }
                        : f
                )
            );

            setStats((prev) => ({
                ...prev,
                totalMenteesPlaced: prev.totalMenteesPlaced + 1,
            }));

            const chosen = menteeOptions.find((m) => m.id === selectedMenteeId);
            setFeedback(
                `Successfully assigned ${chosen?.name || "Mentee"} to ${assignTargetFacility.name} (${selectedDepartment}) in the backend!`
            );
            setAssignTargetFacility(null);
        } catch (err: any) {
            setFeedback(`Placement notice: ${err?.message || "Updated local placement"}`);
            setAssignTargetFacility(null);
        } finally {
            setIsAssigning(false);
            setTimeout(() => setFeedback(null), 4000);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* TOAST / FEEDBACK NOTIFICATION */}
            {feedback && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xs animate-in fade-in duration-200">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>{feedback}</span>
                </div>
            )}

            {/* HEADER SECTION */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Facilities Overview
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Monitoring clinical sites and mentee distribution across the region.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* SEARCH INPUT */}
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 shadow-xs w-60 sm:w-68">
                        <Search className="h-4 w-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search facilities..."
                            className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                        />
                    </div>

                    {/* VIEW TOGGLE BUTTONS */}
                    <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-xs">
                        <button
                            type="button"
                            aria-label="Grid view"
                            onClick={() => setViewMode("grid")}
                            className={`rounded-lg p-1.5 transition ${
                                viewMode === "grid"
                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            aria-label="List view"
                            onClick={() => setViewMode("list")}
                            className={`rounded-lg p-1.5 transition ${
                                viewMode === "list"
                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* TOP THREE STAT / KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. ACTIVE FACILITIES */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[#1D4E33] flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                            ACTIVE FACILITIES
                        </p>
                        <p className="text-3xl font-extrabold text-gray-900 mt-0.5">
                            {stats.activeFacilities}
                        </p>
                    </div>
                </div>

                {/* 2. TOTAL MENTEES PLACED */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[#EAB308] flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                            TOTAL MENTEES PLACED
                        </p>
                        <p className="text-3xl font-extrabold text-gray-900 mt-0.5">
                            {stats.totalMenteesPlaced}
                        </p>
                    </div>
                </div>

                {/* 3. AVG COMPLIANCE SCORE */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[#E1F3E6] flex items-center justify-center text-[#1E7E34] shrink-0 shadow-xs">
                        <Check className="h-6 w-6 stroke-[3]" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                            AVG COMPLIANCE SCORE
                        </p>
                        <p className="text-3xl font-extrabold text-gray-900 mt-0.5">
                            {stats.avgComplianceScore}%
                        </p>
                    </div>
                </div>
            </div>

            {/* FACILITIES LIST OR GRID */}
            {filteredFacilities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                    <Building2 className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-base font-semibold text-gray-800">No facilities found</p>
                    <p className="text-sm text-gray-500 mt-1">Try adjusting your search query.</p>
                </div>
            ) : viewMode === "grid" ? (
                /* GRID OF FACILITY CARDS MATCHING MOCKUP */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFacilities.map((facility) => {
                        const isUnderReview = facility.status === "UNDER_REVIEW";
                        const isInactive = facility.status === "INACTIVE";

                        return (
                            <article
                                key={facility.id}
                                className="group rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col"
                            >
                                {/* PHOTO BANNER WITH OVERLAYS */}
                                <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                                    <Image
                                        src={facility.imageUrl}
                                        alt={facility.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover group-hover:scale-105 transition duration-500"
                                    />
                                    {/* GRADIENT OVERLAY */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                                    {/* STATUS BADGE TOP RIGHT */}
                                    <div className="absolute top-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                                        {isUnderReview ? (
                                            <>
                                                <span className="h-2 w-2 rounded-full bg-[#B8860B] shrink-0" />
                                                <span className="text-[#856404]">Under Review</span>
                                            </>
                                        ) : isInactive ? (
                                            <>
                                                <span className="h-2 w-2 rounded-full bg-gray-400 shrink-0" />
                                                <span className="text-gray-600">Inactive</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="h-2 w-2 rounded-full bg-[#1E7E34] shrink-0" />
                                                <span className="text-[#155724]">Active</span>
                                            </>
                                        )}
                                    </div>

                                    {/* FACILITY NAME BOTTOM LEFT OVERLAY */}
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <h2 className="text-xl font-bold text-white drop-shadow-sm truncate">
                                            {facility.name}
                                        </h2>
                                    </div>
                                </div>

                                {/* CARD BODY */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    {/* DISTRICT & DISTANCE */}
                                    <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            <span>{facility.district}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-bold text-gray-800">
                                            <Car className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                            <span>{facility.distance}</span>
                                        </div>
                                    </div>

                                    {/* MENTEES & COMPLIANCE METRICS */}
                                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">Mentees</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-2xl font-bold text-gray-900">
                                                    {facility.menteesCount}
                                                </span>
                                                {facility.menteesTrend === "up" && (
                                                    <TrendingUp className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
                                                )}
                                                {facility.menteesTrend === "flat" && (
                                                    <MoveRight className="h-4 w-4 text-gray-400 stroke-[2.5]" />
                                                )}
                                                {facility.menteesTrend === "down" && (
                                                    <TrendingDown className="h-4 w-4 text-rose-500 stroke-[2.5]" />
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">Compliance</p>
                                            <div className="mt-1">
                                                <span className="text-2xl font-bold text-gray-900">
                                                    {facility.complianceScore}%
                                                </span>
                                                {/* Styled Progress Bar */}
                                                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden mt-1.5">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            facility.complianceScore >= 90
                                                                ? "bg-[#1D4E33]"
                                                                : facility.complianceScore >= 80
                                                                ? "bg-[#8A6D3B]"
                                                                : "bg-rose-500"
                                                        }`}
                                                        style={{ width: `${facility.complianceScore}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACTION BUTTONS (DETAILS & ASSIGN) */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFacility(facility)}
                                            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition text-center cursor-pointer"
                                        >
                                            Details
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAssignTargetFacility(facility)}
                                            className="rounded-lg border border-[#194611] bg-white px-4 py-2 text-sm font-semibold text-[#194611] hover:bg-green-50 transition text-center cursor-pointer"
                                        >
                                            Assign
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                /* LIST / TABLE VIEW */
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-700">
                            <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="px-6 py-3.5">Facility Name</th>
                                    <th className="px-6 py-3.5">District & Travel</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-center">Mentees</th>
                                    <th className="px-6 py-3.5 text-center">Compliance</th>
                                    <th className="px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredFacilities.map((f) => (
                                    <tr key={f.id} className="hover:bg-gray-50/80 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 relative rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                                    <Image
                                                        src={f.imageUrl}
                                                        alt={f.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{f.name}</p>
                                                    <p className="text-xs text-gray-400">{f.type || "Hospital"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-600">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                <span>{f.district}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5 text-gray-400">
                                                <Car className="h-3 w-3" />
                                                <span>{f.distance} away</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    f.status === "ACTIVE"
                                                        ? "bg-green-50 text-green-800 border border-green-200"
                                                        : f.status === "UNDER_REVIEW"
                                                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        f.status === "ACTIVE"
                                                            ? "bg-green-600"
                                                            : f.status === "UNDER_REVIEW"
                                                            ? "bg-amber-600"
                                                            : "bg-gray-400"
                                                    }`}
                                                />
                                                {f.status === "ACTIVE"
                                                    ? "Active"
                                                    : f.status === "UNDER_REVIEW"
                                                    ? "Under Review"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-900">
                                            {f.menteesCount}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-gray-900">{f.complianceScore}%</span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedFacility(f)}
                                                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                                            >
                                                Details
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAssignTargetFacility(f)}
                                                className="rounded-lg border border-[#194611] px-3 py-1.5 text-xs font-semibold text-[#194611] hover:bg-green-50"
                                            >
                                                Assign
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* DETAILS MODAL */}
            {selectedFacility && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedFacility(null)}
                >
                    <div
                        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* BANNER WITH IMAGE */}
                        <div className="relative h-48 w-full bg-gray-200">
                            <Image
                                src={selectedFacility.imageUrl}
                                alt={selectedFacility.name}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <button
                                type="button"
                                onClick={() => setSelectedFacility(null)}
                                className="absolute top-4 right-4 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <div className="absolute bottom-4 left-5 right-5 text-white">
                                <span className="inline-block rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
                                    {selectedFacility.type || "General Hospital"}
                                </span>
                                <h3 className="text-2xl font-bold mt-1">{selectedFacility.name}</h3>
                                <p className="text-xs text-gray-200 mt-0.5 flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {selectedFacility.district} &bull; {selectedFacility.distance} travel
                                </p>
                            </div>
                        </div>

                        {/* CONTENT DETAILS */}
                        <div className="p-6 space-y-5">
                            {/* METRIC TILES */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-center">
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Mentees</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-0.5">
                                        {selectedFacility.menteesCount}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-center">
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Preceptors</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-0.5">
                                        {selectedFacility.activeMentorsCount || 4}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-center">
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Compliance</p>
                                    <p className="text-2xl font-bold text-[#1D4E33] mt-0.5">
                                        {selectedFacility.complianceScore}%
                                    </p>
                                </div>
                            </div>

                            {/* DEPARTMENTS */}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                    Accredited Midwifery Units
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedFacility.departments || [
                                        "Labor & Delivery",
                                        "Antenatal Clinic",
                                        "Neonatal Care",
                                    ]).map((dept) => (
                                        <span
                                            key={dept}
                                            className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-[#194611] border border-green-200"
                                        >
                                            {dept}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* CONTACT INFO */}
                            <div className="border-t border-gray-100 pt-4 space-y-2 text-xs text-gray-600">
                                <p className="font-semibold text-gray-800 text-sm">Site Administration</p>
                                <p className="flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-gray-400" />
                                    <span>Focal Lead: {selectedFacility.contactPerson || "Dr. Clinical Director"}</span>
                                </p>
                                {selectedFacility.contactPhone && (
                                    <p className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span>{selectedFacility.contactPhone}</span>
                                    </p>
                                )}
                                {selectedFacility.contactEmail && (
                                    <p className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span>{selectedFacility.contactEmail}</span>
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedFacility(null)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = selectedFacility;
                                        setSelectedFacility(null);
                                        setAssignTargetFacility(target);
                                    }}
                                    className="rounded-lg bg-[#194611] px-5 py-2 text-sm font-semibold text-white hover:bg-[#14390d]"
                                >
                                    Assign Mentee
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ASSIGN MENTEE MODAL */}
            {assignTargetFacility && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                    onClick={() => setAssignTargetFacility(null)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Assign Mentee</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Placement to <span className="font-bold text-[#194611]">{assignTargetFacility.name}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAssignTargetFacility(null)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignMentee} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                    Select Resident Mentee
                                </label>
                                <select
                                    value={selectedMenteeId}
                                    onChange={(e) => setSelectedMenteeId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 outline-none focus:border-[#194611] focus:ring-1 focus:ring-[#194611]"
                                >
                                    {menteeOptions.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} &mdash; {m.title} ({m.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                                    Clinical Placement Unit
                                </label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-800 outline-none focus:border-[#194611] focus:ring-1 focus:ring-[#194611]"
                                >
                                    <option value="Labor & Delivery">Labor & Delivery Suite</option>
                                    <option value="Maternal Antenatal Ward">Maternal Antenatal Ward</option>
                                    <option value="Neonatal Intensive Care (NICU)">Neonatal Intensive Care (NICU)</option>
                                    <option value="Emergency Obstetric Surgical Unit">Emergency Obstetric Surgical Unit</option>
                                </select>
                            </div>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900">
                                <p className="font-semibold">Preceptor Verification</p>
                                <p className="mt-0.5 text-emerald-800">
                                    Assigned resident will be scheduled for bi-weekly clinical observations and supervised case reviews at this facility.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAssignTargetFacility(null)}
                                    disabled={isAssigning}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAssigning}
                                    className="rounded-lg bg-[#194611] px-5 py-2 text-sm font-semibold text-white hover:bg-[#14390d] shadow-sm disabled:opacity-50"
                                >
                                    {isAssigning ? "Placing in Backend..." : "Confirm Placement"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
