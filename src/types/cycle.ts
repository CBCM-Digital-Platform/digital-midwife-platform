export type CycleStatus = "ACTIVE" | "PLANNING" | "COMPLETED";

export interface CycleMilestone {
    id: string;
    title: string;
    when: string;
    done: boolean;
}

export interface Cycle {
    id: string;
    name: string;
    status: CycleStatus;
    startDate: string; // ISO date, e.g. "2024-01-15"
    endDate: string;
    facilities: number;
    mentors: number;
    mentees: number;
    progress: number; // 0-100 (progress for active, readiness for planning)
    assignmentsLinked: number;
    averageScore: number; // 0-100
    milestones: CycleMilestone[];
}