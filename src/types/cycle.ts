export type CycleStatus = "ACTIVE" | "PLANNING" | "COMPLETED" | "DRAFT" | "CANCELLED";

export interface CycleMilestone {
    id: string;
    title: string;
    when: string;
    done: boolean;
}

export interface CycleFacility {
    id: number;
    name: string;
    type?: string;
    region?: string;
}

export interface CycleThematicArea {
    id: number;
    code: string;
    name: string;
}

export interface CycleMentor {
    id: string | number;
    name: string;
    email?: string;
    phone?: string;
    profession?: string;
    facility?: string;
    assignedMenteesCount?: number;
    status?: string;
}

export interface CycleMentee {
    id: string | number;
    name: string;
    email?: string;
    phone?: string;
    cadreLevel?: string;
    facility?: string;
    mentorName?: string;
    status?: string;
}

export interface Cycle {
    id: string;
    name: string;
    code?: string;
    description?: string;
    status: CycleStatus;
    startDate: string; // ISO date, e.g. "2024-01-15"
    endDate: string;
    durationWeeks?: number;
    facilities: number;
    mentors: number;
    mentees: number;
    targetMentors?: number;
    targetMentees?: number;
    maxMenteesPerMentor?: number;
    maxFacilitiesPerMentor?: number;
    assessmentFrequency?: "WEEKLY" | "BI_WEEKLY" | "MONTHLY" | string;
    notes?: string;
    progress: number; // 0-100 (progress for active, readiness for planning)
    assignmentsLinked: number;
    averageScore: number; // 0-100
    milestones: CycleMilestone[];
    rawStatus?: string;
    facilityList?: CycleFacility[];
    thematicAreaList?: CycleThematicArea[];
    mentorList?: CycleMentor[];
    menteeList?: CycleMentee[];
    createdAt?: string;
    updatedAt?: string;
}