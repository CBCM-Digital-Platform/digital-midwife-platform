"use client";

import React, { useState, useEffect } from "react";
import { ModalWrapper } from "@/components/common/ModalWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  createAssessmentPassingRule,
  updateAssessmentPassingRule,
  type AssessmentPassingRule,
  type EnrichedPassingRule,
} from "@/services/assessment-passing-rules.service";
import { SlidersHorizontal, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PassingRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: EnrichedPassingRule | null;
  cycles: Array<{ id: number; name: string }>;
  thematicAreas: Array<{ id: number; name: string; code: string }>;
  onSuccess: (savedRule: AssessmentPassingRule) => void;
}

export function PassingRuleFormDialog({
  open,
  onOpenChange,
  rule,
  cycles,
  thematicAreas,
  onSuccess,
}: PassingRuleFormDialogProps) {
  const isEditing = Boolean(rule);

  const [cycleId, setCycleId] = useState<string>("");
  const [cycleError, setCycleError] = useState<string | null>(null);

  const [thematicAreaId, setThematicAreaId] = useState<string>("");
  const [thematicAreaError, setThematicAreaError] = useState<string | null>(null);

  const [preTestThreshold, setPreTestThreshold] = useState<string>("70");
  const [preTestError, setPreTestError] = useState<string | null>(null);

  const [postTestThreshold, setPostTestThreshold] = useState<string>("75");
  const [postTestError, setPostTestError] = useState<string | null>(null);

  const [practicalThreshold, setPracticalThreshold] = useState<string>("3");
  const [practicalError, setPracticalError] = useState<string | null>(null);

  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (rule) {
      setCycleId(rule.cycle_id ? String(rule.cycle_id) : "");
      setThematicAreaId(rule.thematic_area_id ? String(rule.thematic_area_id) : "");
      setPreTestThreshold(String(rule.pre_test_threshold ?? rule.criteria_min_score ?? 70));
      setPostTestThreshold(String(rule.post_test_threshold ?? rule.theory_min_score ?? 75));
      setPracticalThreshold(String(rule.practical_threshold ?? rule.practical_min_score ?? 3));
      setIsActive(rule.is_active !== undefined ? rule.is_active : true);
    } else {
      setCycleId((prev) => prev || (cycles.length > 0 ? String(cycles[0].id) : ""));
      setThematicAreaId((prev) => prev || (thematicAreas.length > 0 ? String(thematicAreas[0].id) : ""));
      setPreTestThreshold("70");
      setPostTestThreshold("75");
      setPracticalThreshold("3");
      setIsActive(true);
    }
    setCycleError(null);
    setThematicAreaError(null);
    setPreTestError(null);
    setPostTestError(null);
    setPracticalError(null);
    setServerError(null);
  }, [open, rule]);

  const validateScore = (val: string, name: string): { valid: boolean; num: number; error?: string } => {
    const num = Number(val);
    if (val.trim() === "" || Number.isNaN(num)) {
      return { valid: false, num: 0, error: `${name} is required and must be a number.` };
    }
    if (num < 0 || num > 100) {
      return { valid: false, num, error: `${name} must be between 0 and 100.` };
    }
    return { valid: true, num };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    let hasError = false;

    const numCycleId = Number(cycleId);
    if (!cycleId || Number.isNaN(numCycleId) || numCycleId <= 0) {
      setCycleError("Please select a mentorship cycle.");
      hasError = true;
    } else {
      setCycleError(null);
    }

    const numThematicId = Number(thematicAreaId);
    if (!thematicAreaId || Number.isNaN(numThematicId) || numThematicId <= 0) {
      setThematicAreaError("Please select a thematic area domain.");
      hasError = true;
    } else {
      setThematicAreaError(null);
    }

    const preTestRes = validateScore(preTestThreshold, "Pre-test threshold score");
    if (!preTestRes.valid) {
      setPreTestError(preTestRes.error || null);
      hasError = true;
    } else {
      setPreTestError(null);
    }

    const postTestRes = validateScore(postTestThreshold, "Post-test theory threshold score");
    if (!postTestRes.valid) {
      setPostTestError(postTestRes.error || null);
      hasError = true;
    } else {
      setPostTestError(null);
    }

    const numPractical = Number(practicalThreshold);
    let practicalValidNum = 3;
    if (
      practicalThreshold.trim() === "" ||
      Number.isNaN(numPractical) ||
      !Number.isInteger(numPractical) ||
      numPractical < 1 ||
      numPractical > 5
    ) {
      setPracticalError("Practical threshold (practical_threshold) must be an integer between 1 and 5.");
      hasError = true;
    } else {
      setPracticalError(null);
      practicalValidNum = numPractical;
    }

    if (hasError) return;

    setIsSubmitting(true);

    try {
      let saved: AssessmentPassingRule;
      if (isEditing && rule) {
        saved = await updateAssessmentPassingRule(rule.id, {
          cycle_id: numCycleId,
          thematic_area_id: numThematicId,
          pre_test_threshold: preTestRes.num,
          post_test_threshold: postTestRes.num,
          practical_threshold: practicalValidNum,
          is_active: isActive,
        });
      } else {
        saved = await createAssessmentPassingRule({
          cycle_id: numCycleId,
          thematic_area_id: numThematicId,
          pre_test_threshold: preTestRes.num,
          post_test_threshold: postTestRes.num,
          practical_threshold: practicalValidNum,
          is_active: isActive,
        });
      }

      onSuccess(saved);
      onOpenChange(false);
    } catch (err: any) {
      setServerError(err?.message || "Failed to save assessment passing rule to backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="sm:max-w-[520px]"
      title={
        <div className="flex items-center gap-2 text-[#194611]">
          <SlidersHorizontal className="h-5 w-5" />
          <span>{isEditing ? "Edit Assessment Passing Rule" : "Configure Assessment Passing Rule"}</span>
        </div>
      }
      description={
        isEditing
          ? `Update score threshold criteria for Passing Rule #${rule?.id}.`
          : "Define minimum percentage thresholds for competency criteria, theory examination, and practical clinical OSCE."
      }
    >
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        {serverError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold">Backend Error</p>
              <p className="mt-0.5 text-red-700">{serverError}</p>
            </div>
            <button
              type="button"
              onClick={() => setServerError(null)}
              className="text-red-500 hover:text-red-800 transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Mentorship Cycle */}
        <div className="space-y-1.5">
          <Label htmlFor="rule-cycle" className="block text-xs font-semibold text-gray-700">
            Mentorship Cycle <span className="text-red-500">*</span>
          </Label>
          <select
            id="rule-cycle"
            value={cycleId}
            onChange={(e) => {
              setCycleId(e.target.value);
              if (cycleError) setCycleError(null);
            }}
            required
            className={cn(
              "w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent cursor-pointer",
              cycleError && "border-red-500 focus:ring-red-500"
            )}
          >
            <option value="">Select mentorship cycle...</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {cycleError && (
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{cycleError}</span>
            </p>
          )}
        </div>

        {/* Thematic Area Domain */}
        <div className="space-y-1.5">
          <Label htmlFor="rule-thematic-area" className="block text-xs font-semibold text-gray-700">
            Clinical Domain / Thematic Area <span className="text-red-500">*</span>
          </Label>
          <select
            id="rule-thematic-area"
            value={thematicAreaId}
            onChange={(e) => {
              setThematicAreaId(e.target.value);
              if (thematicAreaError) setThematicAreaError(null);
            }}
            required
            className={cn(
              "w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent cursor-pointer",
              thematicAreaError && "border-red-500 focus:ring-red-500"
            )}
          >
            <option value="">Select thematic domain...</option>
            {thematicAreas.map((ta) => (
              <option key={ta.id} value={ta.id}>
                [{ta.code}] {ta.name}
              </option>
            ))}
          </select>
          {thematicAreaError && (
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{thematicAreaError}</span>
            </p>
          )}
        </div>

        {/* Score Thresholds Grid */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Passing Thresholds (Pre-Test & Post-Test Theory: 0–100%, Practical OSCE: Level 1–5)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Pre-Test Threshold */}
            <div>
              <Label htmlFor="rule-pretest" className="block text-[11px] font-medium text-gray-600 mb-1">
                Pre-Test Threshold (%)
              </Label>
              <Input
                id="rule-pretest"
                type="number"
                min="0"
                max="100"
                step="1"
                value={preTestThreshold}
                onChange={(e) => {
                  setPreTestThreshold(e.target.value);
                  if (preTestError) setPreTestError(null);
                }}
                required
                className={cn("h-9 text-sm", preTestError && "border-red-500 focus-visible:ring-red-500")}
              />
              {preTestError && (
                <p className="text-[10px] text-red-600 mt-1">{preTestError}</p>
              )}
            </div>

            {/* Post-Test Theory Threshold */}
            <div>
              <Label htmlFor="rule-posttest" className="block text-[11px] font-medium text-gray-600 mb-1">
                Post-Test Theory (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rule-posttest"
                type="number"
                min="0"
                max="100"
                step="1"
                value={postTestThreshold}
                onChange={(e) => {
                  setPostTestThreshold(e.target.value);
                  if (postTestError) setPostTestError(null);
                }}
                required
                className={cn("h-9 text-sm", postTestError && "border-red-500 focus-visible:ring-red-500")}
              />
              {postTestError && (
                <p className="text-[10px] text-red-600 mt-1">{postTestError}</p>
              )}
            </div>

            {/* Practical Threshold (Scale 1 - 5) */}
            <div>
              <Label htmlFor="rule-practical" className="block text-[11px] font-medium text-gray-600 mb-1">
                Practical OSCE Min (1 - 5) <span className="text-red-500">*</span>
              </Label>
              <select
                id="rule-practical"
                value={practicalThreshold}
                onChange={(e) => {
                  setPracticalThreshold(e.target.value);
                  if (practicalError) setPracticalError(null);
                }}
                required
                className={cn(
                  "w-full h-9 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent cursor-pointer",
                  practicalError && "border-red-500 focus:ring-red-500"
                )}
              >
                <option value="1">Level 1 (Novice)</option>
                <option value="2">Level 2 (Advanced Beginner)</option>
                <option value="3">Level 3 (Competent — Benchmark)</option>
                <option value="4">Level 4 (Proficient)</option>
                <option value="5">Level 5 (Master / Expert)</option>
              </select>
              {practicalError && (
                <p className="text-[10px] text-red-600 mt-1">{practicalError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Rule Active Status */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <div>
            <Label htmlFor="rule-active" className="text-xs font-semibold text-gray-800 block cursor-pointer">
              Active Rule Status
            </Label>
            <p className="text-[11px] text-gray-500">
              When active, clinical evaluations will strictly apply these passing benchmarks.
            </p>
          </div>
          <input
            id="rule-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#194611] focus:ring-[#194611] cursor-pointer"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-9 text-xs bg-[#194611] hover:bg-[#12330c] text-white font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving Rule...
              </>
            ) : isEditing ? (
              "Update Passing Rule"
            ) : (
              "Save Passing Rule"
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
}
