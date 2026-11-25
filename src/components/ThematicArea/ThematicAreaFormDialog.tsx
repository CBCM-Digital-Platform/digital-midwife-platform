"use client";

import React, { useState, useEffect } from "react";
import { ModalWrapper } from "@/components/common/ModalWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  createThematicArea,
  updateThematicArea,
} from "@/services/thematic-areas.service";
import type { ThematicArea, ThematicAreaStatus } from "@/types/thematic-area";
import { Layers, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateName } from "@/lib/validators";

interface ThematicAreaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thematicArea?: ThematicArea | null;
  existingAreas?: ThematicArea[];
  onSuccess: (area: ThematicArea) => void;
}

export function ThematicAreaFormDialog({
  open,
  onOpenChange,
  thematicArea,
  existingAreas = [],
  onSuccess,
}: ThematicAreaFormDialogProps) {
  const isEditing = Boolean(thematicArea);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [status, setStatus] = useState<ThematicAreaStatus | "">("");
  const [statusError, setStatusError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (thematicArea) {
      setCode(thematicArea.code || "");
      setName(thematicArea.name || "");
      setStatus(thematicArea.status || "active");
    } else {
      setCode("");
      setName("");
      setStatus("");
    }
    setCodeError(null);
    setNameError(null);
    setStatusError(null);
    setError(null);
  }, [thematicArea, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    // 1. Validate Code
    let codeErr: string | null = null;
    if (!trimmedCode) {
      codeErr = "Thematic area code is required.";
    } else if (!/^[A-Z0-9\-_]{2,15}$/.test(trimmedCode)) {
      codeErr = "Code must be 2-15 uppercase alphanumeric characters (hyphens allowed).";
    }
    setCodeError(codeErr);

    // 2. Validate Name
    const nameRes = validateName(trimmedName, "Thematic area title", 3, true);
    setNameError(nameRes.error || null);

    // 3. Validate Status
    const statErr = !status ? "Please select an operational status." : null;
    setStatusError(statErr);

    if (codeErr || !nameRes.valid || statErr) {
      setError(codeErr || nameRes.error || statErr || "Please fix highlighted validation errors.");
      return;
    }

    // Check duplicate code
    const duplicateCode = existingAreas.find(
      (a) =>
        a.id !== thematicArea?.id &&
        a.code.trim().toUpperCase() === trimmedCode
    );
    if (duplicateCode) {
      setCodeError(`Code "${trimmedCode}" is already in use by "${duplicateCode.name}".`);
      setError(`Code "${trimmedCode}" is already in use by "${duplicateCode.name}".`);
      return;
    }

    // Check duplicate name
    const duplicateName = existingAreas.find(
      (a) =>
        a.id !== thematicArea?.id &&
        a.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateName) {
      setNameError(`A thematic area with title "${trimmedName}" already exists.`);
      setError(`A thematic area with title "${trimmedName}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let result: ThematicArea;
      if (isEditing && thematicArea) {
        result = await updateThematicArea(thematicArea.id, {
          code: trimmedCode,
          name: trimmedName,
          status: status as ThematicAreaStatus,
        });
      } else {
        result = await createThematicArea({
          code: trimmedCode,
          name: trimmedName,
          status: status as ThematicAreaStatus,
        });
      }

      onSuccess(result);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save thematic area. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="sm:max-w-[480px]"
      title={
        <div className="flex items-center gap-2 text-[#194611]">
          <Layers className="h-5 w-5" />
          <span>{isEditing ? "Edit Thematic Area" : "Add Clinical Thematic Area"}</span>
        </div>
      }
      description={
        isEditing
          ? "Update the code, title, and operational status for this clinical domain."
          : "Define an accredited clinical health domain to organize mentorship modules and competency evaluations."
      }
    >
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold">Validation Error</p>
              <p className="mt-0.5 text-red-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-800 transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Code */}
        <div className="space-y-1.5">
          <Label htmlFor="area-code" className="block text-xs font-semibold text-gray-700">
            Area Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="area-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (codeError) setCodeError(null);
            }}
            required
            autoComplete="off"
            placeholder="e.g. EMONC"
            className={cn(
              "h-9 text-sm font-mono uppercase font-semibold",
              codeError && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {codeError && (
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{codeError}</span>
            </p>
          )}
        </div>

        {/* Thematic Area Title */}
        <div className="space-y-1.5">
          <Label htmlFor="area-name" className="text-xs font-semibold text-gray-700">
            Thematic Area Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="area-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            required
            autoComplete="off"
            placeholder="e.g. Emergency Obstetric & Newborn Care"
            className={cn("h-9 text-sm", nameError && "border-red-500 focus-visible:ring-red-500")}
          />
          {nameError && (
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{nameError}</span>
            </p>
          )}
        </div>

        {/* Operational Status */}
        <div className="space-y-1.5">
          <Label htmlFor="area-status" className="text-xs font-semibold text-gray-700">
            Operational Status <span className="text-red-500">*</span>
          </Label>
          <select
            id="area-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ThematicAreaStatus);
              if (statusError) setStatusError(null);
            }}
            required
            className={cn(
              "w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent cursor-pointer",
              statusError && "border-red-500 focus:ring-red-500"
            )}
          >
            <option value="">Select operational status...</option>
            <option value="active">Active (Available for All Cohorts)</option>
            <option value="under_review">Under Review (Curriculum Revision)</option>
            <option value="inactive">Inactive (Archived)</option>
          </select>
          {statusError && (
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{statusError}</span>
            </p>
          )}
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
                Saving Thematic Area...
              </>
            ) : isEditing ? (
              "Update Thematic Area"
            ) : (
              "Add Thematic Area"
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
}
