import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { getMyMentees } from "@/services/my-mentees.service";
import type {
    AssessmentChecklistItem,
    AssessmentCriterionScore,
    AssessmentEvidence,
    AssessmentPassingRule,
    AssessmentTypeOption,
    AssessmentStatus,
    MentorAssessment,
    NewAssessmentInput,
} from "@/types/mentor-assessment";

export const ASSESSMENT_STORAGE_KEY = "cbcm_mentor_assessments_store";

// Memory cache for SSR and in-process synchronization
let MEMORY_STORE: MentorAssessment[] = [];

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
    return value !== null && typeof value === "object" ? value as ApiRecord : {};
}

function getApiList(value: unknown, keys: string[] = []): ApiRecord[] {
    const collectionKeys = [
        "items",
        "assessments",
        "cycles",
        "thematic_areas",
        "thematicAreas",
        "results",
        ...keys,
    ];
    let payload: unknown = value;
    for (let depth = 0; depth < 5; depth += 1) {
        if (Array.isArray(payload)) return payload.map(asRecord);
        const record = asRecord(payload);
        for (const key of collectionKeys) {
            if (Array.isArray(record[key])) {
                return (record[key] as unknown[]).map(asRecord);
            }
        }
        const nested = record.data ?? record.result ?? record.payload;
        if (nested === undefined || nested === payload) break;
        payload = nested;
    }
    throw new Error("The assessments API returned an unexpected list response.");
}

function unwrap(value: unknown): unknown {
    let payload = value;
    for (let depth = 0; depth < 4; depth += 1) {
        const record = asRecord(payload);
        const nested = record.data ?? record.result ?? record.payload;
        if (nested === undefined || nested === payload) return payload;
        payload = nested;
    }
    return payload;
}

function optionalNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

function optionalId(value: unknown): string | number | undefined {
    return typeof value === "string" || typeof value === "number" ? value : undefined;
}

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

export async function getAssessmentTypes(): Promise<AssessmentTypeOption[]> {
    const response = await apiClient.get<unknown>("/api/v1/thematic-areas", {
        params: { page: 1, limit: 100 },
    });
    return getApiList(response, ["thematic_areas"])
        .filter((area) => String(area.status ?? "active").toLowerCase() === "active")
        .map((area) => ({
            id: String(area.id ?? ""),
            name: String(area.name ?? ""),
        }))
        .filter((area) => area.id && area.name);
}

function mapBackendStatus(rawStatus?: string): AssessmentStatus {
    const s = String(rawStatus || "").toLowerCase();
    if (s === "finalized") return "FINALIZED";
    if (s === "reviewed") return "REVIEWED";
    if (s === "in_review") return "IN_REVIEW";
    if (s === "needs_review") return "NEEDS_REVIEW";
    if (s === "draft") return "DRAFT";
    if (s === "pass") return "PASS";
    return "PENDING";
}

/**
 * Normalizes backend assessment payload to frontend MentorAssessment model.
 */
