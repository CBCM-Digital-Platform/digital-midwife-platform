import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";

export interface AssessmentPassingRule {
    id: number;
    cycle_id: number | null;
    thematic_area_id: number | null;
    pre_test_threshold: number;
    post_test_threshold: number;
    practical_threshold: number;
    is_active: boolean;
    // Compatibility aliases
    criteria_min_score?: number;
    theory_min_score?: number;
    practical_min_score?: number;
}

export interface EnrichedPassingRule extends AssessmentPassingRule {
    cycleName?: string;
    thematicAreaName?: string;
    thematicAreaCode?: string;
}

export interface AssessmentPassingRuleInput {
    cycle_id: number;
    thematic_area_id: number;
    pre_test_threshold: number;
    post_test_threshold: number;
    practical_threshold: number;
    is_active?: boolean;
    // Compatibility aliases
    criteria_min_score?: number;
    theory_min_score?: number;
    practical_min_score?: number;
}

export interface PassingRuleLookups {
    cycles: Array<{ id: number; name: string }>;
    thematicAreas: Array<{ id: number; name: string; code: string }>;
}

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as ApiRecord)
        : {};
}

function unwrap(value: unknown): unknown {
    let current = value;
    for (let i = 0; i < 5; i++) {
        if (current && typeof current === "object" && !Array.isArray(current)) {
            const rec = current as Record<string, unknown>;
            if (rec.data !== undefined) {
                current = rec.data;
                continue;
            }
            if (rec.result !== undefined) {
                current = rec.result;
                continue;
            }
            if (rec.payload !== undefined) {
                current = rec.payload;
                continue;
            }
        }
        break;
    }
    return current;
}

function getApiList(value: unknown, keys: string[]): ApiRecord[] {
    let payload = unwrap(value);
    if (Array.isArray(payload)) return payload.map(asRecord);
    const rec = asRecord(payload);
    for (const key of keys) {
        if (Array.isArray(rec[key])) {
            return (rec[key] as unknown[]).map(asRecord);
        }
    }
    for (const key of ["items", "rules", "results", "data"]) {
        if (Array.isArray(rec[key])) {
            return (rec[key] as unknown[]).map(asRecord);
        }
    }
    return [];
}

function normalizePassingRule(response: unknown): AssessmentPassingRule {
    const data = asRecord(unwrap(response));
    const rule = asRecord(data.rule ?? data);
    const id = Number(rule.id);
    if (!Number.isInteger(id) || id < 1) {
        throw new Error("The assessment passing-rules API returned an invalid rule.");
    }
    const preTest = Number(rule.pre_test_threshold ?? rule.criteria_min_score ?? 0);
    const postTest = Number(rule.post_test_threshold ?? rule.theory_min_score ?? 0);
    const practical = Number(rule.practical_threshold ?? rule.practical_min_score ?? 1);

    return {
        id,
        cycle_id: rule.cycle_id == null ? null : Number(rule.cycle_id),
        thematic_area_id: rule.thematic_area_id == null ? null : Number(rule.thematic_area_id),
        pre_test_threshold: preTest,
        post_test_threshold: postTest,
        practical_threshold: practical,
        criteria_min_score: preTest,
        theory_min_score: postTest,
        practical_min_score: practical,
        is_active: rule.is_active !== undefined ? Boolean(rule.is_active) : true,
    };
}

/**
 * GET /api/v1/assessment-passing-rules
 * List assessment passing rules configured in the platform.
 */
export async function getAssessmentPassingRules(): Promise<AssessmentPassingRule[]> {
    const response = await apiClient.get<unknown>(ENDPOINTS.ASSESSMENTS.PASSING_RULES);
    return getApiList(response, ["rules", "items"]).map((rule) => normalizePassingRule(rule));
}

/**
 * GET /api/v1/assessment-passing-rules/{id}
 * Retrieve a specific assessment passing rule by ID.
 */
export async function getAssessmentPassingRuleById(ruleId: number): Promise<AssessmentPassingRule> {
    if (!Number.isInteger(ruleId) || ruleId < 1) {
        throw new Error("Passing rule ID must be a positive integer.");
    }
    const response = await apiClient.get<unknown>(ENDPOINTS.ASSESSMENTS.PASSING_RULE(ruleId));
    return normalizePassingRule(response);
}

/**
 * POST /api/v1/assessment-passing-rules
 * Create an assessment passing rule specifying minimum criteria, theory, and practical score thresholds.
 */
export async function createAssessmentPassingRule(
    input: Omit<AssessmentPassingRuleInput, "is_active"> & { is_active?: boolean }
): Promise<AssessmentPassingRule> {
    const payload = {
        cycle_id: input.cycle_id,
        thematic_area_id: input.thematic_area_id,
        pre_test_threshold: Number(input.pre_test_threshold ?? input.criteria_min_score ?? 0),
        post_test_threshold: Number(input.post_test_threshold ?? input.theory_min_score ?? 75),
        practical_threshold: Number(input.practical_threshold ?? input.practical_min_score ?? 3),
        ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
    };
    const response = await apiClient.post<unknown>(ENDPOINTS.ASSESSMENTS.PASSING_RULES, payload);
    return normalizePassingRule(response);
}

