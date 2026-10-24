export type ActivityKind = "LOGBOOK" | "MESSAGE" | "MISSED_ASSESSMENT";
export type ScheduleStatus = "DONE" | "NOW" | "UPCOMING";

export interface MentorStats {
    totalMentees: number;
    menteesTrend: string | null;
    upcomingSessions: number;
    pendingAssessments: number;
    avgCompetencyPct: number;
    competencyTrend: string | null;
}

export interface ActivityItem {
    id: string;
    kind: ActivityKind;
    actor: string;
    text: string; // the sentence after the actor's name
    timeAgo: string;
    quote?: string;
    actionLabel: string;
    href: string;
}

export interface ScheduleItem {
    id: string;
    time: string; // "09:00 AM"
    title: string;
    person: string;
    location?: string;
    joinUrl?: string;
    status: ScheduleStatus;
}

export interface MentorDashboardData {
    stats: MentorStats;
    activity: ActivityItem[];
    scheduleDate: string; // ISO date
    schedule: ScheduleItem[];
}