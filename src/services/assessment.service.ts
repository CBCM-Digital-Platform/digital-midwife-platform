import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type {
  AssessmentChecklistItem,
  AssessmentCriterionScore,
  MentorAssessment,
} from "@/types/mentor-assessment";
import { normalizeAssessment } from "./mentor-assessments.service";

export interface TheoryScorePayload {
  theory_score: number;
}

export interface ChecklistPayload {
  checklist_items: Array<{
    item: string;
    checked: boolean;
  }>;
}

export interface CriteriaScoresPayload {
  criteria_scores: Array<{
    criterion: string;
    score: number;
  }>;
}

export interface ReviewPayload {
  feedback: string;
  aggregate_score?: number;
}

/**
 * 1. Fetch pending assessments for mentor evaluation (GET /api/v1/assessments)
 */
export async function getPendingAssessments(): Promise<MentorAssessment[]> {
  try {
    const res = await apiClient.get<any>(`${ENDPOINTS.ASSESSMENTS.BASE}?limit=100`);
    const rawList = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];

    return rawList.map(normalizeAssessment);
  } catch (err) {
    console.warn("Could not fetch pending assessments from backend:", err);
    return [];
  }
}

/**
 * 2. Fetch specific assessment details (GET /api/v1/assessments/{id})
 */
export async function getAssessmentDetails(
  id: string | number
): Promise<MentorAssessment | null> {
  const numId = Number(id);
  if (!isNaN(numId) && numId > 0) {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.ASSESSMENTS.DETAIL(numId));
      const raw = res?.data ?? res;
      if (raw && (raw.id || raw.mentee_id)) {
        return normalizeAssessment(raw);
      }
    } catch (err) {
      console.warn(`Failed to fetch assessment ${id} from API:`, err);
    }
  }

  // Fallback to legacy lookup if needed
  const { getAssessmentById } = await import("./mentor-assessments.service");
  return getAssessmentById(id);
}

/**
 * 3. Submit Theory Score (POST /api/v1/assessments/{id}/theory-score)
 */
export async function submitTheoryScore(
  id: string | number,
  payload: TheoryScorePayload
): Promise<boolean> {
  const numId = Number(id);
  if (!isNaN(numId) && numId > 0) {
    await apiClient.post(ENDPOINTS.ASSESSMENTS.THEORY_SCORE(numId), {
      theory_score: Math.max(0, Math.min(100, Number(payload.theory_score))),
    });
  }
  return true;
}

/**
 * 4. Submit Procedural Checklist (POST /api/v1/assessments/{id}/checklist-items)
 */
export async function submitChecklist(
  id: string | number,
  payload: ChecklistPayload
): Promise<boolean> {
  const numId = Number(id);
  if (!isNaN(numId) && numId > 0) {
    await apiClient.post(ENDPOINTS.ASSESSMENTS.CHECKLIST_ITEMS(numId), {
      checklist_items: payload.checklist_items.map((i) => ({
        item: i.item,
        checked: Boolean(i.checked),
      })),
    });
  }
  return true;
}

/**
 * 5. Submit Criteria Scores (POST /api/v1/assessments/{id}/criteria-scores)
 */
export async function submitCriteriaScores(
  id: string | number,
  payload: CriteriaScoresPayload
): Promise<boolean> {
  const numId = Number(id);
  if (!isNaN(numId) && numId > 0) {
    await apiClient.post(ENDPOINTS.ASSESSMENTS.CRITERIA_SCORES(numId), {
      criteria_scores: payload.criteria_scores.map((c) => ({
        criterion: c.criterion,
        score: Number(c.score),
      })),
    });
  }
  return true;
}

/**
 * 6. Review and Finalize Assessment
 * Calls POST /api/v1/assessments/{id}/review followed by POST /api/v1/assessments/{id}/finalize
 */
export async function reviewAndFinalize(
  id: string | number,
  payload: ReviewPayload
): Promise<boolean> {
  const numId = Number(id);
  if (!isNaN(numId) && numId > 0) {
    // 1. Submit review
    await apiClient.post(ENDPOINTS.ASSESSMENTS.REVIEW(numId), {
      feedback: payload.feedback,
      aggregate_score: payload.aggregate_score ?? 85,
    });

    // 2. Finalize assessment
    await apiClient.post(ENDPOINTS.ASSESSMENTS.FINALIZE(numId)).catch((err) => {
      console.warn(`Finalize endpoint note for ${id}:`, err);
    });
  }
  return true;
}
