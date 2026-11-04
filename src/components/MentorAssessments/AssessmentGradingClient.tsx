"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Paperclip,
  Send,
  Building2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  BookOpen,
  ListChecks,
  Sliders,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Printer,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import type {
  MentorAssessment,
  CertificateEligibility,
} from "@/types/mentor-assessment";
import {
  getAssessmentDetails,
  syncTheoryScore,
  submitChecklist,
  submitCriteriaScores,
  submitPracticalResult,
  reviewAndFinalize,
  getCertificateEligibility,
} from "@/services/assessment.service";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AssessmentGradingClientProps {
  assessmentId: string;
  initialAssessment?: MentorAssessment | null;
}

export function AssessmentGradingClient({
  assessmentId,
  initialAssessment,
}: AssessmentGradingClientProps) {
  const router = useRouter();

  // Network & Loading States
  const [assessment, setAssessment] = useState<MentorAssessment | null>(
    initialAssessment || null
  );
  const [isLoading, setIsLoading] = useState(!initialAssessment);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingTheory, setIsSyncingTheory] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 1. Theoretical Quiz Results State (READ-ONLY)
  const [theoryScore, setTheoryScore] = useState<number | null>(
    initialAssessment?.theoryScore !== undefined && initialAssessment.theoryScore !== null
      ? Number(initialAssessment.theoryScore)
      : 85
  );
  const [theoryPassed, setTheoryPassed] = useState<boolean>(
    initialAssessment?.theoryPassed ?? (theoryScore !== null ? theoryScore >= 80 : false)
  );

  // 2. Practical Evaluation Checklist State
  const [checklist, setChecklist] = useState<
    Array<{ item: string; checked: boolean }>
  >([
    { item: "Patient explanation, dignity, and verbal consent obtained", checked: true },
    { item: "Sterile delivery pack, PPE, and neonatal warming surface prepared", checked: true },
    { item: "Perineal support and controlled head delivery performed smoothly", checked: true },
    { item: "Oxytocin 10 IU IM administered within 1 minute of delivery", checked: true },
    { item: "Controlled cord traction (CCT) with counter-traction applied correctly", checked: false },
    { item: "Placenta & membranes inspected for complete cotyledons and integrity", checked: true },
    { item: "Uterine tone verified firm, fundal massage taught to patient", checked: false },
    { item: "Immediate postpartum maternal vitals and blood loss recorded", checked: true },
  ]);

  // 3. Clinical Criteria Rubrics State
  const [criteria, setCriteria] = useState<
    Array<{ criterion: string; rating: number }>
  >([
    { criterion: "Aseptic Technique & Hand Hygiene", rating: 4 },
    { criterion: "Clinical Patient Communication", rating: 4 },
    { criterion: "Procedural Adherence & Clinical Safety", rating: 4 },
    { criterion: "Emergency Readiness & Complication Vigilance", rating: 4 },
  ]);

  // 4. Practical Bedside Result State (1-5 Scale as defined by Swagger)
  const [practicalScore, setPracticalScore] = useState<number>(4);
  const [practicalFeedback, setPracticalFeedback] = useState<string>("");
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [preceptorNotes, setPreceptorNotes] = useState<string>("");

  // Total Result View State
  const [showTotalResult, setShowTotalResult] = useState<boolean>(
    initialAssessment?.status === "PASS" || initialAssessment?.status === "FINALIZED"
  );
  const [certificateEligibility, setCertificateEligibility] =
    useState<CertificateEligibility | null>(null);

  // Load Assessment on Mount
  useEffect(() => {
    let isMounted = true;
    if (!initialAssessment || String(initialAssessment.id) !== String(assessmentId)) {
      setIsLoading(true);
      setError(null);
      getAssessmentDetails(assessmentId)
        .then((data) => {
          if (!isMounted) return;
          if (data) {
            setAssessment(data);
            if (data.theoryScore !== undefined && data.theoryScore !== null) {
              setTheoryScore(Number(data.theoryScore));
              setTheoryPassed(Number(data.theoryScore) >= 80);
            }
            if (data.practicalScore !== undefined && data.practicalScore !== null) {
              setPracticalScore(Number(data.practicalScore));
            }
            if (data.practicalFeedback) {
              setPracticalFeedback(data.practicalFeedback);
            }
            if (data.checklistItems && data.checklistItems.length > 0) {
              setChecklist(
                data.checklistItems.map((c) => ({
                  item: c.item,
                  checked: Boolean(c.checked),
                }))
              );
            }
            if (data.criteriaScores && data.criteriaScores.length > 0) {
              setCriteria(
                data.criteriaScores.map((c) => ({
                  criterion: c.criterion,
                  rating: Math.max(1, Math.min(5, Math.round(c.score / 20))),
                }))
              );
            }
            if (data.feedback) {
              setPreceptorNotes(data.feedback);
            }
            if (data.status === "PASS" || data.status === "FINALIZED") {
              setShowTotalResult(true);
            }
          } else {
            setError(`Assessment #${assessmentId} not found.`);
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err?.message || "Failed to load assessment details.");
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      if (initialAssessment.theoryScore !== undefined && initialAssessment.theoryScore !== null) {
        setTheoryScore(Number(initialAssessment.theoryScore));
        setTheoryPassed(Number(initialAssessment.theoryScore) >= 80);
      }
      if (initialAssessment.practicalScore !== undefined && initialAssessment.practicalScore !== null) {
        setPracticalScore(Number(initialAssessment.practicalScore));
      }
      if (initialAssessment.checklistItems && initialAssessment.checklistItems.length > 0) {
        setChecklist(
          initialAssessment.checklistItems.map((c) => ({
            item: c.item,
            checked: Boolean(c.checked),
          }))
        );
      }
      if (initialAssessment.criteriaScores && initialAssessment.criteriaScores.length > 0) {
        setCriteria(
          initialAssessment.criteriaScores.map((c) => ({
            criterion: c.criterion,
            rating: Math.max(1, Math.min(5, Math.round(c.score / 20))),
          }))
        );
      }
      if (initialAssessment.feedback) {
        setPreceptorNotes(initialAssessment.feedback);
      }
      if (initialAssessment.status === "PASS" || initialAssessment.status === "FINALIZED") {
        setShowTotalResult(true);
      }
    }

    // Fetch eligibility if already finalized or completed
    getCertificateEligibility(assessmentId)
      .then((el) => {
        if (isMounted && el) setCertificateEligibility(el);
      })
      .catch(() => null);

    return () => {
      isMounted = false;
    };
  }, [assessmentId, initialAssessment]);

  // Derived Metrics & Calculations
  const checkedCount = checklist.filter((i) => i.checked).length;
  const checklistCompletionPct = Math.round(
    (checkedCount / (checklist.length || 1)) * 100
  );

  const criteriaAveragePct = Math.round(
    criteria.reduce((acc, curr) => acc + curr.rating * 20, 0) /
      (criteria.length || 1)
  );

  // Practical Score Percentage equivalent (1 = 20%, 3 = 60%, 4 = 80%, 5 = 100%)
  const practicalPct = practicalScore * 20;

  // Aggregate Total Score (Weighted: 40% Theory, 40% Practical, 20% Checklist)
  const currentTheory = theoryScore ?? 75;
  const aggregateScore = Math.round(
    currentTheory * 0.4 + practicalPct * 0.4 + checklistCompletionPct * 0.2
  );

  // Overall Passing Verdict (Theory >= 80% AND Practical Score >= 3)
  const isOverallPassed = currentTheory >= 80 && practicalScore >= 3;

  // Handlers
  const handleToggleChecklist = (index: number) => {
    setChecklist((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], checked: !next[index].checked };
      return next;
    });
  };

  const handleRatingChange = (index: number, newRating: number) => {
    setCriteria((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], rating: newRating };
      return next;
    });
  };

  const handleSyncTheory = async () => {
    setIsSyncingTheory(true);
    setStatusMessage(null);
    try {
      const res = await syncTheoryScore(assessmentId);
      if (res.success && res.theoryScore !== undefined) {
        setTheoryScore(res.theoryScore);
        setTheoryPassed(Boolean(res.theoryPassed));
        setStatusMessage({
          type: "success",
          text: `Theory score updated to ${res.theoryScore}% from candidate's latest authorized quiz attempt.`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.message || "No recent quiz attempts found for this thematic area.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Could not synchronize theory quiz results.",
      });
    } finally {
      setIsSyncingTheory(false);
    }
  };

  const handleSubmitAndFinalize = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // 1. Submit Checklist Items (POST /api/v1/assessments/{id}/checklist-items)
      await submitChecklist(assessmentId, {
        checklist_items: checklist,
      });

      // 2. Submit Criteria Scores (POST /api/v1/assessments/{id}/criteria-scores)
      await submitCriteriaScores(assessmentId, {
        criteria_scores: criteria.map((c) => ({
          criterion: c.criterion,
          score: c.rating * 20,
        })),
      });

      // 3. Submit Practical Result (POST /api/v1/assessments/{id}/practical-result)
      await submitPracticalResult(assessmentId, {
        practical_score: practicalScore,
        assessment_date: assessmentDate,
        practical_feedback: practicalFeedback || preceptorNotes,
      });

      // 4. Review and Finalize Assessment (POST /api/v1/assessments/{id}/review & finalize)
      await reviewAndFinalize(assessmentId, {
        feedback:
          preceptorNotes ||
          practicalFeedback ||
          "Clinical competency assessment evaluated and submitted by mentor preceptor.",
        aggregate_score: aggregateScore,
      });

      // 5. Query Certificate Eligibility (GET /api/v1/assessments/{id}/certificate-eligibility)
      const eligibility = await getCertificateEligibility(assessmentId);
      if (eligibility) {
        setCertificateEligibility(eligibility);
      }

      setStatusMessage({
        type: "success",
        text: "Clinical evaluation submitted and finalized! Total results displayed below.",
      });

      // Show the total result screen
      setShowTotalResult(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Grading submission error:", err);
      setStatusMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to submit and finalize assessment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#194611]" />
        <p className="text-sm font-semibold text-gray-700">
          Loading clinical assessment & candidate records...
        </p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50/70 p-8 text-center space-y-4 my-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
        <h2 className="text-xl font-bold text-red-900">Unable to Load Assessment</h2>
        <p className="text-sm text-red-700">{error || "Assessment not found."}</p>
        <Link
          href="/my-assessments"
          className="inline-flex items-center gap-2 rounded-lg bg-[#194611] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#12330c]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Assessments</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
        <div>
          <Link
            href="/my-assessments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 transition hover:text-[#194611]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessments List
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {assessment.type}
            </h1>
            <Badge
              className={cn(
                "uppercase tracking-wider font-semibold text-xs py-1 px-3",
                showTotalResult && isOverallPassed
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : showTotalResult && !isOverallPassed
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-blue-100 text-blue-800 border-blue-300"
              )}
            >
              {showTotalResult
                ? isOverallPassed
                  ? "Passed / Finalized"
                  : "Remediation Needed"
                : "Evaluation In Progress"}
            </Badge>
          </div>
        </div>

        {/* Live Aggregate Score Counter */}
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#194611]">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase text-gray-500">
              {showTotalResult ? "Final Aggregate Score" : "Live Aggregate Score"}
            </div>
            <div className="text-xl font-bold text-gray-900 leading-tight">
              {aggregateScore}%
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border p-4 text-sm font-medium",
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-red-50 border-red-300 text-red-900"
          )}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-700 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* CANDIDATE INFO STRIP                                      */}
      {/* ======================================================== */}
      <Card className="border-gray-200 shadow-xs bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-[#194611] shadow-2xs">
                {assessment.menteeName
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    {assessment.menteeName}
                  </h2>
                  <Badge variant="outline" className="text-[10px] text-gray-600">
                    Candidate Midwife
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  {assessment.menteeTitle || "Resident Midwife"} · ID #{assessment.menteeId}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 sm:justify-end">
              {assessment.facilityName && (
                <span className="flex items-center gap-1 font-medium text-gray-800">
                  <Building2 className="h-3.5 w-3.5 text-gray-500" />
                  {assessment.facilityName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                Assigned: {assessment.date}
              </span>
              {assessment.dueDate && (
                <span className="flex items-center gap-1 text-amber-700 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  Due: {assessment.dueDate}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* VIEW: TOTAL RESULT VIEW (DISPLAYED ON SUBMISSION OR PASS)*/}
      {/* ======================================================== */}
      {showTotalResult ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Result Banner */}
          <div
            className={cn(
              "rounded-2xl border p-6 sm:p-8 text-white shadow-sm relative overflow-hidden",
              isOverallPassed
                ? "bg-gradient-to-r from-[#194611] via-[#1f5616] to-[#12330c] border-[#194611]"
                : "bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 border-amber-800"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
                  {isOverallPassed ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#FDD028]" />
                      <span>Clinical Competency Verified</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-amber-300" />
                      <span>Remediation Required</span>
                    </>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {isOverallPassed
                    ? "Candidate Passed Clinical Evaluation"
                    : "Evaluation Completed — Remediation Required"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-200 max-w-xl">
                  {isOverallPassed
                    ? "The mentee has satisfied both the 80% theoretical knowledge threshold and demonstrated proficient bedside practical skills."
                    : "Candidate requires targeted preceptor review or retake of the theoretical quiz before clinical sign-off."}
                </p>
              </div>

              {/* Total Aggregate Score Disc */}
              <div className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xs border border-white/20 shrink-0">
                <div className="text-center">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                    Total Result
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-[#FDD028] leading-none mt-1">
                    {aggregateScore}%
                  </div>
                  <div className="text-[10px] text-white/70 mt-1 font-medium">
                    Weighted Aggregate
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Metric Detailed Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Theory Score */}
            <Card className="border-gray-200 bg-white shadow-xs">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-[#194611]" />
                    Theory Knowledge
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold",
                      theoryPassed
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-amber-300 bg-amber-50 text-amber-800"
                    )}
                  >
                    {theoryPassed ? "Passed (≥80%)" : "Failed (<80%)"}
                  </Badge>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {theoryScore !== null ? `${theoryScore}%` : "Pending"}
                </div>
                <p className="text-[11px] text-gray-500">
                  Read-only quiz result (Passing standard: 80%)
                </p>
              </CardContent>
            </Card>

            {/* 2. Practical Bedside Score */}
            <Card className="border-gray-200 bg-white shadow-xs">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-[#194611]" />
                    Practical Bedside
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold",
                      practicalScore >= 3
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-amber-300 bg-amber-50 text-amber-800"
                    )}
                  >
                    Level {practicalScore} / 5
                  </Badge>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {practicalScore} / 5
                  <span className="text-xs font-semibold text-gray-500 ml-1.5">
                    ({practicalPct}%)
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  {practicalScore >= 4
                    ? "Proficient Practice"
                    : practicalScore === 3
                    ? "Competent Independent"
                    : "Supervised Level"}
                </p>
              </CardContent>
            </Card>

            {/* 3. Checklist Adherence */}
            <Card className="border-gray-200 bg-white shadow-xs">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <ListChecks className="h-4 w-4 text-[#194611]" />
                    Procedural Steps
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold border-gray-300 bg-gray-50 text-gray-700"
                  >
                    {checkedCount} / {checklist.length}
                  </Badge>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {checklistCompletionPct}%
                </div>
                <p className="text-[11px] text-gray-500">
                  Bedside direct observation checklist adherence
                </p>
              </CardContent>
            </Card>

            {/* 4. Criteria Rubric Average */}
            <Card className="border-gray-200 bg-white shadow-xs">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-[#194611]" />
                    Criteria Rubric
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold border-emerald-300 bg-emerald-50 text-emerald-800"
                  >
                    Average
                  </Badge>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {criteriaAveragePct}%
                </div>
                <p className="text-[11px] text-gray-500">
                  Asepsis, communication, and safety domains
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Certificate Eligibility Status Card */}
          <Card className="border-gray-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#194611]" />
                Accreditation & Certificate Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      Clinical Competency Certification:
                    </span>
                    <Badge
                      className={cn(
                        "font-semibold text-xs",
                        certificateEligibility?.eligible || isOverallPassed
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      )}
                    >
                      {certificateEligibility?.eligible || isOverallPassed
                        ? "Eligible for Certification"
                        : "Requirements Pending"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    {certificateEligibility?.reason ||
                      (isOverallPassed
                        ? "Candidate satisfies all clinical prerequisites, theory passing threshold (≥80%), and practical bedside competencies."
                        : "Candidate must achieve ≥80% on theory exam and level 3 practical score to qualify.")}
                  </p>
                </div>

                <div className="text-xs text-gray-500 shrink-0">
                  Evaluation Date: <span className="font-semibold text-gray-800">{assessmentDate}</span>
                </div>
              </div>

              {/* Preceptor Feedback Summary */}
              {(preceptorNotes || practicalFeedback) && (
                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-1">
                  <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-[#194611]" />
                    Mentor Preceptor Sign-off Remarks:
                  </div>
                  <p className="text-xs text-gray-700 italic leading-relaxed">
                    "{preceptorNotes || practicalFeedback}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowTotalResult(false)}
              className="text-xs font-semibold text-gray-700 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Review / Edit Evaluation Details
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="text-xs font-semibold text-gray-700 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print Evaluation Summary
              </Button>
              <Link
                href="/my-assessments"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#194611] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#12330c] transition"
              >
                <span>Return to Assessments</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* VIEW: ACTIVE EVALUATION GRADING FORM                     */
        /* ======================================================== */
        <div className="space-y-6">
          {/* SECTION 1: THEORETICAL QUIZ RESULTS (READ-ONLY) */}
          <Card className="border-gray-200 bg-white shadow-xs">
            <CardHeader className="border-b border-gray-100 bg-emerald-50/30 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[#194611]">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-gray-900">
                        1. Theoretical Knowledge Quiz Results
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-bold border-gray-300 text-gray-600 bg-white">
                        Read-Only
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-gray-500">
                      Synchronized from the mentee's latest authorized module quiz attempt.
                    </CardDescription>
                  </div>
                </div>

                {/* Sync Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncTheory}
                  disabled={isSyncingTheory}
                  className="self-start sm:self-auto text-xs font-semibold text-[#194611] border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                >
                  <RefreshCw
                    className={cn("h-3.5 w-3.5 mr-1.5", isSyncingTheory && "animate-spin")}
                  />
                  <span>Sync Latest Quiz Attempt</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* Score Big Display */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-center sm:text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Candidate Theory Score
                  </div>
                  <div className="flex items-baseline gap-2 mt-1 justify-center sm:justify-start">
                    <span className="text-3xl font-black text-gray-900">
                      {theoryScore !== null ? `${theoryScore}%` : "Pending"}
                    </span>
                    <Badge
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        theoryPassed
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      )}
                    >
                      {theoryPassed ? "Passed (≥80%)" : "Retake (<80%)"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Passing standard: 80% minimum threshold
                  </p>
                </div>

                {/* Scope & Thematic Area Details */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-700">Thematic Area:</span>
                    <span className="text-gray-900 font-medium">
                      {assessment.thematicAreaName || assessment.type}
                    </span>
                  </div>
                  <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3 text-xs text-gray-700 leading-relaxed">
                    <span className="font-bold text-[#194611] mr-1">Preceptor Notice:</span>
                    Theory knowledge examination is completed independently by the candidate online.
                    This read-only score is locked to guarantee clinical audit integrity and cannot be modified manually.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: PRACTICAL EVALUATION CHECKLISTS & METRICS */}
          <div className="space-y-6">
            {/* 2A. Procedural Clinical Checklist */}
            <Card className="border-gray-200 bg-white shadow-xs">
              <CardHeader className="border-b border-gray-100 bg-gray-50/60 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[#194611]">
                      <ListChecks className="h-4 w-4" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900">
                        2. Procedural Clinical Checklist (Bedside Direct Observation)
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500">
                        Mark procedural steps directly observed during clinical care.
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-gray-700">
                    <span>Adherence:</span>
                    <Badge variant="outline" className="border-[#194611] text-[#194611] bg-emerald-50">
                      {checkedCount} of {checklist.length} ({checklistCompletionPct}%)
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                <div className="space-y-2.5">
                  {checklist.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleToggleChecklist(idx)}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition select-none",
                        item.checked
                          ? "border-emerald-200 bg-emerald-50/40"
                          : "border-gray-200 bg-white hover:bg-gray-50/70"
                      )}
                    >
                      <Checkbox
                        checked={item.checked}
                        className="mt-0.5 data-[state=checked]:bg-[#194611] data-[state=checked]:border-[#194611]"
                        readOnly
                      />
                      <div className="flex-1">
                        <span
                          className={cn(
                            "text-xs leading-relaxed",
                            item.checked
                              ? "text-gray-900 font-semibold"
                              : "text-gray-600"
                          )}
                        >
                          {item.item}
                        </span>
                      </div>
                      {item.checked && (
                        <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 2B. Bedside Clinical Criteria Rubrics */}
            <Card className="border-gray-200 bg-white shadow-xs">
              <CardHeader className="border-b border-gray-100 bg-gray-50/60 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[#194611]">
                      <Sliders className="h-4 w-4" />
                    </span>
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900">
                        3. Clinical Competency Criteria Rubrics (1-5 Scale)
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500">
                        Rate candidate performance from 1 (Novice) to 5 (Master).
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-gray-700">
                    <span>Criteria Average:</span>
                    <Badge variant="outline" className="border-gray-300 text-gray-800 bg-white">
                      {criteriaAveragePct}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {criteria.map((c, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                        <span className="truncate pr-2">{c.criterion}</span>
                        <Badge
                          variant="secondary"
                          className="bg-white text-[#194611] border border-gray-200 shrink-0 font-bold text-xs"
                        >
                          {c.rating} / 5 ({c.rating * 20}%)
                        </Badge>
                      </div>

                      {/* 1 to 5 scale buttons */}
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleRatingChange(idx, val)}
                            className={cn(
                              "py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer flex flex-col items-center justify-center",
                              c.rating === val
                                ? "bg-[#194611] text-white border-[#194611] shadow-2xs"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                            )}
                          >
                            <span>{val}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                        <span>1: Novice</span>
                        <span>3: Competent</span>
                        <span>5: Master</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 2C. Overall Practical Bedside Rating (POST /practical-result) */}
            <Card className="border-gray-200 bg-white shadow-xs">
              <CardHeader className="border-b border-gray-100 bg-emerald-50/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[#194611]">
                    <Award className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle className="text-base font-bold text-gray-900">
                      4. Overall Practical Bedside Rating & Preceptor Feedback
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      Submit the final bedside score and qualitative feedback to the official assessment log.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* 1-5 Scale Level Cards */}
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-2">
                    Overall Bedside Practical Level (1-5 Scale) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {[
                      { level: 1, title: "1. Novice", desc: "Requires close direct supervision" },
                      { level: 2, title: "2. Beginner", desc: "Routine prompts needed" },
                      { level: 3, title: "3. Competent", desc: "Safe independent bedside practice" },
                      { level: 4, title: "4. Proficient", desc: "Fluid, anticipatory patient care" },
                      { level: 5, title: "5. Master", desc: "Exemplary, preceptor capability" },
                    ].map((item) => (
                      <div
                        key={item.level}
                        onClick={() => setPracticalScore(item.level)}
                        className={cn(
                          "rounded-xl border p-3 cursor-pointer transition text-left flex flex-col justify-between",
                          practicalScore === item.level
                            ? "border-[#194611] bg-emerald-50/60 ring-2 ring-[#194611]/20 shadow-2xs"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        )}
                      >
                        <div className="text-xs font-bold text-gray-900 flex items-center justify-between">
                          <span>{item.title}</span>
                          {practicalScore === item.level && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#194611]" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-gray-800 block mb-1.5">
                      Bedside Evaluation Date *
                    </label>
                    <input
                      type="date"
                      value={assessmentDate}
                      onChange={(e) => setAssessmentDate(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#194611]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-800 block mb-1.5">
                      Clinical Focus Area / Protocol
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={assessment.type}
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-600 select-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1.5">
                    Preceptor Qualitative Clinical Observations & Feedback *
                  </label>
                  <Textarea
                    rows={4}
                    value={preceptorNotes}
                    onChange={(e) => setPreceptorNotes(e.target.value)}
                    placeholder="Document clinical strengths observed, patient dignity, manual dexterity, asepsis adherence, and any remediation advice..."
                    className="text-xs leading-relaxed"
                  />
                </div>
              </CardContent>

              {/* Final Submit & Show Total Result Button */}
              <CardFooter className="border-t border-gray-100 bg-gray-50/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-gray-500">
                  Submitting will lock the practical scores, calculate aggregate performance, and display the candidate's total result.
                </div>

                <Button
                  onClick={handleSubmitAndFinalize}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-[#194611] hover:bg-[#12330c] text-white font-semibold px-6 py-2.5 text-xs shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Submitting & Finalizing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      <span>Submit & Finalize Clinical Evaluation</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
