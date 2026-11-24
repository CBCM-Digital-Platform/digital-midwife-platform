"use client";

import { Users, UserCheck, GraduationCap, Clock, Sparkles } from "lucide-react";
import type { AssignmentStats } from "@/types/assignment";

interface AssignmentStatsCardsProps {
    stats: AssignmentStats;
    totalAssignments?: number;
    activeAssignments?: number;
    assignedMentorsCount?: number;
    assignedMenteesCount?: number;
    newAssignmentsCount?: number;
}

export default function AssignmentStatsCards({
    stats,
    totalAssignments = 0,
    activeAssignments = 0,
    assignedMentorsCount = 0,
    assignedMenteesCount = 0,
    newAssignmentsCount = 0,
}: AssignmentStatsCardsProps) {
    const cards = [
        {
            title: "Active Pairings",
            value: activeAssignments || totalAssignments,
            subtitle: newAssignmentsCount > 0 ? `${newAssignmentsCount} new this week` : "Clinical mentorship pairings",
            icon: Users,
            iconBg: "bg-[#194611]/10 text-[#194611]",
            badge: activeAssignments > 0 ? `${activeAssignments} active` : undefined,
            badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        {
            title: "Assigned Mentors",
            value: assignedMentorsCount || stats.availableMentors.balanced || stats.availableMentors.readyToIntake,
            subtitle: `${stats.availableMentors.readyToIntake} ready for intake`,
            icon: UserCheck,
            iconBg: "bg-emerald-50 text-emerald-800",
            badge: stats.availableMentors.readyToIntake > 0 ? "Capacity available" : undefined,
            badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        {
            title: "Mentees Supervised",
            value: assignedMenteesCount || stats.unassignedMentees.total,
            subtitle: "Midwives in bedside clinical training",
            icon: GraduationCap,
            iconBg: "bg-teal-50 text-teal-800",
            badge: "In training",
            badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
        },
        {
            title: "Awaiting Placement",
            value: stats.unassignedMentees.total,
            subtitle:
                stats.unassignedMentees.urgent > 0
                    ? `${stats.unassignedMentees.urgent} high priority queue`
                    : "Midwives awaiting mentor matching",
            icon: Clock,
            iconBg: "bg-amber-50 text-amber-800",
            badge: stats.unassignedMentees.urgent > 0 ? "Action required" : "In queue",
            badgeColor:
                stats.unassignedMentees.urgent > 0
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-gray-100 text-gray-700 border-gray-200",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.title}
                        className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-2xs transition hover:border-gray-300 hover:shadow-xs"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {card.title}
                                </p>
                                <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 lg:text-3xl">
                                    {card.value}
                                </p>
                            </div>
                            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
                                <Icon className="size-5" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs">
                            <span className="text-gray-500 truncate">{card.subtitle}</span>
                            {card.badge && (
                                <span
                                    className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${card.badgeColor}`}
                                >
                                    {card.badge}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
