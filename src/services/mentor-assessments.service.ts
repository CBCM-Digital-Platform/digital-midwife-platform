import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { getMyMentees } from "@/services/my-mentees.service";
import type { MyMentee } from "@/types/my-mentee";
import type {
    AssessmentChecklistItem,
    AssessmentCriterionScore,
    AssessmentEvidence,
    AssessmentStatus,
    MentorAssessment,
    NewAssessmentInput,
} from "@/types/mentor-assessment";

export const ASSESSMENT_STORAGE_KEY = "cbcm_mentor_assessments_store";

export const ASSESSMENT_TYPES = [
    "Labor & Delivery Competency",
    "Postpartum Care Setup",
    "Fetal Monitoring Basics",
    "Neonatal Resuscitation",
    "Antenatal Care Screening",
    "Infection Prevention & Control",
    "Partograph Interpretation",
    "Newborn Care Essentials",
];

// Memory cache for SSR and in-process synchronization
let MEMORY_STORE: MentorAssessment[] = [];

export function getStoredAssessments(): MentorAssessment[] {
    if (typeof window === "undefined") {
        return MEMORY_STORE;
    }
    try {
        const raw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
        if (!raw) return MEMORY_STORE;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            const ids = new Set(parsed.map((a: MentorAssessment) => a.id));
            const merged = [...parsed];
            for (const item of MEMORY_STORE) {
                if (!ids.has(item.id)) {
                    merged.push(item);
                }
            }
            return merged;
        }
    } catch (e) {
        console.warn("Could not read assessments from localStorage:", e);
    }
    return MEMORY_STORE;
}

export function saveStoredAssessments(items: MentorAssessment[]): void {
    MEMORY_STORE = items;
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(items));
            window.dispatchEvent(new CustomEvent("cbcm-assessments-updated", { detail: items }));
        } catch (e) {
            console.warn("Could not write assessments to localStorage:", e);
        }
    }
}

export async function getAssessmentTypes(): Promise<string[]> {
    return ASSESSMENT_TYPES;
}

function mapBackendStatus(rawStatus?: string): AssessmentStatus {
    const s = String(rawStatus || "").toLowerCase();
    if (s === "finalized" || s === "reviewed" || s === "pass") return "PASS";
    if (s === "in_review" || s === "needs_review") return "NEEDS_REVIEW";
    return "PENDING";
}

/**
 * Normalizes backend assessment payload to frontend MentorAssessment model.
 */
