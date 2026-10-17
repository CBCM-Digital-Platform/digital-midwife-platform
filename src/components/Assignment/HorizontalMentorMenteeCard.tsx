"use client";

import React from "react";
import Link from "next/link";
import {
    Sparkles,
    Building2,
    Calendar,
    ArrowRight,
    Users,
    Trash2,
    FileText,
    ExternalLink,
    CheckCircle2,
    Clock,
} from "lucide-react";
import type { Assignment, Person } from "@/types/assignment";
import Avatar from "./Avatar";

interface HorizontalMentorMenteeCardProps {
    assignment: Assignment;
    onRemove?: (id: string) => void;
}

function formatDate(isoString: string) {
    if (!isoString) return "Recent";
    try {
        return new Date(isoString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return isoString;
    }
}

export default function HorizontalMentorMenteeCard({
    assignment,
    onRemove,
}: HorizontalMentorMenteeCardProps) {
    const { mentor, thematicDomain, assignedDate, status, isNew, cycleName, notes } = assignment;

    // Resolve list of mentees (supports multiple or single mentee)
    const mentees: (Person & { facility?: string })[] =
        assignment.mentees && assignment.mentees.length > 0
            ? assignment.mentees
            : [{ ...assignment.mentee, facility: assignment.facility }];

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 bg-white ${
                isNew
                    ? "border-emerald-300 shadow-sm ring-1 ring-emerald-200"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-xs"
            }`}
        >
            {/* Top Bar / Meta Ribbon */}
            <div
                className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b text-xs ${
                    isNew
                        ? "bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-100"
                        : "bg-gray-50/70 border-gray-100 text-gray-500"
                }`}
            >
                <div className="flex flex-wrap items-center gap-2">
                    {isNew && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs">
                            <Sparkles className="size-3 animate-spin" />
                            New Assignment
                        </span>
                    )}
                    {cycleName && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 font-medium text-gray-700 border border-gray-200">
                            <Calendar className="size-3 text-gray-400" />
                            {cycleName}
                        </span>
                    )}
                    <span className="inline-flex items-center rounded-md bg-[#194611]/10 px-2.5 py-1 font-medium text-[#194611]">
                        {thematicDomain}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-gray-500">
                        <Clock className="size-3.5 text-gray-400" />
                        Assigned: <span className="font-medium text-gray-700">{formatDate(assignedDate)}</span>
                    </span>
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                        }`}
                    >
                        {status === "active" ? (
                            <CheckCircle2 className="size-3" />
                        ) : (
                            <Clock className="size-3" />
                        )}
                        {status === "active" ? "Active Pairing" : "Pending Start"}
                    </span>
                </div>
            </div>

            {/* Main Horizontal Content: Mentor (Left) -> Connector -> Mentees (Right) */}
            <div className="p-5">
                <div className="flex flex-col lg:flex-row items-stretch gap-4">
                    {/* 1. MENTOR COLUMN */}
                    <div className="w-full lg:w-80 shrink-0 flex flex-col justify-between rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50/80 to-white p-4">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center gap-1 rounded bg-[#194611] px-2 py-0.5 text-[11px] font-semibold tracking-wider text-white uppercase">
                                    Assigned Mentor
                                </span>
                                <span className="font-mono text-xs font-semibold text-[#194611] bg-[#194611]/10 px-2 py-0.5 rounded">
                                    {mentor.code}
                                </span>
                            </div>

                            <div className="flex items-start gap-3.5">
                                <Avatar person={mentor} className="size-14 text-base ring-2 ring-emerald-500/20" />
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-gray-900 text-base leading-tight">
                                        {mentor.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{mentor.subtitle}</p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                        <Building2 className="size-3 text-gray-400 shrink-0" />
                                        <span className="truncate">{assignment.facility}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mentor Capacity Load indicator */}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span className="flex items-center gap-1">
                                    <Users className="size-3.5 text-gray-400" />
                                    Assigned Load:
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {mentees.length} / 3 Mentees
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-[#194611] transition-all"
                                    style={{ width: `${Math.min((mentees.length / 3) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. CONNECTOR (Desktop visual link) */}
                    <div className="hidden lg:flex flex-col items-center justify-center px-1 text-gray-300">
                        <div className="flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-500">
                            <span>Mentoring</span>
                            <ArrowRight className="size-3 text-[#194611]" />
                        </div>
                    </div>

                    {/* 3. ASSIGNED MENTEES (Horizontal Grid / Row) */}
                    <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/40 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                <Users className="size-3.5 text-[#194611]" />
                                Assigned Mentees ({mentees.length})
                            </h4>
                            <span className="text-[11px] text-gray-500">
                                Clinical trainees receiving direct preceptorship
                            </span>
                        </div>

                        {/* Horizontal list of mentees */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {mentees.map((mentee) => (
                                <div
                                    key={mentee.id}
                                    className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-3.5 shadow-2xs hover:border-[#194611]/40 hover:shadow-xs transition"
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar person={mentee} className="size-10 text-xs shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-sm text-gray-900 truncate">
                                                {mentee.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                                {mentee.subtitle || "Resident Midwife"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                        <span className="flex items-center gap-1 truncate text-gray-600">
                                            <Building2 className="size-3 text-gray-400 shrink-0" />
                                            <span className="truncate">
                                                {mentee.facility || assignment.facility}
                                            </span>
                                        </span>
                                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0">
                                            In Training
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Optional Notes Section */}
                {notes && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 border border-gray-100">
                        <FileText className="size-4 shrink-0 text-gray-400 mt-0.5" />
                        <div>
                            <span className="font-medium text-gray-800">Special Instructions:</span>{" "}
                            {notes}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 px-5 py-2.5 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1.5 text-gray-500">
                    ID: <code className="font-mono text-gray-700">{assignment.id}</code>
                </span>

                <div className="flex items-center gap-2">
                    {isNew && onRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(assignment.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                            title="Remove this newly created assignment"
                        >
                            <Trash2 className="size-3.5" />
                            Remove
                        </button>
                    )}
                    <Link
                        href={`/assignments/${assignment.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition shadow-2xs"
                    >
                        <span>View Details</span>
                        <ExternalLink className="size-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
