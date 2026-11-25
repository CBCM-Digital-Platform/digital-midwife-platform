"use client";

import React, { useState } from "react";
import { ModalWrapper } from "@/components/common/ModalWrapper";
import { Button } from "@/components/ui/button";
import { deleteAssessmentPassingRule, type EnrichedPassingRule } from "@/services/assessment-passing-rules.service";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface PassingRuleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: EnrichedPassingRule | null;
  onSuccess: (deletedRuleId: number) => void;
}

export function PassingRuleDeleteDialog({
  open,
  onOpenChange,
  rule,
  onSuccess,
}: PassingRuleDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!rule) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteAssessmentPassingRule(rule.id);
      onSuccess(rule.id);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to delete passing rule from backend.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="sm:max-w-[420px]"
      title={
        <div className="flex items-center gap-2 text-red-600">
          <Trash2 className="h-5 w-5" />
          <span>Deactivate Passing Rule</span>
        </div>
      }
      description="Are you sure you want to delete or deactivate this assessment passing rule?"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100 text-xs space-y-1.5">
          <p className="font-semibold text-gray-900">
            Rule #{rule.id}: {rule.cycleName || `Cycle #${rule.cycle_id}`}
          </p>
          <p className="text-gray-600">
            Domain: {rule.thematicAreaCode ? `[${rule.thematicAreaCode}] ` : ""}
            {rule.thematicAreaName || `Domain #${rule.thematic_area_id}`}
          </p>
          <div className="flex items-center gap-3 text-gray-500 pt-1">
            <span>Criteria: {rule.criteria_min_score}%</span>
            <span>Theory: {rule.theory_min_score}%</span>
            <span>Practical: {rule.practical_min_score}%</span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Deactivating this rule removes its score threshold requirements from future assessment evaluations.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-9 text-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Deactivating...
              </>
            ) : (
              "Deactivate Rule"
            )}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