export function normalizeAssessment(value: unknown): MentorAssessment {
    const raw = asRecord(value);
    const mentee = asRecord(raw.mentee);
    const thematicArea = asRecord(raw.thematic_area ?? raw.thematicArea);
    const id = String(raw.id ?? raw._id ?? "");
    if (!id) throw new Error("The assessments API returned an assessment without an ID.");

    const menteeId = String(raw.mentee_id ?? raw.menteeId ?? mentee.id ?? "");
    const createdAt = String(raw.created_at ?? raw.createdAt ?? "");
    const parsedDate = createdAt ? new Date(createdAt) : null;
    const date = parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString().slice(0, 10)
        : String(raw.date ?? "");
    const criteria = Array.isArray(raw.criteria_scores)
        ? raw.criteria_scores
        : Array.isArray(raw.criteriaScores)
        ? raw.criteriaScores
        : [];
    const checklist = Array.isArray(raw.checklist_items)
        ? raw.checklist_items
        : Array.isArray(raw.checklistItems)
        ? raw.checklistItems
        : [];
    const evidence = Array.isArray(raw.evidence) ? raw.evidence : [];

    const criteriaScores: AssessmentCriterionScore[] = criteria.map((item) => {
        const score = asRecord(item);
        return {
            id: optionalNumber(score.id),
            criterion: String(score.criterion ?? ""),
            score: optionalNumber(score.score) ?? 0,
        };
    });
    const checklistItems: AssessmentChecklistItem[] = checklist.map((item) => {
        const checklistItem = asRecord(item);
        return {
            id: optionalNumber(checklistItem.id),
            item: String(checklistItem.item ?? ""),
            checked: Boolean(checklistItem.checked),
        };
    });
    const normalizedEvidence: AssessmentEvidence[] = evidence.map((item) => {
        const evidenceItem = asRecord(item);
        const fileId = optionalNumber(evidenceItem.file_id ?? evidenceItem.fileId);
        return {
            id: optionalNumber(evidenceItem.id),
            title: String(evidenceItem.title ?? "Evidence"),
            file_id: fileId,
            fileId,
            url: typeof evidenceItem.url === "string" ? evidenceItem.url : undefined,
            created_at: typeof evidenceItem.created_at === "string" ? evidenceItem.created_at : undefined,
        };
    });

    return {
        id,
        menteeId,
        menteeName: String(
            raw.mentee_name ??
            raw.menteeName ??
            mentee.full_name ??
            mentee.name ??
            (menteeId ? `Mentee #${menteeId}` : "Mentee")
        ),
        menteeTitle: String(
            mentee.highest_qualification ??
            mentee.training_status ??
            raw.mentee_title ??
            raw.menteeTitle ??
            "Resident Midwife"
        ),
        date,
        dueDate: typeof raw.due_date === "string" ? raw.due_date : undefined,
        type: String(thematicArea.name ?? raw.type ?? raw.title ?? "Assessment"),
        status: mapBackendStatus(String(raw.status ?? "")),
        scorePct: optionalNumber(raw.aggregate_score ?? raw.scorePct) ?? null,
        theoryScore: optionalNumber(raw.theory_score ?? raw.theoryScore) ?? null,
        practicalScore: optionalNumber(raw.practical_score ?? raw.practicalScore) ?? null,
        instructions: typeof raw.instructions === "string" ? raw.instructions : "",
        referenceLink: typeof raw.reference_link === "string" ? raw.reference_link : "",
        feedback: typeof raw.feedback === "string" ? raw.feedback : "",
        attachmentNames: Array.isArray(raw.attachmentNames)
            ? raw.attachmentNames.filter((name): name is string => typeof name === "string")
            : normalizedEvidence.map((item) => item.title),
        createdAt: createdAt || undefined,
        facilityId: optionalId(raw.facility_id ?? raw.facilityId),
        facilityName: typeof asRecord(raw.facility).name === "string"
            ? String(asRecord(raw.facility).name)
            : undefined,
        cycleId: optionalId(raw.cycle_id ?? raw.cycleId),
        thematicAreaId: optionalId(raw.thematic_area_id ?? raw.thematicAreaId ?? thematicArea.id),
        thematicAreaName: typeof thematicArea.name === "string" ? thematicArea.name : undefined,
        criteriaScores,
        checklistItems,
        evidence: normalizedEvidence,
        prerequisitesMet:
            typeof (raw.prerequisites_met ?? raw.prerequisitesMet) === "boolean"
                ? Boolean(raw.prerequisites_met ?? raw.prerequisitesMet)
                : undefined,
    };
}

/**
 * Returns all assessments, fetching from the backend API with fallback to seed data.
 */
export async function getAssessments(): Promise<MentorAssessment[]> {
    const res = await apiClient.get<unknown>(ENDPOINTS.ASSESSMENTS.BASE, {
        params: { limit: 100 },
    });
    return getApiList(res).map(normalizeAssessment);
}

