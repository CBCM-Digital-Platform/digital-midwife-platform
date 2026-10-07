/** Most mentees that can be added in a single assignment (and a mentor's max load). */
export const MAX_MENTEES_PER_ASSIGNMENT = 3;

export type AssignmentType = "individual" | "team";

export interface MentorOption {
    id: string;
    name: string;
    initials: string;
    specialty: string;
    currentLoad: number;
    maxLoad: number;
    avatarUrl?: string;
}

export interface MenteeOption {
    id: string;
    name: string;
    initials: string;
    specialty: string;
    facility: string;
}

export interface CycleOption {
    id: string;
    name: string;
    /** ISO date, e.g. "2024-11-01" */
    startDate: string;
    endDate: string;
}

export interface AssignmentFormOptions {
    cycles: CycleOption[];
    thematicAreas: string[];
    mentors: MentorOption[];
    mentees: MenteeOption[];
}

export interface NewAssignmentInput {
    type: AssignmentType;
    cycleId: string;
    thematicAreas: string[];
    mentorIds: string[];
    menteeIds: string[];
    startDate: string;
    endDate: string;
    notes: string;
    /** Required when a selected mentor would go over their maximum load */
    capacityOverrideReason?: string;
}