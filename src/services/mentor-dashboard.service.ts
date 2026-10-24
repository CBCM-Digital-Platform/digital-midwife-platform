import type { MentorDashboardData } from "@/types/mentor-dashboard";

const MOCK_DASHBOARD: MentorDashboardData = {
    stats: {
        totalMentees: 6,
        menteesTrend: "+3 this month",
        upcomingSessions: 3,
        pendingAssessments: 8,
        avgCompetencyPct: 86,
        competencyTrend: "+2%",
    },
    activity: [
        {
            id: "a1",
            kind: "LOGBOOK",
            actor: "Jane Doe",
            text: "submitted a new logbook entry for Normal Delivery.",
            timeAgo: "2h ago",
            actionLabel: "Review Entry",
            href: "/mentees",
        },
        {
            id: "a2",
            kind: "MESSAGE",
            actor: "Mark Smith",
            text: "sent a message regarding the Neonatal Resuscitation module.",
            timeAgo: "4h ago",
            quote: "Dr. Wilson, could we briefly go over the second step during our session today?",
            actionLabel: "Reply",
            href: "/messaging",
        },
        {
            id: "a3",
            kind: "MISSED_ASSESSMENT",
            actor: "Sarah Jenkins",
            text: "missed her scheduled assessment.",
            timeAgo: "Yesterday",
            actionLabel: "Follow Up",
            href: "/mentees",
        },
    ],
    scheduleDate: "2026-10-24",
    schedule: [
        {
            id: "s1",
            time: "09:00 AM",
            title: "Clinical Review",
            person: "Jane Doe",
            status: "DONE",
        },
        {
            id: "s2",
            time: "11:30 AM",
            title: "Module Q&A",
            person: "Mark Smith",
            joinUrl: "#",
            status: "NOW",
        },
        {
            id: "s3",
            time: "02:00 PM",
            title: "Initial Assessment",
            person: "New Mentee Group",
            location: "Room 4B",
            status: "UPCOMING",
        },
    ],
};

// TODO: replace with a fetch to the backend mentor dashboard endpoints
export async function getMentorDashboard(): Promise<MentorDashboardData> {
    return MOCK_DASHBOARD;
}