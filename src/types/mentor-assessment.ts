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
    file_id: number;
    fileId?: number;
    url?: string;
    created_at?: string;
}

export interface CertificateEligibility {
    eligible: boolean;
    reason?: string | null;
    assessment?: any;
    existingCertificate?: any;
}

export interface PreparedAssessmentTemplate {
    id: string;
    title: string;
    thematicArea: string;
    thematicAreaId: number;
    description: string;
    clinicalScope: string;
    instructions: string;
    referenceLink?: string;
    checklistItems: string[];
    criteria: string[];
    passingTheoryThreshold: number; // e.g. 80
    passingPracticalThreshold: number; // e.g. 3 or 4
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
    aggregateScore?: number | null;
    theoryScore?: number | null;
    theoryPassed?: boolean;
    practicalScore?: number | null; // 1-5 scale
    practicalFeedback?: string;
    assessmentDate?: string;
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
    type: string;
    dueDate: string; // ISO date
    instructions: string;
    referenceLink?: string;
    feedback?: string;
    notifyMentee?: boolean;
    attachmentNames?: string[];
    facilityId?: number | string;
    cycleId?: number | string;
    thematicAreaId?: number | string;
    checklistItems?: string[];
    criteria?: string[];
}
