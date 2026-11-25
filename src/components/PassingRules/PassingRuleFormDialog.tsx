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

  const [criteriaMinScore, setCriteriaMinScore] = useState<string>("70");
  const [criteriaError, setCriteriaError] = useState<string | null>(null);

  const [theoryMinScore, setTheoryMinScore] = useState<string>("75");
  const [theoryError, setTheoryError] = useState<string | null>(null);

  const [practicalMinScore, setPracticalMinScore] = useState<string>("75");
  const [practicalError, setPracticalError] = useState<string | null>(null);

  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (rule) {
      setCycleId(rule.cycle_id ? String(rule.cycle_id) : "");
      setThematicAreaId(rule.thematic_area_id ? String(rule.thematic_area_id) : "");
      setCriteriaMinScore(String(rule.criteria_min_score ?? 70));
      setTheoryMinScore(String(rule.theory_min_score ?? 75));
      setPracticalMinScore(String(rule.practical_min_score ?? 75));
      setIsActive(rule.is_active !== undefined ? rule.is_active : true);
    } else {
      setCycleId(cycles.length > 0 ? String(cycles[0].id) : "");
      setThematicAreaId(thematicAreas.length > 0 ? String(thematicAreas[0].id) : "");
      setCriteriaMinScore("70");
      setTheoryMinScore("75");
      setPracticalMinScore("75");
      setIsActive(true);
    }
    setCycleError(null);
    setThematicAreaError(null);
    setCriteriaError(null);
    setTheoryError(null);
    setPracticalError(null);
    setServerError(null);
  }, [rule, open, cycles, thematicAreas]);

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

    const criteriaRes = validateScore(criteriaMinScore, "Criteria minimum score");
    if (!criteriaRes.valid) {
      setCriteriaError(criteriaRes.error || null);
      hasError = true;
    } else {
      setCriteriaError(null);
    }

    const theoryRes = validateScore(theoryMinScore, "Theory minimum score");
    if (!theoryRes.valid) {
      setTheoryError(theoryRes.error || null);
      hasError = true;
    } else {
      setTheoryError(null);
    }

    const practicalRes = validateScore(practicalMinScore, "Practical minimum score");
    if (!practicalRes.valid) {
      setPracticalError(practicalRes.error || null);
      hasError = true;
    } else {
      setPracticalError(null);
    }

    if (hasError) return;

    setIsSubmitting(true);

    try {
      let saved: AssessmentPassingRule;
      if (isEditing && rule) {
        saved = await updateAssessmentPassingRule(rule.id, {
          cycle_id: numCycleId,
          thematic_area_id: numThematicId,
          criteria_min_score: criteriaRes.num,
          theory_min_score: theoryRes.num,
          practical_min_score: practicalRes.num,
          is_active: isActive,
        });
      } else {
        saved = await createAssessmentPassingRule({
          cycle_id: numCycleId,
          thematic_area_id: numThematicId,
          criteria_min_score: criteriaRes.num,
          theory_min_score: theoryRes.num,
          practical_min_score: practicalRes.num,
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
          <p className="text-xs font-semibold text-gray-700 mb-2">Passing Thresholds (0 - 100%)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Criteria Min Score */}
            <div>
              <Label htmlFor="rule-criteria" className="block text-[11px] font-medium text-gray-600 mb-1">
                Criteria Min Score (%)
              </Label>
              <Input
                id="rule-criteria"
                type="number"
                min="0"
                max="100"
                step="1"
                value={criteriaMinScore}
                onChange={(e) => {
                  setCriteriaMinScore(e.target.value);
                  if (criteriaError) setCriteriaError(null);
                }}
                required
                className={cn("h-9 text-sm", criteriaError && "border-red-500 focus-visible:ring-red-500")}
              />
              {criteriaError && (
                <p className="text-[10px] text-red-600 mt-1">{criteriaError}</p>
              )}
            </div>

            {/* Theory Min Score */}
            <div>
              <Label htmlFor="rule-theory" className="block text-[11px] font-medium text-gray-600 mb-1">
                Theory Min Score (%)
              </Label>
              <Input
                id="rule-theory"
                type="number"
                min="0"
                max="100"
                step="1"
                value={theoryMinScore}
                onChange={(e) => {
                  setTheoryMinScore(e.target.value);
                  if (theoryError) setTheoryError(null);
                }}
                required
                className={cn("h-9 text-sm", theoryError && "border-red-500 focus-visible:ring-red-500")}
              />
              {theoryError && (
                <p className="text-[10px] text-red-600 mt-1">{theoryError}</p>
              )}
            </div>

            {/* Practical Min Score */}
            <div>
              <Label htmlFor="rule-practical" className="block text-[11px] font-medium text-gray-600 mb-1">
                Practical OSCE Min (%)
              </Label>
              <Input
                id="rule-practical"
                type="number"
                min="0"
                max="100"
                step="1"
                value={practicalMinScore}
                onChange={(e) => {
                  setPracticalMinScore(e.target.value);
                  if (practicalError) setPracticalError(null);
                }}
                required
                className={cn("h-9 text-sm", practicalError && "border-red-500 focus-visible:ring-red-500")}
              />
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
