import type { MentorAssessment } from "@/types/mentor-assessment";
import {
  finalizeAssessment,
  getAssessmentById,
  getAssessments,
  reviewAssessment,
  setAssessmentChecklistItems,
  setAssessmentCriteriaScores,
  setAssessmentTheoryScore,
} from "./mentor-assessments.service";

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

export async function getPendingAssessments(): Promise<MentorAssessment[]> {
  const assessments = await getAssessments();
  return assessments.filter((assessment) =>
    ["PENDING", "DRAFT", "IN_REVIEW", "NEEDS_REVIEW"].includes(assessment.status)
  );
}

export async function getAssessmentDetails(
  id: string | number
): Promise<MentorAssessment | null> {
  return getAssessmentById(id);
}

export async function submitTheoryScore(
  id: string | number,
  payload: TheoryScorePayload
): Promise<void> {
  await setAssessmentTheoryScore(id, payload.theory_score);
}

export async function submitChecklist(
  id: string | number,
  payload: ChecklistPayload
): Promise<void> {
  await setAssessmentChecklistItems(id, payload.checklist_items);
}

export async function submitCriteriaScores(
  id: string | number,
  payload: CriteriaScoresPayload
): Promise<void> {
  await setAssessmentCriteriaScores(id, payload.criteria_scores);
}

export async function reviewAndFinalize(
  id: string | number,
  payload: ReviewPayload
): Promise<void> {
  await reviewAssessment(id, payload.feedback, payload.aggregate_score);
  await finalizeAssessment(id);
}
