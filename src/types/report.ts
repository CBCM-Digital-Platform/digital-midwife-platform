export type ReportPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY";
export type CohortStatus = "COMPLETED" | "IN_PROGRESS" | "SCHEDULED";

export interface ReportKpis {
    totalMentors: number;
    mentorsChangePct: number; // vs previous cycle
    totalMentees: number;
    menteesChangePct: number; // new enrollments
    activeAssignments: number;
    pairingCapacityPct: number;
    avgKnowledgeScore: number;
    scoreDeltaPts: number; // pre vs post cohort delta
    completedCycles: number;
    onScheduleCompletionPct: number;
}

export interface MonthlyTrend {
    month: string;
    code: string; // e.g. "M01"
    mentors: number;
    mentees: number;
    assignments: number;
    assessments: number;
    avgScore: number;
    peak?: boolean;
}

export interface DomainBreakdown {
    domain: string;
    mentees: number;
    sessions: number;
    avgScore: number;
}

export interface CohortRecord {
    id: string;
    facility: string;
    domain: string;
    leadMentor: string;
    mentees: number;
    sessions: number;
    preScore: number | null;
    postScore: number | null;
    status: CohortStatus;
}

export interface ReportsData {
    refreshedAt: string;
    windowStart: string; // ISO date
    windowEnd: string;
    kpis: ReportKpis;
    monthly: MonthlyTrend[];
    domains: DomainBreakdown[];
    thematicAreas: string[];
    cohorts: CohortRecord[];
}