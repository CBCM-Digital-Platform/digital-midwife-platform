"use client";

import React, { useState, useEffect } from "react";
import { ModalWrapper } from "@/components/common/ModalWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  createThematicArea,
  updateThematicArea,
  THEMATIC_CATEGORIES,
  TARGET_CADRES_OPTIONS,
} from "@/services/thematic-areas.service";
import type { ThematicArea, ThematicAreaStatus } from "@/types/thematic-area";
import { Layers, Check, Loader2, AlertCircle, X } from "lucide-react";

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
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [targetCadres, setTargetCadres] = useState<string[]>([]);
  const [status, setStatus] = useState<ThematicAreaStatus | "">("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (thematicArea) {
      setCode(thematicArea.code || "");
      setName(thematicArea.name || "");
      setCategory(thematicArea.category || "");
      setDescription(thematicArea.description || "");
      setTargetCadres(thematicArea.targetCadres || []);
      setStatus(thematicArea.status || "active");
    } else {
      setCode("");
      setName("");
      setCategory("");
      setDescription("");
      setTargetCadres(["Midwife Mentors", "Junior Midwives"]);
      setStatus("");
    }
    setError(null);
  }, [thematicArea, open]);

  const handleCadreToggle = (cadre: string) => {
    setTargetCadres((prev) =>
      prev.includes(cadre) ? prev.filter((c) => c !== cadre) : [...prev, cadre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setError("Thematic area code is required.");
      return;
    }
    if (!trimmedName) {
      setError("Thematic area title is required.");
      return;
    }
    if (!category) {
      setError("Please select a clinical category/domain.");
      return;
    }
    if (!status) {
      setError("Please select an operational status.");
      return;
    }

    // Check duplicate code
    const duplicateCode = existingAreas.find(
      (a) =>
        a.id !== thematicArea?.id &&
        a.code.trim().toUpperCase() === trimmedCode
    );
    if (duplicateCode) {
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
          category,
          description: description.trim() || undefined,
          targetCadres,
          status: status as ThematicAreaStatus,
        });
      } else {
        result = await createThematicArea({
          code: trimmedCode,
          name: trimmedName,
          category,
          description: description.trim() || undefined,
          targetCadres,
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
      maxWidth="sm:max-w-[580px]"
      title={
        <div className="flex items-center gap-2 text-[#194611]">
          <Layers className="h-5 w-5" />
          <span>{isEditing ? "Edit Thematic Area" : "Add Clinical Thematic Area"}</span>
        </div>
      }
      description={
        isEditing
          ? "Update clinical competencies, scope, and accreditation status for this domain."
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

        {/* Code & Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="area-code" className="block text-xs font-semibold text-gray-700 mb-1">
              Area Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="area-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              autoComplete="off"
              className="h-9 text-sm font-mono uppercase font-semibold"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="area-category" className="block text-xs font-semibold text-gray-700 mb-1">
              Clinical Domain / Category <span className="text-red-500">*</span>
            </Label>
            <select
              id="area-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent cursor-pointer"
            >
              <option value="">Select clinical domain...</option>
              {THEMATIC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Thematic Area Title */}
        <div className="space-y-1.5">
          <Label htmlFor="area-name" className="text-xs font-semibold text-gray-700">
            Thematic Area Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="area-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="off"
            className="h-9 text-sm"
          />
        </div>

        {/* Operational Status */}
        <div className="space-y-1.5">
          <Label htmlFor="area-status" className="text-xs font-semibold text-gray-700">
            Operational Status <span className="text-red-500">*</span>
          </Label>
          <select
            id="area-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ThematicAreaStatus)}
            required
            className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent cursor-pointer"
          >
            <option value="">Select operational status...</option>
            <option value="active">Active (Available for All Cohorts)</option>
            <option value="under_review">Under Review (Curriculum Revision)</option>
            <option value="inactive">Inactive (Archived)</option>
          </select>
        </div>

        {/* Target Midwifery Cadres */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <Label className="text-xs font-semibold text-gray-700 block">
            Applicable Clinician Cadres
          </Label>
          <div className="flex flex-wrap gap-2 pt-1">
            {TARGET_CADRES_OPTIONS.map((cadre) => {
              const selected = targetCadres.includes(cadre);
              return (
                <button
                  type="button"
                  key={cadre}
                  onClick={() => handleCadreToggle(cadre)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                    selected
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {selected && <Check className="h-3 w-3 text-emerald-700" />}
                  <span>{cadre}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description / Clinical Scope */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <Label htmlFor="area-description" className="text-xs font-semibold text-gray-700">
            Curriculum Scope & Clinical Competencies Overview
          </Label>
          <textarea
            id="area-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent leading-relaxed"
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
