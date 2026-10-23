"use client";

import React, { useState } from "react";
import { ModalWrapper } from "@/components/common/ModalWrapper";
import { Button } from "@/components/ui/button";
import { updateThematicAreaStatus } from "@/services/thematic-areas.service";
import type { ThematicArea, ThematicAreaStatus } from "@/types/thematic-area";
import {
  Layers,
  Award,
  BookOpen,
  Users,
  Calendar,
  Loader2,
  ShieldCheck,
  AlertCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThematicAreaDetailDialogProps {
  thematicArea: ThematicArea | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChanged: (areaId: string, newStatus: ThematicAreaStatus) => void;
  onEditClick: (area: ThematicArea) => void;
}

export function ThematicAreaDetailDialog({
  thematicArea,
  open,
  onOpenChange,
  onStatusChanged,
  onEditClick,
}: ThematicAreaDetailDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!thematicArea) return null;

  const handleStatusChange = async (targetStatus: ThematicAreaStatus) => {
    try {
      setIsUpdating(true);
      setErrorMsg(null);
      const res = await updateThematicAreaStatus(thematicArea.id, targetStatus);
      if (res.success) {
        onStatusChanged(thematicArea.id, targetStatus);
        onOpenChange(false);
      } else {
        setErrorMsg(res.message || "Failed to update status.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadgeColor =
    thematicArea.status === "active"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : thematicArea.status === "under_review"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <ModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#194611]" />
          <span>Thematic Area Profile</span>
        </div>
      }
      description={`Area Code: ${thematicArea.code} • National Clinical Mentorship Curriculum`}
      maxWidth="sm:max-w-[560px]"
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Header Card */}
        <div className="flex items-start justify-between gap-3 p-4 rounded-xl bg-gray-50/75 border border-gray-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#194611] text-[#FDD028]">
                {thematicArea.code}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize",
                  statusBadgeColor
                )}
              >
                {thematicArea.status.replace("_", " ")}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 leading-snug pt-0.5">
              {thematicArea.name}
            </h3>
            <p className="text-xs text-gray-500">{thematicArea.category}</p>
          </div>
        </div>

        {/* Clinical Competencies Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-lg border border-gray-100 bg-white">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Award className="h-3.5 w-3.5 text-[#194611]" />
              Competencies
            </div>
            <div className="text-base font-bold text-gray-900 mt-1">
              {thematicArea.competenciesCount || 12} Skills
            </div>
          </div>

          <div className="p-3 rounded-lg border border-gray-100 bg-white">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <BookOpen className="h-3.5 w-3.5 text-[#194611]" />
              Learning Units
            </div>
            <div className="text-base font-bold text-gray-900 mt-1">
              {thematicArea.modulesCount || 3} Modules
            </div>
          </div>

          <div className="p-3 rounded-lg border border-gray-100 bg-white col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              Accredited Since
            </div>
            <div className="text-xs font-semibold text-gray-900 mt-1 truncate">
              {new Date(thematicArea.createdAt || Date.now()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })}
            </div>
          </div>
        </div>

        {/* Applicable Cadres */}
        {thematicArea.targetCadres && thematicArea.targetCadres.length > 0 && (
          <div className="p-3.5 rounded-xl border border-gray-100 bg-white space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Users className="h-3.5 w-3.5 text-[#194611]" />
              <span>Target Clinician Cadres</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {thematicArea.targetCadres.map((cadre) => (
                <span
                  key={cadre}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100"
                >
                  {cadre}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Scope / Description */}
        <div className="p-3.5 rounded-xl border border-gray-100 bg-white space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <FileText className="h-3.5 w-3.5 text-gray-400" />
            <span>Clinical Scope & Objectives</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            {thematicArea.description ||
              "Standard Ministry of Health clinical mentorship domain for clinical midwives and adolescent care preceptors."}
          </p>
        </div>

        {/* Status Actions */}
        <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
          <div className="text-xs font-semibold text-gray-700">Operational Actions</div>
          <div className="flex flex-wrap items-center gap-2">
            {thematicArea.status !== "active" && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleStatusChange("active")}
                disabled={isUpdating}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <ShieldCheck className="h-3 w-3 mr-1" />
                )}
                Activate Domain
              </Button>
            )}

            {thematicArea.status !== "under_review" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("under_review")}
                disabled={isUpdating}
                className="h-8 text-xs text-amber-700 border-amber-300 hover:bg-amber-50 cursor-pointer"
              >
                Set Under Review
              </Button>
            )}

            {thematicArea.status !== "inactive" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("inactive")}
                disabled={isUpdating}
                className="h-8 text-xs text-gray-700 border-gray-300 hover:bg-gray-100 cursor-pointer"
              >
                Archive Area
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onEditClick(thematicArea);
              }}
              className="h-8 text-xs border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer ml-auto"
            >
              Edit Details
            </Button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
