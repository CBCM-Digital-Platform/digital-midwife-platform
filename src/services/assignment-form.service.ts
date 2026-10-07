import type { AssignmentFormOptions, NewAssignmentInput } from "@/types/assignment-form";

/**
 * Mock data only. When the backend is ready, replace these function bodies
 * with real API calls. The page and components stay the same.
 */

const MOCK_OPTIONS: AssignmentFormOptions = {
    cycles: [
        { id: "c-1", name: "Cohort 2024-B", startDate: "2024-11-01", endDate: "2025-04-30" },
        { id: "c-2", name: "Cohort 2025-A", startDate: "2025-01-15", endDate: "2025-06-30" },
    ],
    thematicAreas: [
        "Pediatrics",
        "Surgery",
        "Community Health",
        "Cardiology",
        "Neurology",
        "Emergency Medicine",
        "Internal Medicine",
    ],
    mentors: [
        { id: "m-1", name: "Dr. Elena Rostova", initials: "ER", specialty: "Pediatrics", currentLoad: 3, maxLoad: 3 },
        { id: "m-4", name: "Dr. Sarah Jenkins", initials: "SJ", specialty: "Pediatrics", currentLoad: 1, maxLoad: 3 },
        { id: "m-5", name: "Dr. Robert Chen", initials: "RC", specialty: "Neurology", currentLoad: 1, maxLoad: 3 },
        { id: "m-2", name: "Marcus Vance, RN", initials: "MV", specialty: "Oncology", currentLoad: 0, maxLoad: 3 },
        { id: "m-3", name: "Dr. Arthur Pendelton", initials: "AP", specialty: "Cardiology", currentLoad: 2, maxLoad: 3 },
        { id: "m-6", name: "Anita Patel, MD", initials: "AP", specialty: "Internal Medicine", currentLoad: 1, maxLoad: 3 },
    ],
    mentees: [
        { id: "u-1", name: "Amina K.", initials: "AK", specialty: "Surgery", facility: "St. Jude Regional Center" },
        { id: "u-2", name: "Selam Tadesse", initials: "ST", specialty: "Pediatrics", facility: "Metro Health West" },
        { id: "u-3", name: "Dawit Mekonnen", initials: "DM", specialty: "Community Health", facility: "Children's Specialty Clinic" },
        { id: "u-4", name: "Liya Alemu", initials: "LA", specialty: "Pediatrics", facility: "St. Jude Regional Center" },
        { id: "u-5", name: "Samson Girma", initials: "SG", specialty: "Surgery", facility: "Metro Health West" },
    ],
};

export async function getAssignmentFormOptions(): Promise<AssignmentFormOptions> {
    return MOCK_OPTIONS;
}

/** Mock create: waits briefly and returns an id. Nothing is saved yet. */
export async function createAssignment(input: NewAssignmentInput): Promise<{ id: string }> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    console.log("createAssignment (mock):", input);
    return { id: `a-${Date.now()}` };
}