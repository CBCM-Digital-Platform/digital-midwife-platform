export type CompetencyLevel = "NOVICE" | "QUALIFIED" | "ADVANCED";

export interface MyMentee {
    id: string;
    code: string; // display ID, e.g. "M-8492"
    name: string;
    facility: string;
    level: CompetencyLevel;
    lastSession: string; // ISO date
    overdue: boolean;
    avatarUrl: string | null;
}