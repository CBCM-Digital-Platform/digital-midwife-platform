"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { ModuleMentorAccess } from "@/types/learning";
import {
  grantMentorAccess,
  revokeMentorAccess,
} from "@/services/learning.service";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/services/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MentorAccessTabProps {
  moduleId: string | number;
  initialMentors?: ModuleMentorAccess[];
  facilityName?: string;
  thematicAreaTitle?: string;
  thematicAreaId?: string | number;
}

export function MentorAccessTab({
  moduleId,
  initialMentors = [],
  facilityName,
  thematicAreaTitle,
  thematicAreaId,
}: MentorAccessTabProps) {
  const [mentors, setMentors] = useState<ModuleMentorAccess[]>(initialMentors);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingMentorId, setProcessingMentorId] = useState<string | number | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [assignmentError, setAssignmentError] = useState<{
    mentorName: string;
    message: string;
  } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Auto-dismiss toast after 6s
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const filteredMentors = mentors.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      m.mentorName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.facility && m.facility.toLowerCase().includes(q)) ||
      (m.specialty && m.specialty.toLowerCase().includes(q))
    );
  });

  const activeCount = mentors.filter((m) => m.hasAccess).length;

  const handleGrant = async (mentor: ModuleMentorAccess) => {
    setProcessingMentorId(mentor.mentorId);
    setToastMessage(null);
    setAssignmentError(null);
    setPublishError(null);

    const prevMentors = [...mentors];
    // Optimistically update access in state
    setMentors((curr) =>
      curr.map((m) =>
        m.mentorId === mentor.mentorId ? { ...m, hasAccess: true } : m
      )
    );

    try {
      const res = await grantMentorAccess(moduleId, mentor.mentorId);
      setToastMessage({
        type: "success",
        text: res.message || `Preceptor access granted to ${mentor.mentorName}.`,
      });
    } catch (err: any) {
      console.error("Backend grant mentor access error:", err);
      // Revert optimistic update
      setMentors(prevMentors);

      const errMsg = err?.message || "Failed to grant preceptor access.";
      const isAssignmentError =
        errMsg.toLowerCase().includes("active assignment") ||
        errMsg.toLowerCase().includes("thematic area");
      const isPublishError =
        errMsg.toLowerCase().includes("published") &&
        (errMsg.toLowerCase().includes("authorized") || errMsg.toLowerCase().includes("assigned to mentors"));

      if (isAssignmentError) {
        setAssignmentError({
          mentorName: mentor.mentorName,
          message: errMsg,
        });
      } else if (isPublishError) {
        setPublishError(errMsg);
      }

      setToastMessage({
        type: "error",
        text: `Backend Error: ${errMsg}`,
      });
    } finally {
      setProcessingMentorId(null);
    }
  };

  const handleAuthorizeAndPublish = async () => {
    setIsPublishing(true);
    setToastMessage(null);
    try {
      await apiClient.patch(ENDPOINTS.LEARNING.DETAIL(moduleId), {
        status: "published",
        isPublished: true,
        isAuthorized: true,
      });
      setPublishError(null);
      setToastMessage({
        type: "success",
        text: "Module published and authorized on the server! You can now assign mentors.",
      });
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to authorize module. Administrator role required.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRevoke = async (mentor: ModuleMentorAccess) => {
    setProcessingMentorId(mentor.mentorId);
    setToastMessage(null);
    setAssignmentError(null);
    setPublishError(null);

    const prevMentors = [...mentors];
    // Optimistically revoke access in state
    setMentors((curr) =>
      curr.map((m) =>
        m.mentorId === mentor.mentorId ? { ...m, hasAccess: false } : m
      )
    );

    try {
      const res = await revokeMentorAccess(moduleId, mentor.mentorId);
      setToastMessage({
        type: "success",
        text: res.message || `Preceptor access revoked for ${mentor.mentorName}.`,
      });
    } catch (err: any) {
      console.error("Backend revoke mentor access error:", err);
      // Revert optimistic revoke
      setMentors(prevMentors);

      setToastMessage({
        type: "error",
        text: `Revocation Error: ${err?.message || "Could not revoke preceptor access."}`,
      });
    } finally {
      setProcessingMentorId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#194611]" />
              Facility Preceptor Module Authorization
            </h3>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-[#194611] border-emerald-200 text-xs font-semibold"
            >
              {activeCount} Authorized
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            Dispatch this learning module to preceptors and midwife mentors at{" "}
            <span className="font-semibold text-gray-700">
              {facilityName || "your local facility"}
            </span>{" "}
            so they can evaluate junior midwives.
          </p>
        </div>

        {/* Preceptor Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search facility mentors by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs bg-white border-gray-200 focus-visible:ring-[#194611]"
          />
        </div>
      </div>

      {/* Module Authorization Alert Banner */}
      {publishError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs shadow-xs animate-in fade-in-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-900 text-sm">
                  Module Authorization Required
                </h4>
                <button
                  type="button"
                  onClick={() => setPublishError(null)}
                  className="text-amber-500 hover:text-amber-800 transition cursor-pointer"
                  aria-label="Close alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-amber-800 leading-relaxed">
                The server requires this learning module to be officially <strong>published</strong> and <strong>authorized</strong> before mentors can be assigned.
              </p>
              <div className="pt-1 flex items-center gap-3">
                <Button
                  size="sm"
                  disabled={isPublishing}
                  onClick={handleAuthorizeAndPublish}
                  className="bg-[#194611] hover:bg-[#13360d] text-white text-xs h-8 px-3.5 font-semibold shadow-xs cursor-pointer"
                >
                  {isPublishing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Authorize &amp; Publish Module Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thematic Assignment Requirement Alert Banner */}
      {assignmentError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs shadow-xs animate-in fade-in-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-900 text-sm">
                  Active Mentorship Assignment Required
                </h4>
                <button
                  type="button"
                  onClick={() => setAssignmentError(null)}
                  className="text-amber-500 hover:text-amber-800 transition"
                  aria-label="Close alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-amber-800 leading-relaxed">
                The server rejected preceptor authorization for{" "}
                <span className="font-semibold">{assignmentError.mentorName}</span> because this mentor
                does not have an active mentorship assignment in this module&apos;s thematic area
                {thematicAreaTitle ? (
                  <span className="font-semibold"> ({thematicAreaTitle})</span>
                ) : (
                  ""
                )}.
              </p>
              <div className="text-[11px] text-amber-700 bg-amber-100/70 p-2 rounded-lg font-mono">
                Backend constraint: &quot;{assignmentError.message}&quot;
              </div>
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <Link
                  href="/assignments/new"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#194611] hover:bg-[#13360d] text-white font-semibold text-xs shadow-xs transition"
                >
                  Create Mentorship Assignment
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/assignments"
                  className="inline-flex items-center gap-1 text-xs text-amber-900 hover:text-amber-950 font-semibold underline underline-offset-2"
                >
                  View Active Facility Assignments
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Notification */}
      {toastMessage && (
        <div
          className={cn(
            "p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs animate-in fade-in-50",
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          )}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Preceptors Grid Table */}
      {filteredMentors.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          No mentors or clinical preceptors matched your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor.mentorId}
              className={cn(
                "p-4 rounded-xl border transition flex flex-col justify-between gap-3",
                mentor.hasAccess
                  ? "bg-emerald-50/40 border-emerald-200/80 shadow-2xs"
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-900">
                      {mentor.mentorName}
                    </p>
                    {mentor.hasAccess ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Authorized Preceptor
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                        No Access
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    {mentor.specialty} • {mentor.facility || "Regional Hospital"}
                  </p>
                  <p className="text-[11px] text-gray-400">{mentor.email}</p>
                </div>
              </div>

              {/* Action Trigger */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  {mentor.hasAccess
                    ? "Preceptor can monitor mentees on this module."
                    : "Authorize to allow preceptor competency evaluation."}
                </span>

                {mentor.hasAccess ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={processingMentorId === mentor.mentorId}
                    onClick={() => handleRevoke(mentor)}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-8 px-2.5 text-xs font-semibold cursor-pointer shrink-0"
                  >
                    {processingMentorId === mentor.mentorId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      <UserX className="w-3.5 h-3.5 mr-1" />
                    )}
                    Revoke Access
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={processingMentorId === mentor.mentorId}
                    onClick={() => handleGrant(mentor)}
                    className="bg-[#194611] hover:bg-[#13360d] text-white h-8 px-2.5 text-xs font-semibold shadow-2xs cursor-pointer shrink-0"
                  >
                    {processingMentorId === mentor.mentorId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 mr-1" />
                    )}
                    Grant Access
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
