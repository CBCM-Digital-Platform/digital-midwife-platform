export type AssessmentFrequency = "WEEKLY" | "BI_WEEKLY" | "MONTHLY";

export interface Facility {
    id: string;
    name: string;
}

export interface CreateCycleInput {
    name: string;
    code: string;
    description?: string;
    startDate: string; // ISO date
    endDate: string;
    facilityIds: string[];
    thematicAreas: string[];
    targetMentors: number;
    targetMentees: number;
    maxMenteesPerMentor: number;
    maxFacilitiesPerMentor: number;
    assessmentFrequency: AssessmentFrequency;
    notes?: string;
}