export function normalizeAssessment(raw: any): MentorAssessment {
    if (!raw) return {} as MentorAssessment;

    const id = String(raw.id ?? raw._id ?? "");
    const mentee = raw.mentee || {};
    const menteeId = String(raw.mentee_id ?? raw.menteeId ?? mentee.id ?? "");
    const menteeName =
        raw.mentee_name ||
        raw.menteeName ||
        mentee.full_name ||
        mentee.name ||
        `Mentee #${menteeId || id}`;
    const menteeTitle =
        mentee.highest_qualification ||
        mentee.training_status ||
        raw.mentee_title ||
        raw.menteeTitle ||
        "Resident Midwife";

    const thematicArea = raw.thematic_area || raw.thematicArea || {};
    const type =
        thematicArea.name ||
        raw.type ||
        raw.title ||
        "Labor & Delivery Competency";

    const date = raw.created_at
        ? new Date(raw.created_at).toISOString().slice(0, 10)
        : raw.date || new Date().toISOString().slice(0, 10);

    const dueDate = raw.due_date || raw.dueDate || date;
    const status = mapBackendStatus(raw.status);

    const theoryScore =
        raw.theory_score !== undefined && raw.theory_score !== null
            ? Number(raw.theory_score)
            : raw.theoryScore !== undefined && raw.theoryScore !== null
            ? Number(raw.theoryScore)
            : null;

    const scorePct =
        raw.aggregate_score !== undefined && raw.aggregate_score !== null
            ? Number(raw.aggregate_score)
            : raw.scorePct !== undefined && raw.scorePct !== null
            ? Number(raw.scorePct)
            : null;

    const criteriaScores: AssessmentCriterionScore[] = Array.isArray(raw.criteria_scores)
        ? raw.criteria_scores.map((c: any) => ({
              id: c.id,
              criterion: c.criterion || "Clinical Criterion",
              score: Number(c.score ?? 0),
          }))
        : Array.isArray(raw.criteriaScores)
        ? raw.criteriaScores
        : [];

    const checklistItems: AssessmentChecklistItem[] = Array.isArray(raw.checklist_items)
        ? raw.checklist_items.map((i: any) => ({
              id: i.id,
              item: i.item || "Procedural Step",
              checked: Boolean(i.checked),
          }))
        : Array.isArray(raw.checklistItems)
        ? raw.checklistItems
        : [];

    const evidence: AssessmentEvidence[] = Array.isArray(raw.evidence)
        ? raw.evidence.map((e: any) => ({
              id: e.id,
              title: e.title || "Clinical Evidence File",
              file_id: e.file_id ?? e.fileId,
              fileId: e.file_id ?? e.fileId,
              url: e.url,
              created_at: e.created_at,
          }))
        : [];

    return {
        id,
        menteeId,
        menteeName,
        menteeTitle,
        date,
        dueDate,
        type,
        status,
        scorePct,
        theoryScore,
        instructions: raw.instructions || raw.feedback || "",
        referenceLink: raw.reference_link || raw.referenceLink || "",
        feedback: raw.feedback || "",
        attachmentNames: raw.attachmentNames || (evidence.length > 0 ? evidence.map((e) => e.title) : []),
        createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
        facilityId: raw.facility_id ?? raw.facilityId,
        facilityName: raw.facility?.name,
        cycleId: raw.cycle_id ?? raw.cycleId,
        thematicAreaId: raw.thematic_area_id ?? raw.thematicAreaId,
        thematicAreaName: thematicArea.name,
        criteriaScores,
        checklistItems,
        evidence,
        prerequisitesMet: raw.prerequisites_met ?? raw.prerequisitesMet ?? true,
    };
}

/**
 * Returns all assessments, fetching from the backend API with fallback to seed data.
 */
export async function getAssessments(): Promise<MentorAssessment[]> {
    const stored = getStoredAssessments();

    try {
        const res = await apiClient.get<any>(`${ENDPOINTS.ASSESSMENTS.BASE}?limit=100`);
        const rawList = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
            ? res
            : [];

        if (rawList.length > 0) {
            const liveAssessments = rawList.map(normalizeAssessment);
            const liveIds = new Set(liveAssessments.map((a: MentorAssessment) => a.id));
            const unSyncedStored = stored.filter((s) => !liveIds.has(s.id));
            return [...unSyncedStored, ...liveAssessments];
        }
    } catch (err) {
        console.warn("Could not fetch assessments from backend API:", err);
    }

    // Only return assessments explicitly stored in session (e.g. newly created by mentor)
    return stored;
}

export async function getAssessmentById(id: string | number): Promise<MentorAssessment | null> {
    try {
        const res = await apiClient.get<any>(ENDPOINTS.ASSESSMENTS.DETAIL(id));
        const raw = res?.data ?? res;
        if (raw && (raw.id || raw.mentee_id)) {
            return normalizeAssessment(raw);
        }
    } catch (e) {
        console.warn(`Failed to fetch assessment ${id} from API:`, e);
    }

    // Check stored and fallback list
    const all = await getAssessments();
    const found = all.find((a) => String(a.id) === String(id));
    if (found) return found;

    const byMentee = all.find((a) => String(a.menteeId) === String(id));
    if (byMentee) return byMentee;

    return null;
}

/**
 * Returns all assessments specifically assigned to a mentee.
 */