export async function getAssessmentById(id: string | number): Promise<MentorAssessment | null> {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1) {
        throw new Error("Assessment ID must be a positive integer.");
    }
    const res = await apiClient.get<unknown>(ENDPOINTS.ASSESSMENTS.DETAIL(numericId));
    const raw = asRecord(unwrap(res));
    const assessment = asRecord(raw.assessment ?? raw);
    return assessment.id !== undefined ? normalizeAssessment(assessment) : null;
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
    if (!mentee) {
        throw new Error("Select a mentee assigned to your account.");
    }

    const menteeId = Number(input.menteeId);
    if (!Number.isInteger(menteeId) || menteeId < 1) {
        throw new Error("The selected mentee has an invalid backend ID.");
    }

    const currentUserResponse = await apiClient.get<unknown>("/api/v1/users/me");
    const userData = asRecord(unwrap(currentUserResponse));
    const currentUser = asRecord(userData.user ?? userData.profile ?? userData);
    const mentorId = Number(currentUser.id);
    if (!Number.isInteger(mentorId) || mentorId < 1) {
        throw new Error("The backend did not return a valid mentor ID for your account.");
    }

    const cycleId = Number(input.cycleId ?? mentee.cycleId);
    if (!Number.isInteger(cycleId) || cycleId < 1) {
        throw new Error("The selected mentee has no valid cycle assignment.");
    }

    const facilityId = Number(input.facilityId ?? mentee.facilityId);
    if (!Number.isInteger(facilityId) || facilityId < 1) {
        throw new Error("The selected mentee has no valid facility assignment.");
    }

    const thematicAreaId = Number(input.thematicAreaId);
    if (!Number.isInteger(thematicAreaId) || thematicAreaId < 1) {
        throw new Error("Select a valid thematic area for this assessment.");
    }

    const response = await apiClient.post<unknown>(ENDPOINTS.ASSESSMENTS.BASE, {
        mentee_id: menteeId,
        mentor_id: mentorId,
        facility_id: facilityId,
        cycle_id: cycleId,
        thematic_area_id: thematicAreaId,
        prerequisites_met: input.prerequisitesMet ?? true,
    });
    const createdData = asRecord(unwrap(response));
    const createdRaw = asRecord(createdData.assessment ?? createdData);
    if (!createdRaw.id) {
        throw new Error("The backend created no assessment record in its response.");
    }

    const created = normalizeAssessment({
        ...createdRaw,
        mentee_id: createdRaw.mentee_id ?? menteeId,
        mentee_name: createdRaw.mentee_name ?? mentee.name,
        mentee_title: createdRaw.mentee_title ?? mentee.title,
        facility_id: createdRaw.facility_id ?? facilityId,
        cycle_id: createdRaw.cycle_id ?? cycleId,
        thematic_area_id: createdRaw.thematic_area_id ?? thematicAreaId,
        thematic_area: createdRaw.thematic_area ?? {
            id: thematicAreaId,
            name: input.thematicAreaName,
        },
    });

    try {
        if (input.feedback?.trim()) {
            await apiClient.patch(ENDPOINTS.ASSESSMENTS.DETAIL(created.id), {
                feedback: input.feedback.trim(),
            });
        }

        for (const file of files) {
            const fileId = await uploadAssessmentEvidenceFile(file);
            await addAssessmentEvidence(created.id, file.name, fileId);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Assessment ${created.id} was created, but a follow-up update failed: ${error.message}`);
        }
        throw error;
    }

    const updatedStored = [created, ...getStoredAssessments().filter((item) => item.id !== created.id)];
    saveStoredAssessments(updatedStored);
    return created;
}

function requireAssessmentId(id: string | number): number {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1) {
        throw new Error("Assessment ID must be a positive integer.");
    }
    return numericId;
}

/**
 * Submits an official review and, when passed, finalizes the assessment.
 */
export async function updateAssessmentStatus(
    assessmentId: string,
    status: AssessmentStatus,
    scorePct: number | null = null,
    feedback?: string
): Promise<MentorAssessment | null> {
    const id = requireAssessmentId(assessmentId);
    if (status === "PASS" || status === "FINALIZED") {
        await reviewAssessment(
            id,
            feedback ?? "",
            scorePct ?? undefined
        );
        await finalizeAssessment(id);
    } else if (status === "NEEDS_REVIEW" || status === "IN_REVIEW" || status === "REVIEWED") {
        await reviewAssessment(id, feedback ?? "", scorePct ?? undefined);
    } else if (feedback !== undefined && feedback.trim()) {
        await patchAssessment(id, { feedback });
    }

    const updated = await getAssessmentById(id);
    if (updated) {
        saveStoredAssessments([
            updated,
            ...getStoredAssessments().filter((assessment) => assessment.id !== updated.id),
        ]);
    }
    return updated;
}

export async function setAssessmentCriteriaScores(
    assessmentId: string | number,
    scores: AssessmentCriterionScore[]
): Promise<void> {
    const id = requireAssessmentId(assessmentId);
    await apiClient.post(ENDPOINTS.ASSESSMENTS.CRITERIA_SCORES(id), {
        criteria_scores: scores.map((score) => ({
            criterion: score.criterion,
            score: Number(score.score),
        })),
    });
}

export async function setAssessmentChecklistItems(
    assessmentId: string | number,
    items: AssessmentChecklistItem[]
): Promise<void> {
    const id = requireAssessmentId(assessmentId);
    await apiClient.post(ENDPOINTS.ASSESSMENTS.CHECKLIST_ITEMS(id), {
        checklist_items: items.map((item) => ({
            item: item.item,
            checked: Boolean(item.checked),
        })),
    });
}

export async function setAssessmentTheoryScore(
    assessmentId: string | number,
    theoryScore: number
): Promise<void> {
    const id = requireAssessmentId(assessmentId);
    if (!Number.isFinite(theoryScore) || theoryScore < 0 || theoryScore > 100) {
        throw new Error("Theory score must be between 0 and 100.");
    }
    await apiClient.post(ENDPOINTS.ASSESSMENTS.THEORY_SCORE(id), {
        theory_score: theoryScore,
    });
}

export async function setAssessmentPracticalResult(
    assessmentId: string | number,
    practicalScore: number,
    assessmentDate?: string,
    practicalFeedback?: string
): Promise<void> {
    const id = requireAssessmentId(assessmentId);
    if (!Number.isInteger(practicalScore) || practicalScore < 1 || practicalScore > 5) {
        throw new Error("Practical score must be between 1 and 5.");
    }
    await apiClient.post(ENDPOINTS.ASSESSMENTS.PRACTICAL_RESULT(id), {
        practical_score: practicalScore,
        ...(assessmentDate ? { assessment_date: assessmentDate } : {}),
        ...(practicalFeedback ? { practical_feedback: practicalFeedback } : {}),
    });
}

export async function addAssessmentEvidence(
    assessmentId: string | number,
    title: string,
    fileId: number
): Promise<AssessmentEvidence> {
    const id = requireAssessmentId(assessmentId);
    if (!Number.isInteger(fileId) || fileId < 1) {
        throw new Error("Evidence file ID must be a positive integer.");
    }
    const res = await apiClient.post<unknown>(ENDPOINTS.ASSESSMENTS.EVIDENCE(id), {
        title,
        file_id: fileId,
    });
    const data = asRecord(unwrap(res));
    const evidence = asRecord(data.evidence ?? data);
    return {
        id: typeof evidence.id === "number" ? evidence.id : undefined,
        title: String(evidence.title ?? title),
        file_id: Number(evidence.file_id ?? fileId),
        fileId: Number(evidence.file_id ?? fileId),
        url: typeof evidence.url === "string" ? evidence.url : undefined,
        created_at: typeof evidence.created_at === "string" ? evidence.created_at : undefined,
    };
}

export async function uploadAssessmentEvidenceFile(file: File): Promise<number> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("context", "assessment");
    const response = await apiClient.post<unknown>(ENDPOINTS.UPLOADS.BASE, formData);
    const data = asRecord(unwrap(response));
    const uploaded = asRecord(data.file ?? data);
    const fileId = Number(uploaded.id);
    if (!Number.isInteger(fileId) || fileId < 1) {
        throw new Error(`The upload response did not include a valid file ID for "${file.name}".`);
    }
    return fileId;
}

export async function reviewAssessment(
    assessmentId: string | number,
    feedback: string,
    aggregateScore?: number
): Promise<void> {
    const id = requireAssessmentId(assessmentId);
    await apiClient.post(ENDPOINTS.ASSESSMENTS.REVIEW(id), {
        feedback,
        ...(aggregateScore !== undefined ? { aggregate_score: aggregateScore } : {}),
    });
}

export async function finalizeAssessment(assessmentId: string | number): Promise<void> {
    const id = requireAssessmentId(assessmentId);
    await apiClient.post(ENDPOINTS.ASSESSMENTS.FINALIZE(id));
}

export async function patchAssessment(
    assessmentId: string | number,
    data: { feedback?: string; prerequisites_met?: boolean }
): Promise<void> {
    const id = requireAssessmentId(assessmentId);
    await apiClient.patch(ENDPOINTS.ASSESSMENTS.DETAIL(id), data);
}

export async function syncAssessmentCriteria(assessmentId: string | number): Promise<unknown> {
    const id = requireAssessmentId(assessmentId);
    return apiClient.post<unknown>(ENDPOINTS.ASSESSMENTS.SYNC_CRITERIA(id));
}

export async function syncAssessmentTheory(assessmentId: string | number): Promise<unknown> {
    const id = requireAssessmentId(assessmentId);
    return apiClient.post<unknown>(ENDPOINTS.ASSESSMENTS.SYNC_THEORY(id));
}

export async function getAssessmentPassingRules(): Promise<AssessmentPassingRule[]> {
    const response = await apiClient.get<unknown>(ENDPOINTS.ASSESSMENTS.PASSING_RULES);
    return getApiList(response, ["rules"]).map((rule) => ({
        id: Number(rule.id),
        cycle_id: rule.cycle_id == null ? null : Number(rule.cycle_id),
        thematic_area_id: rule.thematic_area_id == null ? null : Number(rule.thematic_area_id),
        criteria_min_score: Number(rule.criteria_min_score),
        theory_min_score: Number(rule.theory_min_score),
        practical_min_score: Number(rule.practical_min_score),
        is_active: Boolean(rule.is_active),
    }));
}

export interface AssessmentPassingRuleInput {
    cycle_id: number;
    thematic_area_id: number;
    criteria_min_score: number;
    theory_min_score: number;
    practical_min_score: number;
    is_active?: boolean;
}

export async function createAssessmentPassingRule(
    input: Omit<AssessmentPassingRuleInput, "is_active">
): Promise<AssessmentPassingRule> {
    const response = await apiClient.post<unknown>(ENDPOINTS.ASSESSMENTS.PASSING_RULES, input);
    return normalizePassingRule(response);
}

export async function updateAssessmentPassingRule(
    ruleId: number,
    input: Partial<AssessmentPassingRuleInput>
): Promise<AssessmentPassingRule> {
    const response = await apiClient.patch<unknown>(ENDPOINTS.ASSESSMENTS.PASSING_RULE(ruleId), input);
    return normalizePassingRule(response);
}

export async function deactivateAssessmentPassingRule(ruleId: number): Promise<void> {
    if (!Number.isInteger(ruleId) || ruleId < 1) {
        throw new Error("Passing rule ID must be a positive integer.");
    }
    await apiClient.delete(ENDPOINTS.ASSESSMENTS.PASSING_RULE(ruleId));
}

function normalizePassingRule(response: unknown): AssessmentPassingRule {
    const data = asRecord(unwrap(response));
    const rule = asRecord(data.rule ?? data);
    const id = Number(rule.id);
    if (!Number.isInteger(id) || id < 1) {
        throw new Error("The assessment passing-rules API returned an invalid rule.");
    }
    return {
        id,
        cycle_id: rule.cycle_id == null ? null : Number(rule.cycle_id),
        thematic_area_id: rule.thematic_area_id == null ? null : Number(rule.thematic_area_id),
        criteria_min_score: Number(rule.criteria_min_score),
        theory_min_score: Number(rule.theory_min_score),
        practical_min_score: Number(rule.practical_min_score),
        is_active: Boolean(rule.is_active),
    };
}