/**
 * PATCH /api/v1/assessment-passing-rules/{id}
 * Update score thresholds or status of an existing assessment passing rule.
 */
export async function updateAssessmentPassingRule(
    ruleId: number,
    input: Partial<AssessmentPassingRuleInput>
): Promise<AssessmentPassingRule> {
    if (!Number.isInteger(ruleId) || ruleId < 1) {
        throw new Error("Passing rule ID must be a positive integer.");
    }
    const payload: Record<string, unknown> = {};
    if (input.cycle_id !== undefined) payload.cycle_id = input.cycle_id;
    if (input.thematic_area_id !== undefined) payload.thematic_area_id = input.thematic_area_id;
    if (input.pre_test_threshold !== undefined || input.criteria_min_score !== undefined) {
        payload.pre_test_threshold = Number(input.pre_test_threshold ?? input.criteria_min_score);
    }
    if (input.post_test_threshold !== undefined || input.theory_min_score !== undefined) {
        payload.post_test_threshold = Number(input.post_test_threshold ?? input.theory_min_score);
    }
    if (input.practical_threshold !== undefined || input.practical_min_score !== undefined) {
        payload.practical_threshold = Number(input.practical_threshold ?? input.practical_min_score);
    }
    if (input.is_active !== undefined) payload.is_active = input.is_active;

    const response = await apiClient.patch<unknown>(ENDPOINTS.ASSESSMENTS.PASSING_RULE(ruleId), payload);
    return normalizePassingRule(response);
}

/**
 * DELETE /api/v1/assessment-passing-rules/{id}
 * Deactivate / delete an assessment passing rule.
 */
export async function deleteAssessmentPassingRule(ruleId: number): Promise<void> {
    if (!Number.isInteger(ruleId) || ruleId < 1) {
        throw new Error("Passing rule ID must be a positive integer.");
    }
    await apiClient.delete(ENDPOINTS.ASSESSMENTS.PASSING_RULE(ruleId));
}

export const deactivateAssessmentPassingRule = deleteAssessmentPassingRule;

/**
 * Fetch live cycles and thematic areas directly from the backend to populate passing rule dropdowns and lookups.
 */
export async function getPassingRuleLookups(): Promise<PassingRuleLookups> {
    const [cyclesRes, thematicAreasRes] = await Promise.all([
        apiClient.get<unknown>(ENDPOINTS.CYCLES.BASE, { params: { limit: 100 } }).catch(() => null),
        apiClient.get<unknown>(ENDPOINTS.THEMATIC_AREAS.BASE, { params: { limit: 100 } }).catch(() => null),
    ]);

    const rawCycles = getApiList(cyclesRes, ["items", "cycles", "mentorship_cycles", "results"]);
    const rawThematicAreas = getApiList(thematicAreasRes, ["items", "thematic_areas", "thematicAreas", "results"]);

    const cycles = rawCycles
        .map((c) => ({
            id: Number(c.id),
            name: String(c.name ?? c.title ?? c.cycle_name ?? `Cycle #${c.id}`).trim(),
        }))
        .filter((c) => !Number.isNaN(c.id) && c.id > 0);

    const thematicAreas = rawThematicAreas
        .map((ta) => ({
            id: Number(ta.id),
            name: String(ta.name ?? ta.title ?? `Thematic Area #${ta.id}`).trim(),
            code: String(ta.code ?? `TA-${ta.id}`).trim(),
        }))
        .filter((ta) => !Number.isNaN(ta.id) && ta.id > 0);

    return { cycles, thematicAreas };
}

/**
 * Retrieves passing rules from the backend and resolves cycle and thematic area names without mock data.
 */
export async function getEnrichedAssessmentPassingRules(): Promise<{
    rules: EnrichedPassingRule[];
    cycles: Array<{ id: number; name: string }>;
    thematicAreas: Array<{ id: number; name: string; code: string }>;
}> {
    const [rules, lookups] = await Promise.all([
        getAssessmentPassingRules().catch(() => []),
        getPassingRuleLookups(),
    ]);

    const cycleMap = new Map<number, string>(lookups.cycles.map((c) => [c.id, c.name]));
    const thematicAreaMap = new Map<number, { name: string; code: string }>(
        lookups.thematicAreas.map((ta) => [ta.id, { name: ta.name, code: ta.code }])
    );

    const enrichedRules: EnrichedPassingRule[] = rules.map((r) => {
        const cycleName = r.cycle_id ? cycleMap.get(r.cycle_id) : undefined;
        const ta = r.thematic_area_id ? thematicAreaMap.get(r.thematic_area_id) : undefined;
        return {
            ...r,
            cycleName,
            thematicAreaName: ta?.name,
            thematicAreaCode: ta?.code,
        };
    });

    return {
        rules: enrichedRules,
        cycles: lookups.cycles,
        thematicAreas: lookups.thematicAreas,
    };
}
