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
  HelpCircle,
  Paperclip,
  Send,
  User,
  Building2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  Plus,
} from "lucide-react";
import type {
  AssessmentChecklistItem,
  AssessmentCriterionScore,
  AssessmentStatus,
  MentorAssessment,
} from "@/types/mentor-assessment";
import type { MyMentee } from "@/types/my-mentee";
import {
  setAssessmentChecklistItems,
  setAssessmentCriteriaScores,
  setAssessmentTheoryScore,
  reviewAssessment,
  finalizeAssessment,
  updateAssessmentStatus,
  getStoredAssessments,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MentorAssessmentViewProps {
  assessment: MentorAssessment;
  assessmentsList?: MentorAssessment[];
  menteesList?: MyMentee[];
}

export function MentorAssessmentView({
  assessment: initialAssessment,
  assessmentsList = [],
  menteesList = [],
}: MentorAssessmentViewProps) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<MentorAssessment>(initialAssessment);
  const [feedbackText, setFeedbackText] = useState(initialAssessment.feedback || "");

  // Update component state when initialAssessment changes
  useEffect(() => {
    setAssessment(initialAssessment);
    setFeedbackText(initialAssessment.feedback || "");
    if (initialAssessment.criteriaScores && initialAssessment.criteriaScores.length > 0) {
      setCriteriaScores(initialAssessment.criteriaScores);
    }
    if (initialAssessment.checklistItems && initialAssessment.checklistItems.length > 0) {
      setChecklist(initialAssessment.checklistItems);
    }
    if (initialAssessment.theoryScore !== undefined && initialAssessment.theoryScore !== null) {
      setTheoryScore(Number(initialAssessment.theoryScore));
    }
  }, [initialAssessment]);

  // Client-side local storage synchronization
  useEffect(() => {
    const syncClientStorage = () => {
      const stored = getStoredAssessments();
      const match = stored.find((a) => String(a.id) === String(assessment.id));
      if (match) {
        setAssessment(match);
      }
    };

    window.addEventListener("cbcm-assessments-updated", syncClientStorage);
    return () => {
      window.removeEventListener("cbcm-assessments-updated", syncClientStorage);
    };
  }, [assessment.id]);

  // Evaluation Scale: 1 to 5 scale (maps to 20%, 40%, 60%, 80%, 100%)
  const [criteriaScores, setCriteriaScores] = useState<AssessmentCriterionScore[]>(
    initialAssessment.criteriaScores && initialAssessment.criteriaScores.length > 0
      ? initialAssessment.criteriaScores
      : [
          { criterion: "Aseptic Technique & Hand Hygiene", score: 80 },
          { criterion: "Clinical Patient Communication", score: 80 },
          { criterion: "Procedural Adherence & Safety", score: 80 },
        ]
  );

  const [theoryScore, setTheoryScore] = useState<number>(
    initialAssessment.theoryScore !== undefined && initialAssessment.theoryScore !== null
      ? Number(initialAssessment.theoryScore)
      : 85
  );

  const [checklist, setChecklist] = useState<AssessmentChecklistItem[]>(
    initialAssessment.checklistItems && initialAssessment.checklistItems.length > 0
      ? initialAssessment.checklistItems
      : [
          { item: "Patient Consent Obtained & Verified", checked: true },
          { item: "Baseline Vitals & Fetal Heart Sound Recorded", checked: true },
          { item: "Emergency Oxytocin Tray & Equipment Checked", checked: true },
          { item: "Post-procedure Patient Monitoring Documented", checked: initialAssessment.status === "PASS" },
        ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decision, setDecision] = useState<"PASS" | "NEEDS_REVIEW">("PASS");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Compute aggregate score
  const averageCriteriaPct = Math.round(
    criteriaScores.reduce((sum, c) => sum + Number(c.score || 0), 0) /
      (criteriaScores.length || 1)
  );
  const aggregateScore = Math.round((averageCriteriaPct + theoryScore) / 2);

  const handleCriterionRating = (index: number, rating1to5: number) => {
    const pct = rating1to5 * 20;
    setCriteriaScores((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], score: pct };
      return next;
    });
  };

  const handleToggleChecklist = (index: number) => {
    setChecklist((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], checked: !next[index].checked };
      return next;
    });
  };

  const handleSelectDifferentAssessment = (selectedId: string) => {
    if (!selectedId) return;
    router.push(`/my-assessments/${selectedId}`);
  };

  const handleSubmitEvaluation = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      // 1. Persist checklist items (POST /api/v1/assessments/:id/checklist-items)
      await setAssessmentChecklistItems(assessment.id, checklist);

      // 2. Persist criteria scores (POST /api/v1/assessments/:id/criteria-scores)
      await setAssessmentCriteriaScores(assessment.id, criteriaScores);

      // 3. Persist theory score (POST /api/v1/assessments/:id/theory-score)
      await setAssessmentTheoryScore(assessment.id, theoryScore);

      // 4. Finalize & Review endpoints
      if (decision === "PASS") {
        await finalizeAssessment(assessment.id);
        await reviewAssessment(
          assessment.id,
          feedbackText || "Clinical competency assessment passed by midwife preceptor.",
          aggregateScore
        );
      } else {
        await reviewAssessment(
          assessment.id,
          feedbackText || "Remediation recommended prior to competency sign-off.",
          aggregateScore
        );
      }

      // 5. Update local state & dispatch store update
      const updated = await updateAssessmentStatus(
        assessment.id,
        decision,
        aggregateScore,
        feedbackText || `Clinical evaluation submitted as ${decision}.`
      );

      if (updated) {
        setAssessment(updated);
      }

      setStatusMessage({
        type: "success",
        text: `Evaluation successfully submitted! Assessment marked as ${
          decision === "PASS" ? "Passed" : "Needs Remediation"
        }.`,
      });
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Evaluation submission failed:", err);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to submit evaluation.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Top Header & Assessment Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <span>Preceptor Clinical Assessment</span>
            <span>•</span>
            <span className="text-[#194611]">Active Evaluation</span>
          </div>

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

        {/* Right Selector & New Assessment Button */}
        <div className="flex flex-wrap items-center gap-3">
          {assessmentsList.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Candidate:</span>
              <select
                value={assessment.id}
                onChange={(e) => handleSelectDifferentAssessment(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-[#194611] shadow-2xs"
              >
                {assessmentsList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.menteeName} — {a.type}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            href="/my-assessments/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#194611] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#12330c] transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Task</span>
          </Link>

          {/* Aggregate Preview Banner */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-2 shadow-2xs">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#194611]">
              <Award className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[10px] font-semibold uppercase text-gray-500 leading-none">
                Score
              </div>
              <div className="text-base font-bold text-gray-900 leading-tight">
                {assessment.status === "PASS" && assessment.scorePct !== null
                  ? `${assessment.scorePct}%`
                  : `${aggregateScore}%`}
              </div>
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

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ======================================================== */}
        {/* LEFT COLUMN: EVIDENCE VIEWER (col-span-2)               */}
        {/* ======================================================== */}
        <div className="space-y-6 lg:col-span-2">
          {/* Candidate Profile Card */}
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
                      {assessment.menteeTitle}
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

          {/* Clinical Case & Instructions Card */}
          <Card className="border-gray-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#194611]" />
                Competency Scope & Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800 leading-relaxed border border-gray-100 whitespace-pre-wrap">
                {assessment.instructions ||
                  "Demonstrate clinical procedures, partograph interpretation, infection prevention protocols, and patient counseling according to CBCM standards."}
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

          {/* Submitted Evidence & Clinical Artifacts Card */}
          <Card className="border-gray-200 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-[#194611]" />
                Candidate Submitted Evidence & Attachments
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Direct procedural documentation, case sheets, partographs, or log records.
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
        {/* RIGHT COLUMN: STICKY EVALUATION PANEL (col-span-1)       */}
        {/* ======================================================== */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <Card className="border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-100 bg-gray-50/60 pb-3">
                <CardTitle className="text-base font-bold text-gray-900">
                  Evaluation Panel
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Preceptor evaluation workflow & scoring
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <Accordion type="single" defaultValue="item-1">
                  {/* ACCORDION ITEM 1: CHECKLIST */}
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4 text-[#194611]" />
                        <span>Step 1: Procedural Checklist</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-3 text-xs text-gray-500">
                        Verify bedside adherence to standard clinical protocols.
                      </p>
                      <div className="space-y-2.5">
                        {checklist.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleToggleChecklist(idx)}
                            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50/60 p-2.5 hover:bg-gray-100/80 transition"
                          >
                            <Checkbox
                              checked={item.checked}
                              className="mt-0.5"
                              readOnly
                            />
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
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* ACCORDION ITEM 2: CRITERIA SCORING */}
                  <AccordionItem value="item-2">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#194611]" />
                        <span>Step 2: Criteria Scoring</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-3 text-xs text-gray-500">
                        Score competencies on a 1 to 5 scale (1: Novice, 5: Mastered).
                      </p>
                      <div className="space-y-3.5">
                        {criteriaScores.map((c, idx) => {
                          const currentRating = Math.max(1, Math.round(c.score / 20));
                          return (
                            <div
                              key={idx}
                              className="rounded-lg border border-gray-100 bg-gray-50/60 p-3"
                            >
                              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-800">
                                <span>{c.criterion}</span>
                                <span className="text-[#194611] font-bold">
                                  {currentRating} / 5 ({c.score}%)
                                </span>
                              </div>
                              <div className="grid grid-cols-5 gap-1 pt-1">
                                {[1, 2, 3, 4, 5].map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleCriterionRating(idx, val)}
                                    className={cn(
                                      "py-1.5 text-xs font-bold rounded-md border transition cursor-pointer",
                                      currentRating === val
                                        ? "bg-[#194611] text-white border-[#194611] shadow-2xs"
                                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                                    )}
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Theory Knowledge Score */}
                        <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-800">
                            <span>Clinical Theory & Reasoning</span>
                            <span className="text-blue-800 font-bold">{theoryScore}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={theoryScore}
                            onChange={(e) => setTheoryScore(Number(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#194611]"
                          />
                          <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* ACCORDION ITEM 3: FINAL REVIEW & REMARKS */}
                  <AccordionItem value="item-3">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#194611]" />
                        <span>Step 3: Feedback & Decision</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2 text-xs text-gray-500">
                        Provide qualitative remarks, strengths, and clinical targets.
                      </p>
                      <Textarea
                        rows={3}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Clinical observations, areas of strength, and focus topics..."
                        className="text-xs"
                      />

                      <div className="mt-3 space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Evaluation Outcome
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDecision("PASS")}
                            className={cn(
                              "py-2 px-3 text-xs font-bold rounded-lg border transition text-center cursor-pointer",
                              decision === "PASS"
                                ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            Pass Candidate
                          </button>
                          <button
                            type="button"
                            onClick={() => setDecision("NEEDS_REVIEW")}
                            className={cn(
                              "py-2 px-3 text-xs font-bold rounded-lg border transition text-center cursor-pointer",
                              decision === "NEEDS_REVIEW"
                                ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            Needs Remediation
                          </button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>

              {/* ACTION FOOTER */}
              <CardFooter className="border-t border-gray-100 bg-gray-50/80 p-4">
                <Button
                  onClick={handleSubmitEvaluation}
                  disabled={isSubmitting}
                  className="w-full bg-[#194611] hover:bg-[#12330c] text-white font-semibold py-2.5 text-xs shadow-xs cursor-pointer"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Submitting Evaluation..." : "Submit Evaluation"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
