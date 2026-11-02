"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  LearningModule,
  ModuleContent,
  ModuleMentorAccess,
} from "@/types/learning";
import {
  grantMentorAccess,
  revokeMentorAccess,
} from "@/services/learning.service";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Video,
  Globe,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  UserCheck,
  UserX,
  Layers,
  Calendar,
  Sparkles,
  Info,
  Clock,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleDetailClientProps {
  module: LearningModule;
  initialContents: ModuleContent[];
  initialMentors?: ModuleMentorAccess[];
  userRole?: string;
}

export function ModuleDetailClient({
  module,
  initialContents,
  initialMentors = [],
  userRole = "mentor",
}: ModuleDetailClientProps) {
  const [contents, setContents] = useState<ModuleContent[]>(initialContents);
  const [mentors, setMentors] = useState<ModuleMentorAccess[]>(initialMentors);
  const [mentorSearch, setMentorSearch] = useState("");
  const [processingMentorId, setProcessingMentorId] = useState<string | number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isFacilityAdmin =
    userRole.toLowerCase().includes("facility") ||
    userRole.toLowerCase().includes("admin") ||
    userRole.toLowerCase() === "super_admin";

  const isPublished = module.status.toLowerCase() === "published";

  // Filter mentors in Mentor Access tab
  const filteredMentors = mentors.filter((m) => {
    const q = mentorSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      m.mentorName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.facility && m.facility.toLowerCase().includes(q)) ||
      (m.specialty && m.specialty.toLowerCase().includes(q))
    );
  });

  const handleToggleMentorAccess = async (mentor: ModuleMentorAccess) => {
    setProcessingMentorId(mentor.mentorId);
    setFeedbackMessage(null);

    try {
      if (mentor.hasAccess) {
        // Revoke
        await revokeMentorAccess(module.id, mentor.mentorId);
        setMentors((prev) =>
          prev.map((m) =>
            m.mentorId === mentor.mentorId ? { ...m, hasAccess: false } : m
          )
        );
        setFeedbackMessage({
          type: "success",
          text: `Revoked access for Midwife ${mentor.mentorName}.`,
        });
      } else {
        // Grant
        await grantMentorAccess(module.id, mentor.mentorId);
        setMentors((prev) =>
          prev.map((m) =>
            m.mentorId === mentor.mentorId ? { ...m, hasAccess: true } : m
          )
        );
        setFeedbackMessage({
          type: "success",
          text: `Granted access to ${module.title} for Midwife ${mentor.mentorName}.`,
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text:
          err?.message ||
          "Failed to update mentor access status. Please check connectivity.",
      });
    } finally {
      setProcessingMentorId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/learning/modules"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#194611] hover:underline cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Learning Modules</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#194611] border border-emerald-200">
                <Layers className="w-3.5 h-3.5 text-[#194611]" />
                {module.thematicAreaName || "Clinical Midwifery"}
              </span>

              <Badge
                variant="outline"
                className={cn(
                  "text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full",
                  isPublished
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-amber-100 text-amber-800 border-amber-200"
                )}
              >
                {module.status}
              </Badge>

              <span className="text-xs text-gray-400">Module ID: #{module.id}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {module.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700">
              <FileText className="w-3.5 h-3.5 text-[#194611]" />
              {contents.length} {contents.length === 1 ? "Resource" : "Resources"}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 max-w-4xl leading-relaxed">
          {module.description ||
            "Hierarchical learning curriculum and standardized procedural guidelines developed under national adolescent and maternal health mentorship frameworks."}
        </p>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={cn(
            "p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-150",
            feedbackMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-gray-400 hover:text-gray-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs Component */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-gray-100/90 p-1 rounded-xl border border-gray-200 h-11">
          <TabsTrigger value="overview" className="gap-2 px-5 text-xs font-semibold">
            <Info className="w-3.5 h-3.5" />
            <span>Overview</span>
          </TabsTrigger>

          <TabsTrigger value="resources" className="gap-2 px-5 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Resources</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-800">
              {contents.length}
            </span>
          </TabsTrigger>

          {isFacilityAdmin && (
            <TabsTrigger value="mentor-access" className="gap-2 px-5 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mentor Access</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-[#194611] font-bold">
                {mentors.filter((m) => m.hasAccess).length} Active
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Description & Competencies */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#194611]" />
                  Curriculum Description
                </h3>
                <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                  <p>
                    {module.description ||
                      "This learning module delivers clinical instruction, verified protocols, and evidence-based preceptor assessments to strengthen adolescent and maternal healthcare delivery."}
                  </p>
                  <p>
                    Junior midwives and mentees enrolled in this module complete procedural checklists, attend supervised preceptor sessions, and review standardized materials before assessment evaluation.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FDD028]" />
                  Clinical Focus Areas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
                  <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Direct Clinical Mentorship</p>
                      <p className="text-gray-500 mt-0.5">Preceptor-monitored bedside delivery and emergency response.</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Standardized Verification</p>
                      <p className="text-gray-500 mt-0.5">Graded rubrics and observation checklists aligned with MOH protocols.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Metadata Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-gray-500">
                  Module Specifications
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Thematic Domain</span>
                    <span className="font-bold text-gray-900 text-right">
                      {module.thematicAreaName || "Clinical Midwifery"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Publication Status</span>
                    <span className="font-bold text-emerald-700 uppercase">{module.status}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Materials Attached</span>
                    <span className="font-bold text-gray-900">{contents.length} items</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="font-medium text-gray-700">
                      {module.updatedAt
                        ? new Date(module.updatedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Recent"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. RESOURCES TAB */}
        <TabsContent value="resources" className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">Module Resources & Materials</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Download or review clinical reference documents, video training, and guidelines.
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {contents.length} {contents.length === 1 ? "Material" : "Materials"} available
            </span>
          </div>

          {contents.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-[#194611] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-800">No Materials Uploaded Yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No clinical documents or videos have been linked to this learning module.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {contents.map((item, idx) => {
                const isVideo = item.type === "video";
                const isLink = item.type === "link";
                const isDoc = !isVideo && !isLink;

                return (
                  <div
                    key={item.id || idx}
                    className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                          isVideo
                            ? "bg-purple-50 border-purple-200 text-purple-700"
                            : isLink
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                        )}
                      >
                        {isVideo ? (
                          <Video className="w-5 h-5" />
                        ) : isLink ? (
                          <Globe className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {item.title}
                          </h4>
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                              isVideo
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : isLink
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            )}
                          >
                            {item.type}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-0.5">
                          {item.fileSizeMb && <span>{item.fileSizeMb} MB</span>}
                          {item.durationLabel && <span>{item.durationLabel}</span>}
                          {item.fileName && <span className="truncate">File: {item.fileName}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {item.url && item.url !== "#" ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#194611] text-xs font-semibold transition cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Material</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 text-xs font-medium cursor-not-allowed"
                        >
                          <span>Offline Resource</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 3. MENTOR ACCESS TAB (FACILITY ADMINS) */}
        {isFacilityAdmin && (
          <TabsContent value="mentor-access" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#194611]" />
                  Preceptor & Mentor Access Management
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Grant or revoke permissions for midwives at your facility to supervise and mentor trainees using this module.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Filter preceptors..."
                  value={mentorSearch}
                  onChange={(e) => setMentorSearch(e.target.value)}
                  className="h-8.5 text-xs pl-8.5 bg-white"
                />
              </div>
            </div>

            {filteredMentors.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
                No mentors found matching your criteria.
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Midwife Mentor</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Facility / Specialty</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Access Permission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredMentors.map((m) => {
                        const isProcessing = processingMentorId === m.mentorId;
                        return (
                          <tr key={m.mentorId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-gray-900">
                              {m.mentorName}
                            </td>
                            <td className="py-3 px-4 text-gray-500">{m.email}</td>
                            <td className="py-3 px-4 text-gray-600">
                              <span className="font-medium">{m.facility || "Central Hospital"}</span>
                              {m.specialty && (
                                <span className="text-gray-400 block text-[11px]">{m.specialty}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {m.hasAccess ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-[10px]">
                                  Access Granted
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-gray-500 border-gray-200 font-medium text-[10px]"
                                >
                                  No Access
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant={m.hasAccess ? "outline" : "default"}
                                disabled={isProcessing}
                                onClick={() => handleToggleMentorAccess(m)}
                                className={cn(
                                  "h-8 text-xs font-semibold cursor-pointer",
                                  m.hasAccess
                                    ? "text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200"
                                    : "bg-[#194611] hover:bg-[#14390e] text-white"
                                )}
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                    <span>Updating...</span>
                                  </>
                                ) : m.hasAccess ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5 mr-1" />
                                    <span>Revoke Access</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                                    <span>Grant Access</span>
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
