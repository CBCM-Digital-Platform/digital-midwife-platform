export type ChapterStatus = "COMPLETED" | "ACTIVE" | "NEXT" | "LOCKED";
export type ModuleStatus = "PASSED" | "IN_PROGRESS" | "AVAILABLE" | "LOCKED";
export type LessonStatus = "COMPLETED" | "CURRENT" | "PENDING";

export interface Lesson {
    id: string;
    title: string; // without the "Lesson N:" prefix
    status: LessonStatus;
    detail?: string; // e.g. "Study Guide • Video Lecture"
    progressPct?: number; // current lesson
    minutesLeft?: number; // current lesson
    note?: string; // e.g. "Pending • 80% passing req"
}

export interface CurriculumModule {
    id: string;
    number: number;
    title: string; // without the "Module N:" prefix
    kind?: string; // e.g. "Clinical Skill Assessment"
    status: ModuleStatus;
    lessonsDone: number;
    lessonsTotal: number;
    lockedNote?: string; // e.g. "Prerequisite: Module 7"
    lessons?: Lesson[]; // listed when the module is open
}

export interface Chapter {
    id: string;
    number: number;
    title: string;
    status: ChapterStatus;
    modules: CurriculumModule[];
}

export interface CurriculumSummary {
    lessonsDone: number;
    lessonsTotal: number;
    progressPct: number;
    chaptersDone: number;
    chaptersActive: number;
    chaptersTotal: number;
    modulesPassed: number;
    modulesTotal: number;
}

export interface ResumeTarget {
    chapterNumber: number;
    chapterTitle: string;
    chaptersTotal: number;
    moduleNumber: number;
    lessonNumber: number;
    lessonTitle: string;
    progressPct: number;
    minutesLeft: number;
    verificationPending: boolean;
}

export interface AssignedMentor {
    name: string;
    credentials: string;
    role: string;
    openSlots: number;
    active: boolean;
}

export interface Handbook {
    title: string;
    details: string;
    offlineCached: boolean;
}

export interface MenteeDashboardData {
    chapters: Chapter[];
    summary: CurriculumSummary;
    resume: ResumeTarget | null;
    modulePassRate: number; // % of attempted modules passed
    cpdHours: number;
    cpdTarget: number;
    mentor: AssignedMentor;
    handbook: Handbook;
}