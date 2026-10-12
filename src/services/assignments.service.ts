import type { Assignment, AssignmentStats } from "@/types/assignment";

/**
 * Mock data lives here only. When the backend is ready, replace the bodies of
 * these functions with real calls (e.g. via the shared API client). Pages and
 * components should not need to change.
 */

const MOCK_ASSIGNMENTS: Assignment[] = [
    {
        id: "a-1",
        mentor: { id: "m-1", code: "MTR-904", name: "Dr. Elena Rostova", subtitle: "Chief Attending", initials: "ER" },
        mentee: { id: "e-1", name: "Dr. Kevin Morales", subtitle: "Resident PGY-2 • Ped. Surg", initials: "KM" },
        facility: "St. Jude Regional Center",
        thematicDomain: "Clinical Pediatrics",
        assignedDate: "2024-10-12",
        dateNote: "1.2 months tenure",
        status: "active",
    },
    {
        id: "a-2",
        mentor: { id: "m-2", code: "MTR-412", name: "Marcus Vance, RN", subtitle: "Trauma Coordinator", initials: "MV" },
        mentee: { id: "e-2", name: "Maya Lin", subtitle: "Fellow Year 1 • ER Care", initials: "ML" },
        facility: "Metro Health West",
        thematicDomain: "Emergency Medicine",
        assignedDate: "2024-11-01",
        dateNote: "3 weeks tenure",
        status: "active",
    },
    {
        id: "a-3",
        mentor: { id: "m-3", code: "MTR-108", name: "Dr. Arthur Pendelton", subtitle: "Department Head", initials: "AP" },
        mentee: { id: "e-3", name: "Samuel O'Connor", subtitle: "Resident PGY-1 • Cardio", initials: "SO" },
        facility: "St. Jude Regional Center",
        thematicDomain: "Cardiology",
        assignedDate: "2024-11-15",
        dateNote: "Starts in 3 days",
        status: "pending",
    },
    {
        id: "a-4",
        mentor: { id: "m-4", code: "MTR-772", name: "Sarah Jenkins, NP", subtitle: "Lead Specialist", initials: "SJ" },
        mentee: { id: "e-4", name: "Tasha Washington", subtitle: "Resident PGY-1 • Neo-Care", initials: "TW" },
        facility: "Children's Specialty Clinic",
        thematicDomain: "Pediatric Care",
        assignedDate: "2024-09-28",
        dateNote: "1.8 months tenure",
        status: "active",
    },
    {
        id: "a-5",
        mentor: { id: "m-5", code: "MTR-301", name: "Dr. Robert Chen", subtitle: "Neuro Fellow Dir.", initials: "RC" },
        mentee: { id: "e-5", name: "Liam Davies", subtitle: "Resident PGY-2 • Neuro", initials: "LD" },
        facility: "St. Jude Regional Center",
        thematicDomain: "Neurology",
        assignedDate: "2024-10-04",
        dateNote: "1.5 months tenure",
        status: "active",
    },
    {
        id: "a-6",
        mentor: { id: "m-6", code: "MTR-519", name: "Anita Patel, MD", subtitle: "Consultant", initials: "AP" },
        mentee: { id: "e-6", name: "David Brooks", subtitle: "Resident PGY-1 • Med Intern", initials: "DB" },
        facility: "Metro Health West",
        thematicDomain: "Internal Medicine",
        assignedDate: "2024-11-10",
        dateNote: "Starts in 9 days",
        status: "pending",
    },
];

const MOCK_STATS: AssignmentStats = {
    availableMentors: {
        readyToIntake: 14,
        vacant: 6,
        balanced: 8,
        atLimit: 0,
        leads: [
            { id: "m-4", name: "Dr. Sarah Jenkins", initials: "SJ", specialty: "Pediatrics", load: "1/3" },
            { id: "m-2", name: "Marcus Vance, RN", initials: "MV", specialty: "Oncology", load: "0/3" },
            { id: "m-5", name: "Dr. Robert Chen", initials: "RC", specialty: "Neurology", load: "1/3" },
        ],
    },
    unassignedMentees: {
        total: 9,
        urgent: 3,
        waitingOver14Days: 3,
        bySpecialty: [
            { label: "Pediatrics", count: 4 },
            { label: "Surgery", count: 3 },
            { label: "Community Health", count: 2 },
        ],
        nextInQueue: { name: "Amina K.", specialty: "Surgery" },
    },
};

export async function getAssignments(): Promise<Assignment[]> {
    return MOCK_ASSIGNMENTS;
}

export async function getAssignmentStats(): Promise<AssignmentStats> {
    return MOCK_STATS;
}