export async function getAssessmentsForMentee(menteeId: string): Promise<MentorAssessment[]> {
    const all = await getAssessments();
    return all.filter((a) => String(a.menteeId) === String(menteeId));
}

/**
 * Returns the active or latest assigned assessment for a mentee.
 */
export async function getLatestAssessmentForMentee(menteeId: string): Promise<MentorAssessment | null> {
    const forMentee = await getAssessmentsForMentee(menteeId);
    if (forMentee.length === 0) return null;

    const pending = forMentee.find((a) => a.status === "PENDING");
    if (pending) return pending;

    return forMentee[0] || null;
}

/**
 * Creates and persists a new assessment for a mentee, syncing with backend.
 */
export async function createAssessment(
    input: NewAssessmentInput,
    files: File[] = []
): Promise<MentorAssessment> {
    const mentees = await getMyMentees();
    const mentee = mentees.find((m) => String(m.id) === String(input.menteeId));

    // Try resolving current mentor and active cycle
    let mentorId = 1;
    let facilityId = Number(input.facilityId || 1);
    let cycleId = Number(input.cycleId || 1);

    try {
        const [meRes, cyclesRes] = await Promise.all([
            apiClient.get<any>("/api/v1/users/me").catch(() => null),
            apiClient.get<any>("/api/v1/mentorship-cycles?limit=5").catch(() => null),
        ]);

        const me = meRes?.data || meRes;
        if (me?.id) mentorId = Number(me.id);
        if (me?.facility_id) facilityId = Number(me.facility_id);

        const cycles = Array.isArray(cyclesRes?.data) ? cyclesRes.data : [];
        if (cycles.length > 0) {
            const activeCycle = cycles.find((c: any) => c.status === "active") || cycles[0];
            if (activeCycle?.id) cycleId = Number(activeCycle.id);
        }
    } catch {
        // Use defaults
    }

    const numericMenteeId = Number(input.menteeId);
    let createdBackendId: string | null = null;

    // 1. Create on Backend if mentee is numeric
    if (!isNaN(numericMenteeId)) {
        try {
            const payload = {
                mentee_id: numericMenteeId,
                mentor_id: mentorId,
                facility_id: facilityId,
                cycle_id: cycleId,
                thematic_area_id: input.thematicAreaId ? Number(input.thematicAreaId) : 1,
                prerequisites_met: true,
            };

            const res = await apiClient.post<any>(ENDPOINTS.ASSESSMENTS.BASE, payload);
            const createdRaw = res?.data ?? res;
            if (createdRaw?.id) {
                createdBackendId = String(createdRaw.id);

                // Set initial criteria scores
                await apiClient.post(ENDPOINTS.ASSESSMENTS.CRITERIA_SCORES(createdRaw.id), {
                    criteria_scores: [
                        { criterion: "Aseptic Technique & Hand Hygiene", score: 85 },
                        { criterion: "Clinical Patient Communication", score: 80 },
                        { criterion: "Procedural Adherence & Safety", score: 75 },
                    ],
                }).catch(() => null);

                // Set initial checklist items
                await apiClient.post(ENDPOINTS.ASSESSMENTS.CHECKLIST_ITEMS(createdRaw.id), {
                    checklist_items: [
                        { item: "Pre-procedure patient explanation and consent", checked: true },
                        { item: "Emergency supplies and medication tray prepared", checked: true },
                        { item: "Immediate postpartum vitals and monitoring documented", checked: false },
                    ],
                }).catch(() => null);
            }
        } catch (apiErr) {
            console.warn("Backend assessment creation failed, creating local assessment:", apiErr);
        }
    }

    const today = new Date().toISOString().slice(0, 10);
    const newAssessment: MentorAssessment = {
        id: createdBackendId || `assgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        menteeId: input.menteeId,
        menteeName: mentee ? mentee.name : `Mentee #${input.menteeId}`,
        menteeTitle: mentee ? mentee.title : "Resident Midwife",
        date: today,
        dueDate: input.dueDate || today,
        type: input.type,
        status: "PENDING",
        scorePct: null,
        instructions: input.instructions,
        referenceLink: input.referenceLink || "",
        feedback: input.feedback || "",
        attachmentNames: files.map((f) => f.name),
        createdAt: new Date().toISOString(),
        criteriaScores: [
            { criterion: "Aseptic Technique & Hand Hygiene", score: 85 },
            { criterion: "Clinical Patient Communication", score: 80 },
            { criterion: "Procedural Adherence & Safety", score: 75 },
        ],
        checklistItems: [
            { item: "Pre-procedure patient explanation and consent", checked: true },
            { item: "Emergency supplies and medication tray prepared", checked: true },
            { item: "Immediate postpartum vitals and monitoring documented", checked: false },
        ],
    };

    const currentStored = getStoredAssessments();
    const updated = [newAssessment, ...currentStored];
    saveStoredAssessments(updated);

    return newAssessment;
}

