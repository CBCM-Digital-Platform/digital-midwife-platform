import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import type {
  AssessmentChecklistItem,
  AssessmentCriterionScore,
  CertificateEligibility,
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

export interface PracticalResultPayload {
  practical_score: number;
  assessment_date?: string;
  practical_feedback?: string;
}

export interface ReviewPayload {
  feedback: string;
  aggregate_score?: number;
}

export interface TheorySyncResponse {
  success: boolean;
  theoryScore?: number;
  theoryPassed?: boolean;
  message?: string;
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

  // Fallback to local lookup if needed
  const { getAssessmentById } = await import("./mentor-assessments.service");
  return getAssessmentById(id);
}

/**
 * 3. Sync Theory Score from mapped Quiz (POST /api/v1/assessments/{id}/sync-theory)
 */
export async function syncTheoryScore(
  id: string | number
): Promise<TheorySyncResponse> {
  const numId = Number(id);
  if (!isNaN(numId) && numId > 0) {
    try {
      const res = await apiClient.post<any>(ENDPOINTS.ASSESSMENTS.SYNC_THEORY(numId));
      const data = res?.data ?? res;
      const score = data?.theory_score !== undefined ? Number(data.theory_score) : undefined;
      return {
        success: true,
        theoryScore: score,
        theoryPassed: data?.theory_passed ?? (score !== undefined ? score >= 80 : undefined),
        message: data?.message || "Theory quiz results synchronized successfully.",
      };
    } catch (err: any) {
      console.warn(`Failed to sync theory score for ${id}:`, err);
      return {
        success: false,
        message: err?.response?.data?.message || err?.message || "Could not sync theoretical quiz score from backend.",
      };
    }
  }
  return { success: false, message: "Invalid assessment ID" };
}

/**
 * 4. Submit Theory Score (POST /api/v1/assessments/{id}/theory-score)
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
 * 5. Submit Practical Result (POST /api/v1/assessments/{id}/practical-result)
 */
export async function submitPracticalResult(
  id: string | number,
  payload: PracticalResultPayload
): Promise<boolean> {
  const numId = Number(id);
  if (!isNaN(numId) && numId > 0) {
    try {
      await apiClient.post(ENDPOINTS.ASSESSMENTS.PRACTICAL_RESULT(numId), {
        practical_score: Math.max(1, Math.min(5, Math.round(Number(payload.practical_score)))),
        assessment_date: payload.assessment_date || new Date().toISOString().slice(0, 10),
        practical_feedback: payload.practical_feedback || "",
      });
      return true;
    } catch (err) {
      console.warn(`Failed to submit practical result for ${id}:`, err);
    }
  }
  return true;
}

/**
 * 6. Submit Procedural Checklist (POST /api/v1/assessments/{id}/checklist-items)
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
 * 7. Submit Criteria Scores (POST /api/v1/assessments/{id}/criteria-scores)
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
 * 8. Fetch Certificate Eligibility (GET /api/v1/assessments/{id}/certificate-eligibility)
 */
export async function getCertificateEligibility(
  id: string | number
): Promise<CertificateEligibility | null> {
  const numId = Number(id);
  if (!isNaN(numId) && numId > 0) {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.ASSESSMENTS.CERTIFICATE_ELIGIBILITY(numId));
      const data = res?.data ?? res;
      if (data) {
        return {
          eligible: Boolean(data.eligible),
          reason: data.reason || null,
          assessment: data.assessment || null,
          existingCertificate: data.existingCertificate || null,
        };
      }
    } catch (err) {
      console.warn(`Failed to get certificate eligibility for ${id}:`, err);
    }
  }
  return null;
}

/**
 * 9. Review and Finalize Assessment
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
    }).catch((err) => {
      console.warn(`Review endpoint note for ${id}:`, err);
    });

    // 2. Finalize assessment
    await apiClient.post(ENDPOINTS.ASSESSMENTS.FINALIZE(numId)).catch((err) => {
      console.warn(`Finalize endpoint note for ${id}:`, err);
    });
  }
  return true;
}
