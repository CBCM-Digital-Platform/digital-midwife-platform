"use client";

import React, { useState, useEffect } from "react";
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
import {
  UserPlus,
  FileText,
  Video,
  Link2,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";

interface AssignResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: AdminResource | null;
  availableMentors?: MentorUser[];
  onAssigned: (resourceTitle: string, mentorName: string) => void;
}

export function AssignResourceDialog({
  open,
  onOpenChange,
  resource,
  availableMentors,
  onAssigned,
}: AssignResourceDialogProps) {
  const [mentors, setMentors] = useState<MentorUser[]>(availableMentors || []);
  const [isLoadingMentors, setIsLoadingMentors] = useState<boolean>(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch real mentors from database on dialog open if not already provided
  useEffect(() => {
    if (open) {
      setSelectedMentorId("");
      setInstructions("");
      setError(null);

      if (!availableMentors || availableMentors.length === 0) {
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
      } else {
        setMentors(availableMentors);
      }
    }
  }, [open, availableMentors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentorId) {
      setError("Please select a mentor to assign this resource to.");
      return;
    }

    const mentor = mentors.find((m) => String(m.id) === String(selectedMentorId));
    const mentorName = mentor ? mentor.name : "Selected Mentor";

    setIsSubmitting(true);
    setError(null);

    // Simulate assignment completion
    setTimeout(() => {
      setIsSubmitting(false);
      onAssigned(resource?.title || "Clinical Resource", mentorName);
      onOpenChange(false);
    }, 350);
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
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
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
                className="w-full h-10 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 font-medium transition focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent cursor-pointer"
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
              className="w-full p-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent resize-none"
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
              disabled={isSubmitting || mentors.length === 0}
              className="h-10 px-5 text-xs font-semibold rounded-xl bg-[#194611] hover:bg-[#14380e] text-white shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Assigning...</span>
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
