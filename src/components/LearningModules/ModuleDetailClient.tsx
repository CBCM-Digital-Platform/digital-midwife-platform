"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  LearningModule,
  ModuleContent,
  ModuleMentorAccess,
} from "@/types/learning";
import {
  grantMentorAccess,
  revokeMentorAccess,
} from "@/services/learning.service";
import { addContent, AddContentPayload } from "@/services/super-admin.service";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Video,
  Globe,
  Headphones,
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
  Plus,
  Check,
  Award,
  GraduationCap,
  ClipboardCheck,
  UploadCloud,
  X,
  Stethoscope,
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
  // Normalize Role
  const rawRole = String(userRole || "mentor").toLowerCase().replace(/[-_\s]/g, "");
  const isSuperAdmin = rawRole === "superadmin" || rawRole === "admin";
  const isFacilityAdmin = rawRole === "facilityadmin";
  const isAdminRole = isSuperAdmin || isFacilityAdmin;
  const isMentor = rawRole === "mentor";
  const isMentee = rawRole === "mentee" || (!isAdminRole && !isMentor);

  // Contents & Mentors State
  const [contents, setContents] = useState<ModuleContent[]>(initialContents);
  const [mentors, setMentors] = useState<ModuleMentorAccess[]>(initialMentors);
  const [mentorSearch, setMentorSearch] = useState("");
  const [processingMentorId, setProcessingMentorId] = useState<string | number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Mentee Progress State (Persistent via localStorage)
  const [completedContentIds, setCompletedContentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(`cbcm_mentee_progress_${module.id}`);
      if (stored) {
        setCompletedContentIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore
    }
  }, [module.id]);

  const toggleMaterialCompletion = (contentId: string | number) => {
    const idStr = String(contentId);
    setCompletedContentIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        next.add(idStr);
      }
      try {
        localStorage.setItem(
          `cbcm_mentee_progress_${module.id}`,
          JSON.stringify(Array.from(next))
        );
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const menteeCompletedCount = contents.filter((c) =>
    completedContentIds.has(String(c.id))
  ).length;
  const menteeProgressPercent =
    contents.length > 0 ? Math.round((menteeCompletedCount / contents.length) * 100) : 0;

  // Super Admin: Add Material Modal State
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [newMaterialType, setNewMaterialType] = useState<"pdf" | "video" | "audio" | "link">("pdf");
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialDesc, setNewMaterialDesc] = useState("");
  const [newMaterialUrl, setNewMaterialUrl] = useState("");
  const [newMaterialFile, setNewMaterialFile] = useState<File | null>(null);
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);
  const [materialModalError, setMaterialModalError] = useState<string | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => setFeedbackMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

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

  // Handle granting access
  const handleGrantAccess = async (mentor: ModuleMentorAccess) => {
    setProcessingMentorId(mentor.mentorId);
    setFeedbackMessage(null);

    const prevMentors = [...mentors];
    setMentors((curr) =>
      curr.map((m) =>
        m.mentorId === mentor.mentorId ? { ...m, hasAccess: true } : m
      )
    );

    try {
      const res = await grantMentorAccess(module.id, mentor.mentorId);
      if (!res.success) {
        throw new Error(res.message || "Failed to grant mentor access.");
      }
      setFeedbackMessage({
        type: "success",
        text: `Granted access to ${mentor.mentorName} for this module.`,
      });
    } catch (err: any) {
      setMentors(prevMentors);
      setFeedbackMessage({
        type: "error",
        text: err?.message || "Failed to grant access.",
      });
    } finally {
      setProcessingMentorId(null);
    }
  };

  // Handle revoking access
  const handleRevokeAccess = async (mentor: ModuleMentorAccess) => {
    setProcessingMentorId(mentor.mentorId);
    setFeedbackMessage(null);

    const prevMentors = [...mentors];
    setMentors((curr) =>
      curr.map((m) =>
        m.mentorId === mentor.mentorId ? { ...m, hasAccess: false } : m
      )
    );

    try {
      const res = await revokeMentorAccess(module.id, mentor.mentorId);
      if (!res.success) {
        throw new Error(res.message || "Failed to revoke mentor access.");
      }
      setFeedbackMessage({
        type: "success",
        text: `Revoked access for ${mentor.mentorName} from this module.`,
      });
    } catch (err: any) {
      setMentors(prevMentors);
      setFeedbackMessage({
        type: "error",
        text: err?.message || "Failed to revoke access.",
      });
    } finally {
      setProcessingMentorId(null);
    }
  };

  // Handle Super Admin Submitting Material from Dialog
  const handleAddMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialTitle.trim()) {
      setMaterialModalError("Material title is required.");
      return;
    }
    if (newMaterialType === "link" && !newMaterialUrl.trim()) {
      setMaterialModalError("A valid URL is required for Link resources.");
      return;
    }
    if (newMaterialType !== "link" && !newMaterialFile) {
      setMaterialModalError(`Please select a ${newMaterialType.toUpperCase()} file to attach.`);
      return;
    }

    setIsSubmittingMaterial(true);
    setMaterialModalError(null);

    try {
      const payload: AddContentPayload = {
        title: newMaterialTitle.trim(),
        type: newMaterialType,
        description: newMaterialDesc.trim() || undefined,
        url: newMaterialType === "link" ? newMaterialUrl.trim() : undefined,
        file: newMaterialFile || undefined,
        order: contents.length + 1,
        isRequired: true,
      };

      const res = await addContent(module.id, payload);
      if (res.success && res.content) {
        setContents((prev) => [...prev, res.content]);
        setIsAddMaterialOpen(false);
        setNewMaterialTitle("");
        setNewMaterialDesc("");
        setNewMaterialUrl("");
        setNewMaterialFile(null);
        setFeedbackMessage({
          type: "success",
          text: `Resource "${res.content.title}" added to module successfully!`,
        });
      } else {
        throw new Error(res.message || "Failed to save material.");
      }
    } catch (err: any) {
      setMaterialModalError(err?.message || "An error occurred while uploading material.");
    } finally {
      setIsSubmittingMaterial(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-900 transition">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/learning/modules" className="hover:text-gray-900 transition">
            Learning Modules
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#194611] truncate max-w-xs sm:max-w-md">
            {module.title}
          </span>
        </div>

        <Link
          href="/learning/modules"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Modules
        </Link>
      </div>

      {/* Module Title Banner & Role Specific Actions */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#194611] border border-emerald-200/80">
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

              {/* Role Perspective Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                  isSuperAdmin && "bg-purple-50 text-purple-800 border-purple-200",
                  isFacilityAdmin && "bg-blue-50 text-blue-800 border-blue-200",
                  isMentor && "bg-amber-50 text-amber-900 border-amber-200",
                  isMentee && "bg-emerald-50 text-[#194611] border-emerald-200"
                )}
              >
                {isSuperAdmin && "Super Admin Curriculum View"}
                {isFacilityAdmin && "Facility Preceptor Coordinator View"}
                {isMentor && "Clinical Preceptor View"}
                {isMentee && "Junior Midwife Learning View"}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
              {module.title}
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 max-w-3xl leading-relaxed">
              {module.description ||
                "Standardized adolescent health, procedural obstetrics, and evidence-based clinical protocols."}
            </p>
          </div>

          {/* Role Header Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {isSuperAdmin && (
              <Button
                onClick={() => setIsAddMaterialOpen(true)}
                className="bg-[#194611] hover:bg-[#13360d] text-white shadow-2xs font-semibold h-9 px-3.5 text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Learning Material
              </Button>
            )}

            {isMentor && (
              <Link
                href={`/my-assessments/new?moduleTitle=${encodeURIComponent(module.title)}`}
                className={cn(
                  buttonVariants(),
                  "bg-[#194611] hover:bg-[#13360d] text-white shadow-2xs font-semibold h-9 px-3.5 text-xs cursor-pointer"
                )}
              >
                <Stethoscope className="w-4 h-4 mr-1.5" />
                Assess Mentee on Module
              </Link>
            )}

            {isMentee && (
              <Link
                href="/assessments"
                className={cn(
                  buttonVariants(),
                  "bg-[#194611] hover:bg-[#13360d] text-white shadow-2xs font-semibold h-9 px-3.5 text-xs cursor-pointer"
                )}
              >
                <Award className="w-4 h-4 mr-1.5" />
                Request Assessment
              </Link>
            )}
          </div>
        </div>

        {/* Mentee Progress Bar (Only visible to Mentees) */}
        {isMentee && (
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#194611]" />
                Your Study Completion Progress
              </span>
              <span className="font-bold text-[#194611]">
                {menteeCompletedCount} of {contents.length} Materials Reviewed ({menteeProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-[#194611] rounded-full transition-all duration-300"
                style={{ width: `${menteeProgressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Feedback Notification */}
      {feedbackMessage && (
        <div
          className={cn(
            "p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs transition-all animate-in fade-in-50",
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
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
          <TabsTrigger value="overview" className="gap-2 px-5 text-xs font-semibold cursor-pointer">
            <Info className="w-3.5 h-3.5" />
            <span>Overview</span>
          </TabsTrigger>

          <TabsTrigger value="resources" className="gap-2 px-5 text-xs font-semibold cursor-pointer">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Resources</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-800">
              {contents.length}
            </span>
          </TabsTrigger>

          {/* Tab 3: Context-Aware per Role */}
          {isAdminRole && (
            <TabsTrigger value="mentor-access" className="gap-2 px-5 text-xs font-semibold cursor-pointer">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mentor Access</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-[#194611] font-bold">
                {mentors.filter((m) => m.hasAccess).length} Active
              </span>
            </TabsTrigger>
          )}

          {isMentor && (
            <TabsTrigger value="mentor-evaluation" className="gap-2 px-5 text-xs font-semibold cursor-pointer">
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Preceptor Evaluation Guide</span>
            </TabsTrigger>
          )}

          {isMentee && (
            <TabsTrigger value="competencies" className="gap-2 px-5 text-xs font-semibold cursor-pointer">
              <Award className="w-3.5 h-3.5" />
              <span>Clinical Competencies</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Dynamic Description Box */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#194611]" />
                  Curriculum Description
                </h3>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {module.description ||
                    "This clinical learning module provides evidence-based directives, anatomical guidance, and supervised preceptor rubrics to support hospital-based adolescent and maternal care."}
                </div>
              </div>

              {/* Role-Specific Instruction Callout */}
              {isMentee && (
                <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200/80 p-6 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#194611]" />
                    Mentee Pathway & Study Guidance
                  </h3>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    1. Study all attached learning materials in the <strong>Resources</strong> tab and mark each completed as you finish.
                    <br />
                    2. Attend required bedside demonstrations and supervised clinical rounds with your assigned midwife mentor.
                    <br />
                    3. Once prepared, request a clinical competency assessment to verify your procedural compliance under Ministry of Health rubrics.
                  </p>
                </div>
              )}

              {isMentor && (
                <div className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-6 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-amber-900" />
                    Preceptor Mentoring Guidance
                  </h3>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    As an authorized preceptor for this module, verify that junior midwives have reviewed procedural checklists prior to patient interventions. Monitor bedside delivery and evaluate mentees using standardized observation rubrics.
                  </p>
                </div>
              )}

              {isAdminRole && (
                <div className="bg-blue-50/60 rounded-2xl border border-blue-200/80 p-6 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-900" />
                    Curriculum Governance & Credentialing
                  </h3>
                  <p className="text-xs text-blue-900 leading-relaxed">
                    This module belongs to the national standardized curriculum. Facility administrators can grant and revoke mentor preceptor access in the <strong>Mentor Access</strong> tab to ensure authorized clinical oversight.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Metadata Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-gray-500">
                  Module Specifications
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Module ID</span>
                    <span className="font-semibold text-gray-900">#{module.id}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Thematic Area</span>
                    <span className="font-semibold text-gray-900 text-right">
                      {module.thematicAreaName || "General Midwifery"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Publication Status</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 border-emerald-200"
                    >
                      {module.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Total Materials</span>
                    <span className="font-semibold text-gray-900">{contents.length} Items</span>
                  </div>

                  {isAdminRole && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Authorized Mentors</span>
                      <span className="font-bold text-[#194611]">
                        {mentors.filter((m) => m.hasAccess).length} Preceptors
                      </span>
                    </div>
                  )}

                  {isMentee && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-500">Review Completion</span>
                      <span className="font-bold text-[#194611]">{menteeProgressPercent}% Done</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. RESOURCES TAB */}
        <TabsContent value="resources" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#194611]" />
                  Curated Clinical Materials
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Downloadable clinical protocols, instructional surgical videos, podcasts, and reference links.
                </p>
              </div>

              {isSuperAdmin && (
                <Button
                  onClick={() => setIsAddMaterialOpen(true)}
                  className="bg-[#194611] hover:bg-[#13360d] text-white shadow-2xs font-semibold h-8 px-3 text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Material
                </Button>
              )}
            </div>

            {contents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl space-y-3">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
                <h4 className="text-sm font-semibold text-gray-700">No Learning Materials Attached</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  {isSuperAdmin
                    ? "Click 'Add Material' above to upload your first PDF, instructional video, or external guide."
                    : "Curriculum materials are currently being prepared by the national clinical team."}
                </p>
                {isSuperAdmin && (
                  <Button
                    onClick={() => setIsAddMaterialOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-[#194611] text-[#194611] hover:bg-emerald-50 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Attach First Material
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {contents.map((item, index) => {
                  const type = String(item.type || "document").toLowerCase();
                  const isPdf = type.includes("doc") || type.includes("pdf") || type.includes("file");
                  const isVid = type.includes("video") || type.includes("mp4");
                  const isAud = type.includes("audio") || type.includes("podcast");
                  const isUrl = type.includes("link") || type.includes("url");
                  const isCompleted = completedContentIds.has(String(item.id));

                  return (
                    <div
                      key={item.id || index}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 p-3 rounded-xl transition"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Type Icon */}
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                            isPdf && "bg-red-100 text-red-700",
                            isVid && "bg-blue-100 text-blue-700",
                            isAud && "bg-amber-100 text-amber-800",
                            isUrl && "bg-purple-100 text-purple-700"
                          )}
                        >
                          {isPdf && <FileText className="w-5 h-5" />}
                          {isVid && <Video className="w-5 h-5" />}
                          {isAud && <Headphones className="w-5 h-5" />}
                          {isUrl && <Globe className="w-5 h-5" />}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {item.title}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-bold px-1.5 py-0 rounded text-gray-600 bg-gray-50 border-gray-200"
                            >
                              {item.type}
                            </Badge>
                            {isCompleted && (
                              <Badge className="bg-emerald-100 text-[#194611] text-[10px] border-emerald-200 flex items-center gap-1 font-semibold">
                                <Check className="w-3 h-3" /> Reviewed
                              </Badge>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-gray-400">
                            {item.fileSizeMb && <span>{item.fileSizeMb} MB</span>}
                            {item.durationLabel && <span>{item.durationLabel}</span>}
                            <span>Material #{item.order || index + 1}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Links & Progress Trigger */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        {/* Mentee Mark Completed Toggle */}
                        {isMentee && (
                          <button
                            type="button"
                            onClick={() => toggleMaterialCompletion(item.id)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 border",
                              isCompleted
                                ? "bg-emerald-50 text-[#194611] border-emerald-300 hover:bg-emerald-100"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                            )}
                          >
                            <Check className={cn("w-3.5 h-3.5", isCompleted ? "text-[#194611]" : "text-gray-400")} />
                            <span>{isCompleted ? "Completed" : "Mark as Done"}</span>
                          </button>
                        )}

                        {item.url && item.url !== "#" ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#194611] text-white hover:bg-[#13360d] transition shadow-2xs"
                          >
                            {isUrl ? (
                              <>
                                <span>Open Link</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>View Material</span>
                              </>
                            )}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Attached file</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 3A. MENTOR ACCESS TAB (For Super Admin and Facility Admin) */}
        {isAdminRole && (
          <TabsContent value="mentor-access" className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#194611]" />
                    Facility Preceptor Module Authorization
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Grant or revoke preceptor privileges for mentors to oversee, teach, and grade clinical assessments for this specific module.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    placeholder="Search preceptor roster..."
                    value={mentorSearch}
                    onChange={(e) => setMentorSearch(e.target.value)}
                    className="pl-8 h-9 text-xs bg-white border-gray-200"
                  />
                </div>
              </div>

              {filteredMentors.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl space-y-2">
                  <UserX className="w-8 h-8 text-gray-400 mx-auto" />
                  <h4 className="text-sm font-semibold text-gray-700">No Mentors Found</h4>
                  <p className="text-xs text-gray-400">
                    No preceptors matched your search criteria or are assigned to your facility.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Preceptor / Mentor</th>
                        <th className="py-3 px-4">Facility & Specialty</th>
                        <th className="py-3 px-4">Access Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
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
                                {mentor.facility || "Central Maternity Wing"}
                              </div>
                              <div className="text-[11px] text-gray-500">{mentor.specialty}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              {mentor.hasAccess ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-[#194611] border border-emerald-200">
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Granted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                  <UserX className="w-3.5 h-3.5" />
                                  Revoked
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {mentor.hasAccess ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isProcessing}
                                  onClick={() => handleRevokeAccess(mentor)}
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
                                  onClick={() => handleGrantAccess(mentor)}
                                  className="h-7 text-xs bg-[#194611] hover:bg-[#13360d] text-white cursor-pointer shadow-2xs"
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
          </TabsContent>
        )}

        {/* 3B. MENTOR PRECEPTOR EVALUATION TAB (For Midwife Mentors) */}
        {isMentor && (
          <TabsContent value="mentor-evaluation" className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#194611]" />
                  Preceptor Observational Checklist & Grading Guide
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Standardized observation rubrics and evaluation benchmarks for junior midwives working through this curriculum.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 space-y-2">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Procedural Verification Milestones
                  </h4>
                  <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
                    <li>Strict adherence to universal sterile technique & PPE protocol</li>
                    <li>Accurate timely recording on national digital clinical partographs</li>
                    <li>Safe administration of uterotonics and prompt hemorrhage staging</li>
                    <li>Patient dignity, adolescent-sensitive communication, and informed consent</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 space-y-2">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-800" />
                    Passing Criteria & Sign-off
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Mentees must score at least <strong>80%</strong> on procedural observation rubrics and complete all prerequisites before you sign off on clinical competency certification.
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/my-assessments/new?moduleTitle=${encodeURIComponent(module.title)}`}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "bg-[#194611] hover:bg-[#13360d] text-white text-xs cursor-pointer shadow-2xs"
                      )}
                    >
                      <Stethoscope className="w-3.5 h-3.5 mr-1" />
                      Begin Clinical Assessment
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* 3C. MENTEE CLINICAL COMPETENCIES TAB (For Junior Midwives) */}
        {isMentee && (
          <TabsContent value="competencies" className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#194611]" />
                  Required Clinical Competencies
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Procedural competencies and clinical skills you must demonstrate to your mentor for this module.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: "Aseptic Field Preparation & Infection Prevention",
                    desc: "Hand hygiene, sterile drape placement, and contaminated sharps management.",
                    ready: menteeProgressPercent >= 50,
                  },
                  {
                    title: "Active Management of Third Stage of Labor (AMTSL)",
                    desc: "Controlled cord traction, immediate oxytocin administration, and uterine massage.",
                    ready: menteeProgressPercent >= 75,
                  },
                  {
                    title: "Emergency Obstetric Complication Response",
                    desc: "Staging post-partum hemorrhage, bimanual compression, and shock protocols.",
                    ready: menteeProgressPercent === 100,
                  },
                ].map((comp, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{comp.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{comp.desc}</p>
                    </div>

                    <div>
                      {comp.ready ? (
                        <Badge className="bg-emerald-100 text-[#194611] border-emerald-200 text-xs">
                          Ready for Preceptor Evaluation
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 border-gray-200 text-xs">
                          Complete Learning Materials First
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <Link
                  href="/assessments"
                  className={cn(
                    buttonVariants(),
                    "bg-[#194611] hover:bg-[#13360d] text-white shadow-2xs font-semibold h-9 px-4 text-xs cursor-pointer"
                  )}
                >
                  <Award className="w-3.5 h-3.5 mr-1.5" />
                  View Assessment Schedule
                </Link>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* SUPER ADMIN: ADD LEARNING MATERIAL DIALOG */}
      {isSuperAdmin && (
        <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
          <DialogContent className="max-w-xl bg-white p-6 rounded-2xl shadow-xl">
            <DialogHeader className="pb-3 border-b border-gray-100">
              <DialogTitle className="text-lg font-bold text-[#194611]">
                Add Learning Material to Module
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-1">
                Attach a PDF guide, procedural video, audio debrief, or web link to #{module.id} - {module.title}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddMaterialSubmit} className="space-y-4 pt-4">
              {materialModalError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{materialModalError}</span>
                </div>
              )}

              {/* Material Type Radio Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800">
                  Material Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "pdf", label: "PDF", icon: FileText },
                    { id: "video", label: "Video", icon: Video },
                    { id: "audio", label: "Audio", icon: Headphones },
                    { id: "link", label: "Link", icon: Globe },
                  ].map((t) => {
                    const IconComp = t.icon;
                    const isSelected = newMaterialType === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setNewMaterialType(t.id as any);
                          setNewMaterialFile(null);
                        }}
                        className={cn(
                          "p-2.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 select-none",
                          isSelected
                            ? "bg-emerald-50 border-[#194611] text-[#194611] font-bold"
                            : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                        )}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[11px]">{t.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Material Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800">
                  Material Title <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Pre-operative Checklists & Protocol"
                  value={newMaterialTitle}
                  onChange={(e) => setNewMaterialTitle(e.target.value)}
                  className="h-9 text-xs bg-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800">
                  Instructions / Description (Optional)
                </label>
                <Textarea
                  rows={2}
                  placeholder="Instructions for preceptors and mentees..."
                  value={newMaterialDesc}
                  onChange={(e) => setNewMaterialDesc(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              {/* File Upload or URL */}
              {newMaterialType === "link" ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-800">
                    Resource URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="url"
                    placeholder="https://moh.gov.et/manuals/sample.pdf"
                    value={newMaterialUrl}
                    onChange={(e) => setNewMaterialUrl(e.target.value)}
                    className="h-9 text-xs bg-white"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-800">
                    Upload {newMaterialType.toUpperCase()} File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    ref={modalFileInputRef}
                    accept={
                      newMaterialType === "pdf"
                        ? ".pdf,application/pdf"
                        : newMaterialType === "video"
                        ? ".mp4,.webm,.mov"
                        : ".mp3,.wav"
                    }
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewMaterialFile(e.target.files[0]);
                        if (!newMaterialTitle) {
                          setNewMaterialTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                        }
                      }
                    }}
                    className="hidden"
                  />
                  {!newMaterialFile ? (
                    <div
                      onClick={() => modalFileInputRef.current?.click()}
                      className="border border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 flex flex-col items-center justify-center gap-1.5"
                    >
                      <UploadCloud className="w-5 h-5 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-700">Click to select {newMaterialType.toUpperCase()}</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800 truncate max-w-xs">{newMaterialFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setNewMaterialFile(null)}
                        className="h-6 w-6 text-gray-400 hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddMaterialOpen(false)}
                  className="h-8 text-xs border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingMaterial}
                  className="bg-[#194611] hover:bg-[#13360d] text-white h-8 px-4 text-xs cursor-pointer shadow-2xs font-semibold"
                >
                  {isSubmittingMaterial ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Material"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
