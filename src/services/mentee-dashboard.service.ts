import type {
    Chapter,
    CurriculumSummary,
    MenteeDashboardData,
    ResumeTarget,
} from "@/types/mentee-dashboard";

const CHAPTERS: Chapter[] = [
    {
        id: "c1",
        number: 1,
        title: "Maternal Physiology & Antenatal Baseline",
        status: "COMPLETED",
        modules: [
            { id: "m1", number: 1, title: "Systemic Maternal Adaptations in Adolescents", status: "PASSED", lessonsDone: 4, lessonsTotal: 4 },
            { id: "m2", number: 2, title: "Antenatal Screening & Fetal Biophysical Profile", status: "PASSED", lessonsDone: 5, lessonsTotal: 5 },
            { id: "m3", number: 3, title: "Nutrition & Micronutrient Protocols", status: "PASSED", lessonsDone: 4, lessonsTotal: 4 },
        ],
    },
    {
        id: "c2",
        number: 2,
        title: "Intrapartum Care & Clinical Obstetric Skills",
        status: "ACTIVE",
        modules: [
            {
                id: "m4",
                number: 4,
                title: "Fundal Height Assessment & Palpation",
                kind: "Clinical Skill Assessment",
                status: "IN_PROGRESS",
                lessonsDone: 2,
                lessonsTotal: 4,
                lessons: [
                    { id: "l1", title: "Symphysis Fundal Height Principles & Landmarks", status: "COMPLETED" },
                    {
                        id: "l2",
                        title: "Fundal Height & Palpation Assessment",
                        status: "CURRENT",
                        detail: "Study Guide • Video Lecture",
                        progressPct: 75,
                        minutesLeft: 25,
                    },
                    { id: "l3", title: "Leopold's 4 Maneuvers Clinical Protocol", status: "COMPLETED" },
                    { id: "l4", title: "Clinical Verification Quiz", status: "PENDING", note: "Pending • 80% passing req" },
                ],
            },
            { id: "m5", number: 5, title: "Fetal Heart Rate Monitoring & CTG Interpretation", status: "IN_PROGRESS", lessonsDone: 2, lessonsTotal: 4 },
            { id: "m6", number: 6, title: "Partograph & Labor Progression Management", status: "IN_PROGRESS", lessonsDone: 1, lessonsTotal: 3 },
        ],
    },
    {
        id: "c3",
        number: 3,
        title: "Postpartum Complications & Emergency Response",
        status: "NEXT",
        modules: [
            { id: "m7", number: 7, title: "Postpartum Hemorrhage (PPH) Protocols & Uterotonics", status: "AVAILABLE", lessonsDone: 1, lessonsTotal: 4 },
            { id: "m8", number: 8, title: "Neonatal Resuscitation & The Golden Minute", status: "LOCKED", lessonsDone: 0, lessonsTotal: 5, lockedNote: "Prerequisite: Module 7" },
            { id: "m9", number: 9, title: "Severe Pre-eclampsia & MgSO4 Administration", status: "LOCKED", lessonsDone: 0, lessonsTotal: 5 },
        ],
    },
    {
        id: "c4",
        number: 4,
        title: "Special Populations & Adolescent Obstetric Care",
        status: "LOCKED",
        modules: [
            { id: "m10", number: 10, title: "Adolescent Antenatal Counselling", status: "LOCKED", lessonsDone: 0, lessonsTotal: 5 },
            { id: "m11", number: 11, title: "Mental Health & Psychosocial Support", status: "LOCKED", lessonsDone: 0, lessonsTotal: 5 },
            { id: "m12", number: 12, title: "Family Planning in the Postnatal Period", status: "LOCKED", lessonsDone: 0, lessonsTotal: 4 },
        ],
    },
];

// Everything below is calculated from the chapters, so the numbers always agree with each other
function summarize(chapters: Chapter[]): CurriculumSummary {
    const modules = chapters.flatMap((c) => c.modules);
    const lessonsDone = modules.reduce((n, m) => n + m.lessonsDone, 0);
    const lessonsTotal = modules.reduce((n, m) => n + m.lessonsTotal, 0);

    return {
        lessonsDone,
        lessonsTotal,
        progressPct: lessonsTotal > 0 ? Math.round((lessonsDone / lessonsTotal) * 100) : 0,
        chaptersDone: chapters.filter((c) => c.status === "COMPLETED").length,
        chaptersActive: chapters.filter((c) => c.status === "ACTIVE").length,
        chaptersTotal: chapters.length,
        modulesPassed: modules.filter((m) => m.status === "PASSED").length,
        modulesTotal: modules.length,
    };
}

function findResume(chapters: Chapter[]): ResumeTarget | null {
    const chapter = chapters.find((c) => c.status === "ACTIVE");
    const mod = chapter?.modules.find((m) => m.status === "IN_PROGRESS" && m.lessons);
    const lessons = mod?.lessons;
    const index = lessons ? lessons.findIndex((l) => l.status === "CURRENT") : -1;
    if (!chapter || !mod || !lessons || index < 0) return null;

    const lesson = lessons[index];
    return {
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        chaptersTotal: chapters.length,
        moduleNumber: mod.number,
        lessonNumber: index + 1,
        lessonTitle: lesson.title,
        progressPct: lesson.progressPct ?? 0,
        minutesLeft: lesson.minutesLeft ?? 0,
        verificationPending: lessons.some((l) => l.status === "PENDING"),
    };
}

// TODO: replace with a fetch to the backend (the mentee's curriculum, progress, mentor and CPD credits)
export async function getMenteeDashboard(): Promise<MenteeDashboardData> {
    return {
        chapters: CHAPTERS,
        summary: summarize(CHAPTERS),
        resume: findResume(CHAPTERS),
        modulePassRate: 100,
        cpdHours: 28.5,
        cpdTarget: 40,
        mentor: {
            name: "Dr. Sarah Jenkins",
            credentials: "CNM",
            role: "Lead Midwifery Preceptor",
            openSlots: 3,
            active: true,
        },
        handbook: {
            title: "Maternal-Fetal Clinical & Physical Assessment (PDF)",
            details: "36 Pages • 4.2 MB • WHO/ICM compliant",
            offlineCached: true,
        },
    };
}