export type CompetencyLevel = "NOVICE" | "QUALIFIED" | "ADVANCED";

export interface MyMentee {
    id: string;
    code: string; // display ID, e.g. "M-8492"
    name: string;
    title: string; // e.g. "Year 2 Resident"
    facility: string;
    level: CompetencyLevel;
    active: boolean;
    lastSession: string; // ISO date
    overdue: boolean;
    avatarUrl: string | null;
    assignedAssessment?: import("./mentor-assessment").MentorAssessment | null;
}