export type AssessmentStatus =
    | "PASS"
    | "PENDING"
    | "NEEDS_REVIEW"
    | "DRAFT"
    | "IN_REVIEW"
    | "FINALIZED"
    | "REVIEWED";

export interface AssessmentCriterionScore {
    id?: number;
    criterion: string;
    score: number;
}

export interface AssessmentChecklistItem {
    id?: number;
    item: string;
    checked: boolean;
}

export interface AssessmentEvidence {
    id?: number;
    title: string;
    file_id?: number;
    fileId?: number;
    url?: string;
    created_at?: string;
}

export interface AssessmentPassingRule {
    id: number;
    cycle_id: number | null;
    thematic_area_id: number | null;
    criteria_min_score: number;
    theory_min_score: number;
    practical_min_score: number;
    is_active: boolean;
}

export interface AssessmentTypeOption {
    id: string;
    name: string;
}

export interface MentorAssessment {
    id: string;
    menteeId: string;
    menteeName: string;
    menteeTitle: string; // e.g. "Year 2 Resident"
    date: string; // ISO date
    type: string;
    status: AssessmentStatus;
    scorePct: number | null;
    theoryScore?: number | null;
    practicalScore?: number | null;
    dueDate?: string;
    instructions?: string;
    referenceLink?: string;
    feedback?: string;
    attachmentNames?: string[];
    createdAt?: string;
    assignedBy?: string;
    mentorId?: string | number;
    facilityId?: number | string;
    facilityName?: string;
    cycleId?: number | string;
    thematicAreaId?: number | string;
    thematicAreaName?: string;
    criteriaScores?: AssessmentCriterionScore[];
    checklistItems?: AssessmentChecklistItem[];
    evidence?: AssessmentEvidence[];
    prerequisitesMet?: boolean;
}

export interface NewAssessmentInput {
    menteeId: string;
    thematicAreaId: string;
    thematicAreaName: string;
    feedback?: string;
    facilityId?: number | string;
    cycleId?: number | string;
    prerequisitesMet?: boolean;
}