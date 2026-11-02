"use client";

import React, { useState, useEffect } from "react";
import type { ModuleMentorAccess } from "@/types/learning";
import {
  grantMentorAccess,
  revokeMentorAccess,
} from "@/services/learning.service";
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
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MentorAccessTabProps {
  moduleId: string | number;
  initialMentors?: ModuleMentorAccess[];
  facilityName?: string;
}

export function MentorAccessTab({
  moduleId,
  initialMentors = [],
  facilityName,
}: MentorAccessTabProps) {
  const [mentors, setMentors] = useState<ModuleMentorAccess[]>(initialMentors);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingMentorId, setProcessingMentorId] = useState<string | number | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
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

    const prev = [...mentors];
    setMentors((curr) =>
      curr.map((m) =>
        m.mentorId === mentor.mentorId ? { ...m, hasAccess: true } : m
      )
    );

    try {
      const res = await grantMentorAccess(moduleId, mentor.mentorId);
      if (!res.success) {
        throw new Error(res.message || "Failed to grant access.");
      }
      setToastMessage({
        type: "success",
        text: `Preceptor access granted to ${mentor.mentorName}.`,
      });
    } catch (err: any) {
      setMentors(prev);
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to grant access.",
      });
    } finally {
      setProcessingMentorId(null);
    }
  };

  const handleRevoke = async (mentor: ModuleMentorAccess) => {
    setProcessingMentorId(mentor.mentorId);
    setToastMessage(null);

    const prev = [...mentors];
    setMentors((curr) =>
      curr.map((m) =>
        m.mentorId === mentor.mentorId ? { ...m, hasAccess: false } : m
      )
    );

    try {
      const res = await revokeMentorAccess(moduleId, mentor.mentorId);
      if (!res.success) {
        throw new Error(res.message || "Failed to revoke access.");
      }
      setToastMessage({
        type: "success",
        text: `Preceptor access revoked for ${mentor.mentorName}.`,
      });
    } catch (err: any) {
      setMentors(prev);
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to revoke access.",
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
            className="text-gray-400 hover:text-gray-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Preceptors DataTable */}
      {filteredMentors.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl space-y-2">
          <UserX className="w-8 h-8 text-gray-400 mx-auto" />
          <h4 className="text-sm font-semibold text-gray-700">No Mentors Found</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery
              ? `No preceptors matched "${searchQuery}". Try a different name or specialty.`
              : "No mentors are currently registered under this facility roster."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Preceptor / Mentor</th>
                <th className="py-3 px-4">Facility & Specialty</th>
                <th className="py-3 px-4">Authorization</th>
                <th className="py-3 px-4 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredMentors.map((mentor) => {
                const isProcessing = processingMentorId === mentor.mentorId;
                return (
                  <tr key={mentor.mentorId} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{mentor.mentorName}</div>
                      <div className="text-[11px] text-gray-500">{mentor.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-800">
                        {mentor.facility || facilityName || "General Maternity Wing"}
                      </div>
                      <div className="text-[11px] text-gray-500">{mentor.specialty}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {mentor.hasAccess ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-[#194611] border border-emerald-200">
                          <UserCheck className="w-3.5 h-3.5" />
                          Authorized
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          <UserX className="w-3.5 h-3.5" />
                          Unauthorized
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {mentor.hasAccess ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleRevoke(mentor)}
                          className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Revoke Access"
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleGrant(mentor)}
                          className="h-7 text-xs bg-[#194611] hover:bg-[#13360d] text-white cursor-pointer shadow-2xs font-semibold"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Grant Access"
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