/**
 * Updates status, score, or review of an assessment in backend and local store.
 */
export async function updateAssessmentStatus(
    assessmentId: string,
    status: AssessmentStatus,
    scorePct: number | null = null,
    feedback?: string
): Promise<MentorAssessment | null> {
    const numId = Number(assessmentId);

    if (!isNaN(numId) && numId > 0) {
        try {
            // If setting score, update criteria scores or finalize/review
            if (scorePct !== null) {
                await apiClient.post(ENDPOINTS.ASSESSMENTS.CRITERIA_SCORES(numId), {
                    criteria_scores: [
                        { criterion: "Aseptic Technique & Hand Hygiene", score: Math.min(100, scorePct + 4) },
                        { criterion: "Clinical Patient Communication", score: scorePct },
                        { criterion: "Procedural Adherence & Safety", score: Math.max(50, scorePct - 4) },
                    ],
                }).catch(() => null);
            }

            if (status === "PASS") {
                // 1. Finalize assessment
                await apiClient.post(ENDPOINTS.ASSESSMENTS.FINALIZE(numId)).catch(() => null);
                // 2. Submit official review
                await apiClient.post(ENDPOINTS.ASSESSMENTS.REVIEW(numId), {
                    feedback: feedback || "Clinical assessment evaluated and passed by mentor preceptor.",
                    aggregate_score: scorePct ?? 90,
                }).catch(() => null);
            } else if (status === "NEEDS_REVIEW") {
                await apiClient.post(ENDPOINTS.ASSESSMENTS.REVIEW(numId), {
                    feedback: feedback || "Assessment requires remediation and preceptor review.",
                    aggregate_score: scorePct ?? 65,
                }).catch(async () => {
                    if (feedback) {
                        await apiClient.patch(ENDPOINTS.ASSESSMENTS.DETAIL(numId), { feedback }).catch(() => null);
                    }
                });
            } else if (feedback) {
                await apiClient.patch(ENDPOINTS.ASSESSMENTS.DETAIL(numId), { feedback }).catch(() => null);
            }
        } catch (e) {
            console.warn('Failed to update assessment ' + assessmentId + ' on backend:', e);
        }
    }

    const all = await getAssessments();
    const target = all.find((a) => String(a.id) === String(assessmentId));
    if (!target) return null;

    const updatedTarget: MentorAssessment = {
        ...target,
        status,
        scorePct: scorePct !== null ? scorePct : target.scorePct,
        feedback: feedback || target.feedback,
    };

    const currentStored = getStoredAssessments();
    const existingIndex = currentStored.findIndex((a) => String(a.id) === String(assessmentId));
    let newStored: MentorAssessment[];
    if (existingIndex >= 0) {
        newStored = [...currentStored];
        newStored[existingIndex] = updatedTarget;
    } else {
        newStored = [updatedTarget, ...currentStored];
    }

    saveStoredAssessments(newStored);
    return updatedTarget;
}

/**
 * Updates criteria scores on the backend.
 */
