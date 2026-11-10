export type SessionMode = "in_person" | "virtual" | "hybrid";

export type SessionStatus =
    | "draft"
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "terminated"
    | "no_show";

export interface ClinicalSession {
    id: string;
    assignmentId?: number;
    mentorId?: number;
    mentorName?: string;
    menteeId?: number;
    menteeName: string;
    menteeTitle?: string;
    mode: SessionMode;
    scheduledAt: string; // ISO date
    durationMinutes: number;
    clinicalSetting?: string;
    sessionGoals?: string;
    preparationNotes?: string;
    status: SessionStatus;
    createdAt?: string;
    notes?: ClinicalSessionNote[];
}

export interface ClinicalSessionNote {
    id: string | number;
    encounterId: string | number;
    mentorId?: number;
    mentorName?: string;
    note: string;
    createdAt: string;
}

export interface SessionJoinToken {
    domain?: string;
    room?: string;
    token?: string;
    joinUrl?: string;
}

export interface CreateSessionInput {
    assignmentId: number;
    mode: SessionMode;
    scheduledAt: string; // ISO string
    durationMinutes: number;
    clinicalSetting?: string;
    sessionGoals?: string;
    preparationNotes?: string;
    status?: "draft" | "scheduled";
}
