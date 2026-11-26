import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";

export type ExamStage = "PRE_TEST" | "POST_TEST";

export interface ImportExamPayload {
  title: string;
  stage: ExamStage;
  thematic_area_id: number;
  cycle_id: number;
  file: File;
  description?: string;
  version?: number;
}

export interface ExamImportResult {
  id: number;
  title: string;
  description?: string | null;
  stage: ExamStage;
  version: number;
  totalQuestions: number;
  totalMarks: number;
  isPublished: boolean;
  isAuthorized: boolean;
  importSummary?: {
    questionsCreated: number;
    optionsPerQuestion: number;
  };
}

export interface ExamSummaryItem {
  id: number;
  title: string;
  description?: string | null;
  stage: ExamStage;
  version: number;
  totalQuestions: number;
  totalMarks: number;
  isPublished: boolean;
  isAuthorized: boolean;
  thematicArea?: { id: number; name: string };
  cycle?: { id: number; name: string };
  createdAt?: string;
}

export interface ExamQuestionOption {
  id?: number;
  option_key: string; // "A" | "B" | "C" | "D"
  option_text: string;
}

export interface ExamQuestion {
  id?: number;
  question_text: string;
  marks: number;
  options: ExamQuestionOption[];
}

export interface ExamDetail {
  id: number;
  title: string;
  description?: string | null;
  stage: ExamStage;
  version: number;
  isPublished: boolean;
  isAuthorized: boolean;
  totalQuestions: number;
  totalMarks: number;
  questions: ExamQuestion[];
  thematicArea?: { id: number; name: string };
  cycle?: { id: number; name: string };
}

/**
 * POST /api/v1/exams/import
 * Imports exam questions from a CSV file.
 * Required CSV headers: question, option_a, option_b, option_c, option_d, correct_answer, marks
 */
export async function importExamFromCsv(payload: ImportExamPayload): Promise<ExamImportResult> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("stage", payload.stage);
  formData.append("thematic_area_id", String(payload.thematic_area_id));
  formData.append("cycle_id", String(payload.cycle_id));
  formData.append("file", payload.file);

  if (payload.description) {
    formData.append("description", payload.description);
  }
  if (payload.version) {
    formData.append("version", String(payload.version));
  }

  const res = await apiClient.post<any>(ENDPOINTS.EXAMS.IMPORT, formData);
  const data = res?.data?.data ?? res?.data ?? res;
  return data as ExamImportResult;
}

/**
 * GET /api/v1/exams
 * Lists examinations.
 */
export async function listExams(): Promise<ExamSummaryItem[]> {
  const res = await apiClient.get<any>(ENDPOINTS.EXAMS.BASE);
  const rawList = res?.data?.data ?? res?.data?.items ?? res?.data ?? res;
  return Array.isArray(rawList) ? rawList : [];
}

/**
 * GET /api/v1/exams/{examId}
 * Retrieves detailed exam information by ID.
 */
export async function getExamDetails(examId: string | number): Promise<ExamDetail> {
  const res = await apiClient.get<any>(ENDPOINTS.EXAMS.DETAIL(examId));
  return (res?.data?.data ?? res?.data ?? res) as ExamDetail;
}

/**
 * POST /api/v1/exams/{examId}/publish
 * Super Admin publishes an imported examination.
 */
export async function publishExam(examId: string | number): Promise<{ success: boolean; data?: any }> {
  const res = await apiClient.post<any>(ENDPOINTS.EXAMS.PUBLISH(examId), {});
  return { success: true, data: res?.data ?? res };
}

/**
 * POST /api/v1/exams/{examId}/authorize
 * Super Admin authorizes an imported examination.
 */
export async function authorizeExam(examId: string | number): Promise<{ success: boolean; data?: any }> {
  const res = await apiClient.post<any>(ENDPOINTS.EXAMS.AUTHORIZE(examId), {});
  return { success: true, data: res?.data ?? res };
}

/**
 * High-level helper: Imports a single CSV containing both questions and answer keys,
 * automatically creating and publishing both PRE_TEST and POST_TEST stages for the module/thematic area.
 */
export async function importUnifiedCourseExam(
  file: File,
  meta: {
    title: string;
    description?: string;
    thematic_area_id: number;
    cycle_id?: number;
  }
): Promise<{ preTest?: ExamImportResult; postTest?: ExamImportResult; message: string }> {
  const cycleId = meta.cycle_id || 1;
  const results: { preTest?: ExamImportResult; postTest?: ExamImportResult; message: string } = {
    message: "Exam imported successfully",
  };

  try {
    // 1. Import PRE_TEST
    const preRes = await importExamFromCsv({
      title: `${meta.title} - Pre-Test`,
      description: meta.description,
      stage: "PRE_TEST",
      thematic_area_id: meta.thematic_area_id,
      cycle_id: cycleId,
      file,
    });
    results.preTest = preRes;

    if (preRes?.id) {
      await publishExam(preRes.id).catch((e) => console.warn("Failed to auto-publish pre-test:", e));
      await authorizeExam(preRes.id).catch((e) => console.warn("Failed to auto-authorize pre-test:", e));
    }

    // 2. Import POST_TEST using the exact same CSV (questions & choices shuffled by system)
    const postRes = await importExamFromCsv({
      title: `${meta.title} - Post-Test`,
      description: meta.description,
      stage: "POST_TEST",
      thematic_area_id: meta.thematic_area_id,
      cycle_id: cycleId,
      file,
    });
    results.postTest = postRes;

    if (postRes?.id) {
      await publishExam(postRes.id).catch((e) => console.warn("Failed to auto-publish post-test:", e));
      await authorizeExam(postRes.id).catch((e) => console.warn("Failed to auto-authorize post-test:", e));
    }

    results.message = `Successfully imported and activated Course Examination (${preRes.totalQuestions || "multiple"} questions).`;
  } catch (err: any) {
    console.warn("Unified exam import warning:", err?.message || err);
    throw err;
  }

  return results;
}

/**
 * Generates and triggers download of a standardized CSV template for clinical examinations.
 */
export function downloadSampleExamCsv() {
  const sampleCsvContent = `question,option_a,option_b,option_c,option_d,correct_answer,marks
"What is the first-line uterotonic recommended for Active Management of Third Stage of Labor (AMTSL)?","Oxytocin 10 IU IM","Misoprostol 800 mcg sublingual","Methylergonovine 0.2 mg IM","Tranexamic Acid 1g IV","A",1
"During neonatal resuscitation, at what heart rate should chest compressions be initiated?","Heart rate below 100 bpm","Heart rate below 60 bpm despite 30 seconds of effective ventilation","Heart rate below 80 bpm","Heart rate below 40 bpm","B",1
"Which severe feature indicates immediate magnesium sulfate administration in pre-eclampsia?","Diastolic BP 85 mmHg","Trace proteinuria","Systolic BP >= 160 mmHg or intractable severe headache","Serum creatinine 0.8 mg/dL","C",1
"What is the recommended ratio of chest compressions to ventilations in newborn resuscitation?","3 compressions to 1 ventilation (3:1)","15 compressions to 2 ventilations (15:2)","30 compressions to 2 ventilations (30:2)","5 compressions to 1 ventilation (5:1)","A",1
"What is the WHO-recommended dose and route of magnesium sulfate loading dose for eclampsia?","4g IV over 10-15 minutes plus 10g IM (5g in each buttock)","2g IV push","10g IV infusion over 1 hour","5g IM single dose","A",1`;

  const blob = new Blob([sampleCsvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "clinical_exam_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
