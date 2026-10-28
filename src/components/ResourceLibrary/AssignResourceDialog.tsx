"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { AdminResource } from "@/types/resource";
import type { MentorUser } from "@/types/user";
import { getMentors } from "@/services/users.service";
import { assignResourceToMentor } from "@/services/resources.service";
import {
  UserPlus,
  FileText,
  Video,
  Link2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
} from "lucide-react";

interface AssignResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: AdminResource | null;
  availableMentors?: MentorUser[];
  onAssigned: (resourceTitle: string, mentorName: string) => void;
  onAssignFailed?: (resourceTitle: string, errorMessage: string) => void;
}

export function AssignResourceDialog({
  open,
  onOpenChange,
  resource,
  availableMentors,
  onAssigned,
  onAssignFailed,
}: AssignResourceDialogProps) {
  const [mentors, setMentors] = useState<MentorUser[]>(availableMentors || []);
  const [isLoadingMentors, setIsLoadingMentors] = useState<boolean>(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  // Fetch real mentors from database on dialog open if not already provided
  // Uses hasFetchedRef to avoid infinite fetch loops on re-render
  useEffect(() => {
    if (open) {
      setSelectedMentorId("");
      setInstructions("");
      setError(null);
      setSuccessMessage(null);

      if (availableMentors && availableMentors.length > 0) {
        setMentors(availableMentors);
      } else if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;
        setIsLoadingMentors(true);
        getMentors()
          .then((fetched) => {
            setMentors(fetched || []);
          })
          .catch((err) => {
            console.warn("Failed to fetch database mentors for facility:", err);
            setMentors([]);
          })
          .finally(() => {
            setIsLoadingMentors(false);
          });
      }
    } else {
      hasFetchedRef.current = false;
      setIsSubmitting(false);
      setError(null);
      setSuccessMessage(null);
    }
  }, [open, availableMentors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource || isSubmitting) return; // Immediate double-submission prevention
    if (!selectedMentorId) {
      setError("Please select a mentor to assign this resource to.");
      return;
    }

    const mentor = mentors.find((m) => String(m.id) === String(selectedMentorId));
    const mentorName = mentor ? mentor.name : "Selected Mentor";

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await assignResourceToMentor(
        resource.id,
        [selectedMentorId],
        undefined,
        instructions?.trim() || undefined
      );

      const successText = `"${resource?.title || "Clinical Resource"}" was successfully assigned to ${mentorName}.`;
      setSuccessMessage(successText);
      onAssigned(resource?.title || "Clinical Resource", mentorName);

      // Brief delay to allow user to view the confirmation state before closing dialog
      setTimeout(() => {
        onOpenChange(false);
      }, 700);
    } catch (err: any) {
      console.warn("Live assignment error:", err);
      const msg =
        err?.message ||
        err?.data?.error?.message ||
        "Failed to assign resource on the server. Please try again.";
      setError(msg);
      if (onAssignFailed) {
        onAssignFailed(resource?.title || "Clinical Resource", msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!resource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[500px] p-0 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 bg-gray-50/90 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#194611] flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Assign Resource to Mentor
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Delegate learning materials and clinical guides to facility preceptors.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Selected Resource Preview */}
        <div className="px-5 sm:px-6 pt-5">
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 text-[#194611] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              {resource.type === "video" ? (
                <Video className="w-4 h-4 text-indigo-600" />
              ) : resource.type === "link" ? (
                <Link2 className="w-4 h-4 text-amber-600" />
              ) : (
                <FileText className="w-4 h-4 text-[#194611]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">
                {resource.title}
              </p>
              <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                {resource.description || "Master clinical guideline module."}
              </p>
              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200">
                {resource.type}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:px-6 space-y-4">
          {/* Success Confirmation Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in-0 duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">Assignment Successful</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Failure Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in-0 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Assignment Failed</p>
                <p className="text-[11px] text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Real Database Mentors Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="mentor-select" className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span>Select Facility Mentor <span className="text-red-500">*</span></span>
              {isLoadingMentors && (
                <span className="text-[11px] text-gray-400 inline-flex items-center gap-1 font-normal">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading facility mentors...
                </span>
              )}
            </Label>

            {isLoadingMentors ? (
              <div className="h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center text-xs text-gray-400">
                Fetching facility mentors from database...
              </div>
            ) : mentors.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold">No mentors registered in this facility</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    There are no certified mentors assigned to this facility yet. Add mentors to the facility first before assigning resources.
                  </p>
                </div>
              </div>
            ) : (
              <select
                id="mentor-select"
                value={selectedMentorId}
                onChange={(e) => {
                  setSelectedMentorId(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting || Boolean(successMessage)} className="w-full h-10 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 font-medium transition focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  -- Choose a mentor ({mentors.length} available) --
                </option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.profession ? `— ${m.profession}` : ""} {m.department ? `(${m.department})` : ""}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-gray-400">
              Only active mentors registered in this facility are displayed.
            </p>
          </div>

          {/* Instructions / Notes (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="mentor-notes" className="text-xs font-semibold text-gray-700">
              Clinical Instructions / Note for Mentor (Optional)
            </Label>
            <textarea
              id="mentor-notes"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Please review this protocol with your cohort ahead of next Tuesday's labor ward clinical drill..."
              disabled={isSubmitting || Boolean(successMessage)} className="w-full p-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 text-xs font-medium rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || mentors.length === 0 || !selectedMentorId || Boolean(successMessage)}
              className="h-10 px-5 text-xs font-semibold rounded-xl bg-[#194611] hover:bg-[#14380e] text-white shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FDD028]" />
                  <span>Assigning...</span>
                </>
              ) : successMessage ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#FDD028]" />
                  <span>Assigned!</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-[#FDD028]" />
                  <span>Assign to Mentor</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
