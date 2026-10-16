import type { ReportsData } from "@/types/report";

const MOCK_REPORTS: ReportsData = {
    refreshedAt: "Today, 08:30 AM",
    windowStart: "2024-01-01",
    windowEnd: "2024-06-30",
    kpis: {
        totalMentors: 128,
        mentorsChangePct: 12,
        totalMentees: 486,
        menteesChangePct: 24,
        activeAssignments: 412,
        pairingCapacityPct: 84.7,
        avgKnowledgeScore: 88.4,
        scoreDeltaPts: 6.2,
        completedCycles: 18,
        onScheduleCompletionPct: 96.2,
    },
    monthly: [
        { month: "January", code: "M01", mentors: 94, mentees: 310, assignments: 85, assessments: 142, avgScore: 81.2 },
        { month: "February", code: "M02", mentors: 106, mentees: 360, assignments: 98, assessments: 210, avgScore: 83.5 },
        { month: "March", code: "M03", mentors: 115, mentees: 410, assignments: 112, assessments: 285, avgScore: 85.1 },
        { month: "April", code: "M04", mentors: 120, mentees: 440, assignments: 118, assessments: 340, avgScore: 86.8 },
        { month: "May", code: "M05", mentors: 124, mentees: 468, assignments: 121, assessments: 395, avgScore: 87.5 },
        { month: "June", code: "M06", mentors: 128, mentees: 486, assignments: 128, assessments: 442, avgScore: 88.4, peak: true },
    ],
    domains: [
        { domain: "Maternal & Neonatal", mentees: 168, sessions: 412, avgScore: 90.1 },
        { domain: "Pediatric Emergency ICU", mentees: 124, sessions: 296, avgScore: 86.7 },
        { domain: "Infection Prevention", mentees: 112, sessions: 258, avgScore: 91.3 },
        { domain: "Oncology & Palliative", mentees: 82, sessions: 174, avgScore: 83.9 },
    ],
    thematicAreas: [
        "Maternal & Neonatal",
        "Pediatric Emergency ICU",
        "Infection Prevention",
        "Oncology & Palliative",
    ],
    cohorts: [
        { id: "CH-2024-089", facility: "Kigali Central Teaching Hospital", domain: "Maternal & Neonatal", leadMentor: "Dr. Beatrice Uwase", mentees: 6, sessions: 24, preScore: 74.2, postScore: 91.0, status: "COMPLETED" },
        { id: "CH-2024-092", facility: "Butare University Teaching Hospital", domain: "Pediatric Emergency ICU", leadMentor: "Dr. Jean-Paul Mugabo", mentees: 5, sessions: 18, preScore: 68.5, postScore: 84.2, status: "IN_PROGRESS" },
        { id: "CH-2024-098", facility: "Ruhengeri Referral Facility", domain: "Infection Prevention", leadMentor: "Sister Agnes Mukamana", mentees: 8, sessions: 32, preScore: 80.0, postScore: 94.5, status: "COMPLETED" },
        { id: "CH-2024-104", facility: "Rwinkwavu District Hospital", domain: "Oncology & Palliative", leadMentor: "Dr. Eric Nzeyimana", mentees: 4, sessions: 12, preScore: 71.0, postScore: 82.4, status: "IN_PROGRESS" },
        { id: "CH-2024-110", facility: "Gisenyi District Hospital", domain: "Maternal & Neonatal", leadMentor: "Dr. Claudine Ingabire", mentees: 6, sessions: 28, preScore: 75.8, postScore: 89.3, status: "COMPLETED" },
        { id: "CH-2024-115", facility: "Kibagabaga Hospital Node", domain: "Pediatric Emergency ICU", leadMentor: "Dr. Patrick Habimana", mentees: 4, sessions: 8, preScore: 69.0, postScore: null, status: "SCHEDULED" },
    ],
};

// TODO: replace with a fetch to the backend reports endpoints
export async function getReportsData(): Promise<ReportsData> {
    return MOCK_REPORTS;
}