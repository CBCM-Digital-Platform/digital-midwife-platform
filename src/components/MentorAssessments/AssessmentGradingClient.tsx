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
  Plus,
  RefreshCw,
} from "lucide-react";
import type { MentorAssessment } from "@/types/mentor-assessment";
import {
  getAssessmentDetails,
  submitTheoryScore,
  submitChecklist,
  submitCriteriaScores,
  reviewAndFinalize,
} from "@/services/assessment.service";
import {
  setAssessmentPracticalResult,
  syncAssessmentCriteria,
  syncAssessmentTheory,
} from "@/services/mentor-assessments.service";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AssessmentGradingClientProps {
  assessmentId: string;
  initialAssessment?: MentorAssessment | null;
  initialLoadError?: string | null;
}

export function AssessmentGradingClient({
  assessmentId,
  initialAssessment,
  initialLoadError = null,
}: AssessmentGradingClientProps) {
  const router = useRouter();

  // Network & Loading States
  const [assessment, setAssessment] = useState<MentorAssessment | null>(
    initialAssessment || null
  );
  const [isLoading, setIsLoading] = useState(
    (!initialAssessment || String(initialAssessment.id) !== String(assessmentId)) &&
      !initialLoadError
  );
  const [error, setError] = useState<string | null>(initialLoadError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Grading Form State
  const [theoryScoreInput, setTheoryScoreInput] = useState<number>(
    initialAssessment?.theoryScore == null ? 0 : Number(initialAssessment.theoryScore)
  );
  const [practicalScore, setPracticalScore] = useState<number>(
    initialAssessment?.practicalScore == null ? 0 : Number(initialAssessment.practicalScore)
  );
  const [checklist, setChecklist] = useState<
    Array<{ item: string; checked: boolean }>
  >(initialAssessment?.checklistItems?.map(({ item, checked }) => ({ item, checked })) ?? []);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const [criteria, setCriteria] = useState<
    Array<{ criterion: string; rating: number }>
  >(
    initialAssessment?.criteriaScores?.map(({ criterion, score }) => ({
      criterion,
      rating: Math.max(0, Math.min(5, Math.round(score / 20))),
    })) ?? []
  );
  const [newCriterion, setNewCriterion] = useState("");

  const [feedback, setFeedback] = useState<string>(initialAssessment?.feedback ?? "");

  // Fetch assessment details on mount if not provided or if id changes
  useEffect(() => {
    let isMounted = true;
    if (initialLoadError) return;
    if (!initialAssessment || String(initialAssessment.id) !== String(assessmentId)) {
      getAssessmentDetails(assessmentId)
        .then((data) => {
          if (!isMounted) return;
          if (data) {
            setAssessment(data);
            if (data.theoryScore !== undefined && data.theoryScore !== null) {
              setTheoryScoreInput(Number(data.theoryScore));
            }
            if (data.practicalScore !== undefined && data.practicalScore !== null) {
              setPracticalScore(Number(data.practicalScore));
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
                  rating: Math.max(0, Math.min(5, Math.round(c.score / 20))),
                }))
              );
            }
            if (data.feedback) {
              setFeedback(data.feedback);
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
    }

    return () => {
      isMounted = false;
    };
  }, [assessmentId, initialAssessment, initialLoadError]);

  // Aggregate score calculation
  const criteriaAveragePct = Math.round(
    criteria.reduce((acc, curr) => acc + curr.rating * 20, 0) / (criteria.length || 1)
  );
  const aggregateScore = Math.round((criteriaAveragePct + Number(theoryScoreInput || 0)) / 2);

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

  const handleAddChecklistItem = () => {
    const item = newChecklistItem.trim();
    if (!item) return;
    setChecklist((current) => [...current, { item, checked: false }]);
    setNewChecklistItem("");
  };

  const handleAddCriterion = () => {
    const criterion = newCriterion.trim();
    if (!criterion) return;
    setCriteria((current) => [...current, { criterion, rating: 0 }]);
    setNewCriterion("");
  };

  const handleSyncScores = async (
    sync: () => Promise<unknown>,
    label: string
  ) => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await sync();
      setStatusMessage({ type: "success", text: `${label} synchronized from the backend.` });
      router.refresh();
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : `Unable to sync ${label.toLowerCase()}.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAndFinalize = async () => {
    if (criteria.length === 0 || checklist.length === 0) {
      setStatusMessage({
        type: "error",
        text: "Add at least one clinical criterion and one checklist item before submitting the evaluation.",
      });
      return;
    }
    if (criteria.some((criterion) => criterion.rating < 1)) {
      setStatusMessage({
        type: "error",
        text: "Score every clinical criterion before submitting the evaluation.",
      });
      return;
    }
    if (!Number.isInteger(practicalScore) || practicalScore < 1 || practicalScore > 5) {
      setStatusMessage({
        type: "error",
        text: "Enter the practical assessment result on the 1-5 scale before submitting.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // 1. Submit Theory Score
      await submitTheoryScore(assessmentId, {
        theory_score: Math.max(0, Math.min(100, Number(theoryScoreInput))),
      });

      // 2. Submit Checklist Items
      await submitChecklist(assessmentId, {
        checklist_items: checklist,
      });

      // 3. Submit Criteria Scores (convert 1-5 scale back to percentage score)
      await submitCriteriaScores(assessmentId, {
        criteria_scores: criteria.map((c) => ({
          criterion: c.criterion,
          score: c.rating * 20,
        })),
      });

      await setAssessmentPracticalResult(assessmentId, practicalScore);

      // 5. Review and Finalize (calls POST review followed by POST finalize)
      await reviewAndFinalize(assessmentId, {
        feedback,
        aggregate_score: aggregateScore,
      });

      setStatusMessage({
        type: "success",
        text: "Evaluation successfully submitted and finalized! Redirecting...",
      });

      // Redirect mentor back to assessment list upon successful 200/201 response
      setTimeout(() => {
        router.push("/my-assessments");
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error("Grading submission error:", err);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to submit and finalize assessment.",
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#194611]" />
        <p className="text-sm font-semibold text-gray-700">
          Loading assessment & candidate evidence...
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
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      {/* Page Header & Navigation */}
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
                assessment.status === "PASS"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : assessment.status === "NEEDS_REVIEW"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-blue-100 text-blue-800 border-blue-300"
              )}
            >
              {assessment.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Aggregate Score Display */}
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#194611]">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase text-gray-500">
              Live Aggregate Score
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

      {/* 2-COLUMN RESPONSIVE LAYOUT (lg:grid-cols-3) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ======================================================== */}
        {/* LEFT COLUMN: EVIDENCE VIEWER (col-span-2)               */}
        {/* ======================================================== */}
        <div className="space-y-6 lg:col-span-2">
          {/* Mentee Details Card */}
          <Card className="border-gray-200 shadow-xs">
            <CardHeader className="pb-3">
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
                    <CardTitle className="text-lg font-bold text-gray-900">
                      {assessment.menteeName}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600">
                      {assessment.menteeTitle || "Resident Midwife"}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end text-xs text-gray-600 space-y-1">
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
            </CardHeader>
          </Card>

          {/* Clinical Case Scope & Instructions */}
          <Card className="border-gray-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#194611]" />
                Clinical Case Scope & Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800 leading-relaxed border border-gray-100 whitespace-pre-wrap">
                {assessment.instructions ||
                  "Demonstrate normal spontaneous vaginal delivery with active management of the third stage, infection prevention precautions, vitals recording, and immediate newborn care."}
              </div>

              {assessment.referenceLink && (
                <div className="flex items-center gap-2 text-xs pt-1">
                  <span className="font-semibold text-gray-700">Reference Protocol:</span>
                  <a
                    href={assessment.referenceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#194611] hover:underline font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {assessment.referenceLink}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submitted Case Files & Digital Evidence */}
          <Card className="border-gray-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-[#194611]" />
                Candidate Submitted Evidence & Attachments
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Uploaded case logs, signed checklists, digital partographs, or clinical notes.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2">
              {assessment.evidence && assessment.evidence.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {assessment.evidence.map((ev, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100/80 transition"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileCheck2 className="h-5 w-5 shrink-0 text-[#194611]" />
                        <span className="truncate text-xs font-semibold text-gray-800">
                          {ev.title}
                        </span>
                      </div>
                      {ev.file_id && (
                        <a
                          href={`https://cbcm-backend-tntq.onrender.com/api/v1/uploads/${ev.file_id}/content`}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 rounded p-1.5 text-gray-600 hover:bg-white hover:text-gray-900 transition"
                          title="Download Evidence"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : assessment.attachmentNames && assessment.attachmentNames.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {assessment.attachmentNames.map((name, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="h-5 w-5 shrink-0 text-emerald-800" />
                        <span className="truncate text-xs font-semibold text-gray-800">
                          {name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Attached
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs text-gray-500">
                  <ShieldCheck className="mx-auto h-8 w-8 text-gray-400 mb-1" />
                  No digital files submitted. Clinical competency verified via bedside direct observation.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: STICKY GRADING PANEL (col-span-1)          */}
        {/* ======================================================== */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <Card className="border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-100 bg-gray-50/70 pb-3">
                <CardTitle className="text-base font-bold text-gray-900">
                  Grading Panel
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Consolidated preceptor rubric & clinical sign-off
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <Accordion type="single" defaultValue="step-theory">
                  {/* 1. THEORY SCORE */}
                  <AccordionItem value="step-theory">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[#194611]" />
                        <span>Theory Score</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-xs text-gray-500">
                        Score for oral exam, protocol knowledge, and case reasoning (0-100).
                      </p>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={theoryScoreInput}
                          onChange={(e) =>
                            setTheoryScoreInput(
                              Math.max(0, Math.min(100, Number(e.target.value)))
                            )
                          }
                          className="w-28 font-bold text-sm"
                        />
                        <span className="text-xs font-semibold text-gray-600">% score</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() =>
                          handleSyncScores(() => syncAssessmentTheory(assessmentId), "Theory score")
                        }
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync from quiz
                      </Button>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Practical observation result */}
                  <AccordionItem value="step-practical">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#194611]" />
                        <span>Practical Result</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-xs text-gray-500">
                        Record the observed practical result on the backend API 1-5 scale.
                      </p>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        step={1}
                        value={practicalScore || ""}
                        onChange={(event) => setPracticalScore(Number(event.target.value))}
                        className="w-28 font-bold text-sm"
                        aria-label="Practical assessment result from 1 to 5"
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* 2. PROCEDURAL CHECKLIST */}
                  <AccordionItem value="step-checklist">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-[#194611]" />
                        <span>Checklist Steps</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2.5">
                      <p className="text-xs text-gray-500 mb-2">
                        Check off clinical steps observed during patient care:
                      </p>
                      {checklist.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-1">Add the clinical steps to observe for this assessment.</p>
                      ) : checklist.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleToggleChecklist(idx)}
                          className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50/60 p-2.5 hover:bg-gray-100/80 transition"
                        >
                          <Checkbox checked={item.checked} className="mt-0.5" readOnly />
                          <span
                            className={cn(
                              "text-xs select-none leading-tight",
                              item.checked ? "text-gray-900 font-medium" : "text-gray-500"
                            )}
                          >
                            {item.item}
                          </span>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <Input
                          value={newChecklistItem}
                          onChange={(event) => setNewChecklistItem(event.target.value)}
                          placeholder="Add a clinical checklist step"
                          aria-label="New checklist item"
                        />
                        <Button type="button" variant="outline" onClick={handleAddChecklistItem}>
                          <Plus className="mr-1 h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 3. CRITERIA RUBRIC */}
                  <AccordionItem value="step-rubric">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-[#194611]" />
                        <span>Rubric Scoring (1-5 Scale)</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <p className="text-xs text-gray-500">
                        Score competencies on a 1 (Novice) to 5 (Mastered) scale.
                      </p>
                      {criteria.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-1">Add the clinical criteria to evaluate for this assessment.</p>
                      ) : criteria.map((c, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-gray-100 bg-gray-50/60 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-gray-800">
                            <span>{c.criterion}</span>
                            <span className="text-[#194611] font-bold">
                              {c.rating ? `${c.rating} / 5 (${c.rating * 20}%)` : "Not scored"}
                            </span>
                          </div>

                          {/* 1 to 5 scale buttons */}
                          <div className="grid grid-cols-5 gap-1 pt-1">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleRatingChange(idx, val)}
                                className={cn(
                                  "py-1 text-xs font-bold rounded-md border transition cursor-pointer",
                                  c.rating === val
                                    ? "bg-[#194611] text-white border-[#194611] shadow-2xs"
                                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                                )}
                              >
                                {val}
                              </button>
                            ))}
                            <div className="flex gap-2 pt-2">
                              <Input
                                value={newCriterion}
                                onChange={(event) => setNewCriterion(event.target.value)}
                                placeholder="Add a clinical criterion"
                                aria-label="New clinical criterion"
                              />
                              <Button type="button" variant="outline" onClick={handleAddCriterion}>
                                <Plus className="mr-1 h-4 w-4" />
                                Add
                              </Button>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isSubmitting}
                              onClick={() =>
                                handleSyncScores(() => syncAssessmentCriteria(assessmentId), "Criteria scores")
                              }
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Sync from quiz
                            </Button>
                          </div>

                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>1: Novice</span>
                            <span>3: Competent</span>
                            <span>5: Master</span>
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>

                  {/* 4. FINAL REVIEW */}
                  <AccordionItem value="step-review">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[#194611]" />
                        <span>Review & Feedback</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p className="text-xs text-gray-500">
                        Provide qualitative preceptor feedback and learning focus:
                      </p>
                      <Textarea
                        rows={3}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Clinical observations, bedside strengths, and focus topics..."
                        className="text-xs"
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>

              {/* ACTION: PRIMARY SUBMIT & FINALIZE BUTTON */}
              <CardFooter className="border-t border-gray-100 bg-gray-50/80 p-4">
                <Button
                  onClick={handleSubmitAndFinalize}
                  disabled={isSubmitting}
                  className="w-full bg-[#194611] hover:bg-[#12330c] text-white font-semibold py-2.5 text-xs shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Submitting & Finalizing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      <span>Submit & Finalize</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