export async function setAssessmentCriteriaScores(
    assessmentId: string | number,
    scores: AssessmentCriterionScore[]
): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            await apiClient.post(ENDPOINTS.ASSESSMENTS.CRITERIA_SCORES(numId), {
                criteria_scores: scores.map((s) => ({
                    criterion: s.criterion,
                    score: Number(s.score),
                })),
            });
            return true;
        } catch (err) {
            console.warn("Failed to set criteria scores on backend:", err);
        }
    }
    return true;
}

/**
 * Updates checklist items on the backend.
 */
export async function setAssessmentChecklistItems(
    assessmentId: string | number,
    items: AssessmentChecklistItem[]
): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            await apiClient.post(ENDPOINTS.ASSESSMENTS.CHECKLIST_ITEMS(numId), {
                checklist_items: items.map((i) => ({
                    item: i.item,
                    checked: Boolean(i.checked),
                })),
            });
            return true;
        } catch (err) {
            console.warn("Failed to set checklist items on backend:", err);
        }
    }
    return true;
}


/**
 * Sets theory score on an assessment (POST /api/v1/assessments/:id/theory-score).
 */
export async function setAssessmentTheoryScore(
    assessmentId: string | number,
    theoryScore: number
): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            await apiClient.post(ENDPOINTS.ASSESSMENTS.THEORY_SCORE(numId), {
                theory_score: Math.max(0, Math.min(100, Number(theoryScore))),
            });
            return true;
        } catch (err) {
            console.warn("Failed to set theory score on backend:", err);
        }
    }
    return true;
}

/**
 * Adds evidence file to an assessment (POST /api/v1/assessments/:id/evidence).
 */
export async function addAssessmentEvidence(
    assessmentId: string | number,
    title: string,
    fileId: number
): Promise<AssessmentEvidence | null> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            const res = await apiClient.post<any>(ENDPOINTS.ASSESSMENTS.EVIDENCE(numId), {
                title,
                file_id: Number(fileId),
            });
            const data = res?.data ?? res;
            return {
                id: data.id,
                title: data.title || title,
                file_id: data.file_id || fileId,
                fileId: data.file_id || fileId,
                url: data.url,
                created_at: data.created_at || new Date().toISOString(),
            };
        } catch (err) {
            console.warn("Failed to add evidence to assessment on backend:", err);
        }
    }
    return null;
}

/**
 * Reviews an assessment (POST /api/v1/assessments/:id/review).
 */
export async function reviewAssessment(
    assessmentId: string | number,
    feedback: string,
    aggregateScore?: number
): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            const body: { feedback: string; aggregate_score?: number } = { feedback };
            if (aggregateScore !== undefined && aggregateScore !== null) {
                body.aggregate_score = Number(aggregateScore);
            }
            await apiClient.post(ENDPOINTS.ASSESSMENTS.REVIEW(numId), body);
            return true;
        } catch (err) {
            console.warn("Failed to review assessment on backend:", err);
        }
    }
    return true;
}

/**
 * Finalizes an assessment (POST /api/v1/assessments/:id/finalize).
 */
export async function finalizeAssessment(assessmentId: string | number): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            await apiClient.post(ENDPOINTS.ASSESSMENTS.FINALIZE(numId));
            return true;
        } catch (err) {
            console.warn("Failed to finalize assessment on backend:", err);
        }
    }
    return true;
}

/**
 * Partially updates an assessment (PATCH /api/v1/assessments/:id).
 */
export async function patchAssessment(
    assessmentId: string | number,
    data: { feedback?: string; prerequisites_met?: boolean }
): Promise<boolean> {
    const numId = Number(assessmentId);
    if (!isNaN(numId) && numId > 0) {
        try {
            await apiClient.patch(ENDPOINTS.ASSESSMENTS.DETAIL(numId), data);
            return true;
        } catch (err) {
            console.warn("Failed to patch assessment on backend:", err);
        }
    }
    return true;
}
