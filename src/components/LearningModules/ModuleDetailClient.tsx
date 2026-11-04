"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  addContent,
  updateModule,
  deleteModule,
  updateContent,
  deleteContent,
  AddContentPayload,
} from "@/services/super-admin.service";
import {
  getThematicAreaNameMap,
  resolveThematicAreaTitle,
  getModuleContents,
} from "@/services/learning.service";
import { MentorAccessTab } from "@/components/LearningModules/MentorAccessTab";
import { getMyMentees } from "@/services/my-mentees.service";
import type { MyMentee } from "@/types/my-mentee";
import { assignResourceToMentee } from "@/services/resources.service";
import { useAuth } from "@/hooks/useAuth";
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
  AlertTriangle,
  Loader2,
  Layers,
  Sparkles,
  Info,
  Plus,
  Check,
  Award,
  GraduationCap,
  ClipboardCheck,
  UploadCloud,
  UserPlus,
  Users,
  X,
  Stethoscope,
  Pencil,
  Trash2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleDetailClientProps {
  module: LearningModule;
  initialContents: ModuleContent[];
  initialMentors?: ModuleMentorAccess[];
  userRole?: string;
}

export function ModuleDetailClient({
  module: initialModule,
  initialContents,
  initialMentors = [],
  userRole: propUserRole = "mentor",
}: ModuleDetailClientProps) {
  const router = useRouter();

  // 1. Role Check using auth hook
  const { user } = useAuth();
  const effectiveRole = user?.role || propUserRole;
  const rawRole = String(effectiveRole || "").toLowerCase().trim().replace(/[-_\s]/g, "");

  const isSuperAdmin =
    rawRole === "systemadmin" ||
    rawRole === "superadmin" ||
    rawRole === "admin";

  const isFacilityAdmin = rawRole === "facilityadmin";
  const isMentor = rawRole === "mentor";
  const isMentee = rawRole === "mentee" || (!isSuperAdmin && !isFacilityAdmin && !isMentor);

  // Module & Contents State
  const [currentModule, setCurrentModule] = useState<LearningModule>(initialModule);
  const [contents, setContents] = useState<ModuleContent[]>(initialContents);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Client-side fallback to fetch contents using client session if SSR initially returned empty
  useEffect(() => {
    if (contents.length === 0 && currentModule?.id) {
      getModuleContents(currentModule.id)
        .then((fresh: ModuleContent[]) => {
          if (fresh && fresh.length > 0) {
            setContents(fresh);
          }
        })
        .catch(() => null);
    }
  }, [currentModule?.id, contents.length]);

  // Mentee Progress State (Persistent via localStorage)
  const [completedContentIds, setCompletedContentIds] = useState<Set<string>>(new Set());

  // Automatically resolve official clinical title for thematic area if missing or generic
  useEffect(() => {
    const name = currentModule.thematicAreaName;
    const id = currentModule.thematicAreaId;
    if (!name || name.startsWith("Thematic Area #") || !isNaN(Number(name))) {
      getThematicAreaNameMap().then((map) => {
        const resolved = resolveThematicAreaTitle(id, name, map);
        if (resolved && resolved !== name && !resolved.startsWith("Thematic Area #")) {
          setCurrentModule((prev) => ({
            ...prev,
            thematicAreaName: resolved,
          }));
        }
      });
    }
  }, [currentModule.thematicAreaId, currentModule.thematicAreaName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(`cbcm_mentee_progress_${currentModule.id}`);
      if (stored) {
        setCompletedContentIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore
    }
  }, [currentModule.id]);

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
          `cbcm_mentee_progress_${currentModule.id}`,
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

  // ----------------------------------------------------
  // Mentor Resource Assignment State & Handlers
  // ----------------------------------------------------
  const [myMentees, setMyMentees] = useState<MyMentee[]>([]);
  const [isLoadingMentees, setIsLoadingMentees] = useState<boolean>(false);
  const [assigningResource, setAssigningResource] = useState<ModuleContent | null>(null);
  const [selectedMenteeIds, setSelectedMenteeIds] = useState<(string | number)[]>([]);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState<boolean>(false);
  const [resourceAssignments, setResourceAssignments] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`cbcm_module_resource_assignments_${currentModule.id}`);
        if (stored) {
          setResourceAssignments(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
    }
  }, [currentModule.id]);

  useEffect(() => {
    if (isMentor) {
      setIsLoadingMentees(true);
      getMyMentees()
        .then((data) => setMyMentees(data || []))
        .catch(() => setMyMentees([]))
        .finally(() => setIsLoadingMentees(false));
    }
  }, [isMentor]);

  const handleOpenAssignResource = (item: ModuleContent) => {
    setAssigningResource(item);
    setSelectedMenteeIds([]);
  };

  const handleToggleMentee = (menteeId: string | number) => {
    setSelectedMenteeIds((prev) =>
      prev.includes(menteeId) ? prev.filter((id) => id !== menteeId) : [...prev, menteeId]
    );
  };

  const handleToggleSelectAllMentees = () => {
    if (selectedMenteeIds.length === myMentees.length) {
      setSelectedMenteeIds([]);
    } else {
      setSelectedMenteeIds(myMentees.map((m) => m.id));
    }
  };

  const handleConfirmAssignResource = async () => {
    if (!assigningResource || selectedMenteeIds.length === 0) return;
    setIsSubmittingAssignment(true);
    try {
      const res = await assignResourceToMentee(
        assigningResource.id,
        selectedMenteeIds,
        currentModule.id
      );
      if (res.success) {
        const assignedNames = myMentees
          .filter((m) => selectedMenteeIds.includes(m.id))
          .map((m) => m.name);

        setResourceAssignments((prev) => {
          const updated = {
            ...prev,
            [String(assigningResource.id)]: Array.from(
              new Set([...(prev[String(assigningResource.id)] || []), ...assignedNames])
            ),
          };
          try {
            localStorage.setItem(
              `cbcm_module_resource_assignments_${currentModule.id}`,
              JSON.stringify(updated)
            );
          } catch {
            // ignore
          }
          return updated;
        });

        setFeedbackMessage({
          type: "success",
          text: res.message || `Resource "${assigningResource.title}" assigned successfully to ${selectedMenteeIds.length} mentee(s).`,
        });
        setAssigningResource(null);
        setSelectedMenteeIds([]);
      } else {
        throw new Error(res.message || "Failed to assign resource to mentees.");
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err?.message || "Failed to assign resource to selected mentees.",
      });
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  // ----------------------------------------------------
  // Super Admin CRUD Modals State
  // ----------------------------------------------------

  // A. Edit Module Modal
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(currentModule.title);
  const [editDescription, setEditDescription] = useState(currentModule.description);
  const [editStatus, setEditStatus] = useState(currentModule.status);
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [editIsAuthorized, setEditIsAuthorized] = useState(Boolean(currentModule.isAuthorized));
  const [newMaterialIsPublished, setNewMaterialIsPublished] = useState(true);
  const [newMaterialIsAuthorized, setNewMaterialIsAuthorized] = useState(true);
  const [editContentIsPublished, setEditContentIsPublished] = useState(true);
  const [editContentIsAuthorized, setEditContentIsAuthorized] = useState(true);
  const [isQuickPublishing, setIsQuickPublishing] = useState(false);

  // B. Delete Module Modal
  const [isDeleteModuleOpen, setIsDeleteModuleOpen] = useState(false);
  const [isDeletingModule, setIsDeletingModule] = useState(false);

  // C. Add Learning Material Modal
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [newMaterialType, setNewMaterialType] = useState<"pdf" | "video" | "audio" | "link">("pdf");
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialDesc, setNewMaterialDesc] = useState("");
  const [newMaterialUrl, setNewMaterialUrl] = useState("");
  const [newMaterialFile, setNewMaterialFile] = useState<File | null>(null);
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);
  const [materialModalError, setMaterialModalError] = useState<string | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // D. Edit Resource Modal
  const [editingContent, setEditingContent] = useState<ModuleContent | null>(null);
  const [editContentTitle, setEditContentTitle] = useState("");
  const [editContentDesc, setEditContentDesc] = useState("");
  const [editContentType, setEditContentType] = useState("document");
  const [editContentUrl, setEditContentUrl] = useState("");
  const [isSavingContent, setIsSavingContent] = useState(false);

  // E. Delete Resource Modal
  const [deletingContent, setDeletingContent] = useState<ModuleContent | null>(null);
  const [isDeletingContent, setIsDeletingContent] = useState(false);

  // Auto-dismiss feedback toast
  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => setFeedbackMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  const isPublished = currentModule.status.toLowerCase() === "published";

  // ----------------------------------------------------
  // Handlers for Super Admin Module Operations
  // ----------------------------------------------------

  // Quick one-click action for Super Admin to authorize and publish the module
  const handleQuickAuthorizePublish = async () => {
    setIsQuickPublishing(true);
    try {
      const res = await updateModule(currentModule.id, {
        status: "published",
        isPublished: true,
        isAuthorized: true,
      });
      if (res.success) {
        setCurrentModule((prev) => ({
          ...prev,
          status: "published",
          isPublished: true,
          isAuthorized: true,
        }));
        setFeedbackMessage({
          type: "success",
          text: "Module published and authorized on the platform!",
        });
      } else {
        throw new Error(res.message || "Failed to authorize module.");
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err?.message || "Failed to authorize module.",
      });
    } finally {
      setIsQuickPublishing(false);
    }
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setFeedbackMessage({ type: "error", text: "Module title cannot be empty." });
      return;
    }

    setIsSavingModule(true);
    try {
      const res = await updateModule(currentModule.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        status: editStatus,
        isPublished: editStatus === "published",
        isAuthorized: editIsAuthorized,
      });

      if (res.success) {
        setCurrentModule((prev) => ({
          ...prev,
          title: editTitle.trim(),
          description: editDescription.trim(),
          status: editStatus,
          isPublished: editStatus === "published",
          isAuthorized: editIsAuthorized,
        }));
        setIsEditModuleOpen(false);
        setFeedbackMessage({ type: "success", text: "Module updated successfully." });
      } else {
        throw new Error(res.message || "Failed to update module.");
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Failed to update module." });
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleDeleteModule = async () => {
    setIsDeletingModule(true);
    try {
      const res = await deleteModule(currentModule.id);
      if (res.success) {
        setIsDeleteModuleOpen(false);
        setFeedbackMessage({ type: "success", text: "Module deleted. Redirecting..." });
        setTimeout(() => {
          router.push("/learning/modules");
        }, 1000);
      } else {
        throw new Error(res.message || "Failed to delete module.");
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Failed to delete module." });
      setIsDeletingModule(false);
    }
  };

  // ----------------------------------------------------
  // Handlers for Super Admin Content Operations
  // ----------------------------------------------------

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
        isPublished: newMaterialIsPublished,
        isAuthorized: newMaterialIsAuthorized,
      };

      const res = await addContent(currentModule.id, payload);
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

  const handleOpenEditContent = (item: ModuleContent) => {
    setEditingContent(item);
    setEditContentTitle(item.title);
    setEditContentDesc(item.description || "");
    setEditContentType(item.type || "document");
    setEditContentUrl(item.url || "");
    setEditContentIsPublished(item.isPublished !== false);
    setEditContentIsAuthorized(item.isAuthorized !== false);
  };

  const handleSaveEditContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent) return;
    if (!editContentTitle.trim()) {
      setFeedbackMessage({ type: "error", text: "Resource title is required." });
      return;
    }

    setIsSavingContent(true);
    try {
      const res = await updateContent(currentModule.id, editingContent.id, {
        title: editContentTitle.trim(),
        description: editContentDesc.trim(),
        type: editContentType,
        url: editContentUrl.trim() || undefined,
      });

      if (res.success) {
        setContents((prev) =>
          prev.map((c) =>
            c.id === editingContent.id
              ? {
                  ...c,
                  title: editContentTitle.trim(),
                  description: editContentDesc.trim(),
                  type: editContentType,
                  url: editContentUrl.trim() || c.url,
                }
              : c
          )
        );
        setEditingContent(null);
        setFeedbackMessage({ type: "success", text: "Resource updated successfully." });
      } else {
        throw new Error(res.message || "Failed to update resource.");
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Failed to update resource." });
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleConfirmDeleteContent = async () => {
    if (!deletingContent) return;

    setIsDeletingContent(true);
    try {
      const res = await deleteContent(currentModule.id, deletingContent.id);
      if (res.success) {
        setContents((prev) => prev.filter((c) => c.id !== deletingContent.id));
        setDeletingContent(null);
        setFeedbackMessage({ type: "success", text: "Resource removed from module." });
      } else {
        throw new Error(res.message || "Failed to delete resource.");
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: err?.message || "Failed to delete resource." });
    } finally {
      setIsDeletingContent(false);
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
            {currentModule.title}
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

      {/* Module Title Banner & Conditional RBAC Actions */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
              {currentModule.title}
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 max-w-3xl leading-relaxed whitespace-pre-line">
              {currentModule.description ||
                "Standardized adolescent health, procedural obstetrics, and evidence-based clinical protocols."}
            </p>
          </div>

          {/* Top Actions: Super Admin CRUD vs Facility Admin Read-Only */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {/* 2. Super Admin: Conditionally Render Edit Module & Delete Module */}
            {isSuperAdmin && (
              <>
                {isSuperAdmin && (!currentModule.isAuthorized || currentModule.status !== "published") && (
                  <Button
                    size="sm"
                    disabled={isQuickPublishing}
                    onClick={handleQuickAuthorizePublish}
                    className="bg-[#194611] hover:bg-[#13360d] text-white h-9 px-3.5 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    {isQuickPublishing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Authorize &amp; Publish Module
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setEditTitle(currentModule.title);
                    setEditDescription(currentModule.description);
                    setEditStatus(currentModule.status);
                    setEditIsAuthorized(Boolean(currentModule.isAuthorized));
                    setIsEditModuleOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 h-9 px-3 text-xs font-semibold cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                  Edit Module
                </Button>

                <Button
                  onClick={() => setIsDeleteModuleOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-9 px-3 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete Module
                </Button>
              </>
            )}

            {/* 3. Facility Admin: Strict Read-Only Indicator */}
            {isFacilityAdmin && (
              <Badge
                variant="outline"
                className="bg-gray-50 border-gray-200 text-gray-600 px-3 py-1.5 text-xs font-medium flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                Read-Only Module
              </Badge>
            )}

            {isMentor && (
              <Link
                href={`/my-assessments/new?moduleTitle=${encodeURIComponent(currentModule.title)}`}
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

        {/* Mentee Progress Bar */}
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

          {/* Mentor Access Tab: Available EXCLUSIVELY to Facility Admin for preceptor authorization */}
          {isFacilityAdmin && (
            <TabsTrigger value="mentor-access" className="gap-2 px-5 text-xs font-semibold cursor-pointer">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mentor Access</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-[#194611] font-bold">
                {initialMentors.filter((m) => m.hasAccess).length} Active
              </span>
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
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#194611]" />
                    Curriculum Description
                  </h3>

                  {isSuperAdmin && (
                    <Button
                      onClick={() => setIsEditModuleOpen(true)}
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-gray-500 hover:text-gray-900"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit Description
                    </Button>
                  )}
                </div>

                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {currentModule.description ||
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

              {isFacilityAdmin && (
                <div className="bg-blue-50/60 rounded-2xl border border-blue-200/80 p-6 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-900" />
                    Facility Content Distribution
                  </h3>
                  <p className="text-xs text-blue-900 leading-relaxed">
                    You are in Content Distribution mode for your facility. Review the standardized curriculum materials in the <strong>Resources</strong> tab, and use the <strong>Mentor Access</strong> tab to authorize and dispatch this module to your local midwife mentors.
                  </p>
                </div>
              )}

              {isSuperAdmin && (
                <div className="bg-purple-50/60 rounded-2xl border border-purple-200/80 p-6 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-900" />
                    Curriculum Master Administration
                  </h3>
                  <p className="text-xs text-purple-900 leading-relaxed">
                    As Super Admin, you have full curriculum governance. Use the actions above and within the <strong>Resources</strong> tab to edit or delete this module, attach new materials, and maintain nationwide clinical learning standards.
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
                    <span className="font-semibold text-gray-900">#{currentModule.id}</span>
                  </div>

                  <div className="flex items-start justify-between py-2 border-b border-gray-100 gap-4">
                    <span className="text-gray-500 shrink-0">Thematic Area</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900 block">
                        {currentModule.thematicAreaName || "General Midwifery"}
                      </span>
                      {currentModule.thematicAreaId && (
                        <span className="text-[11px] text-gray-400 font-medium">
                          Domain Code / Area #{currentModule.thematicAreaId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Publication Status</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] capitalize font-bold",
                        isPublished
                          ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                          : "text-amber-800 bg-amber-50 border-amber-200"
                      )}
                    >
                      {currentModule.status
                        ? currentModule.status.charAt(0).toUpperCase() + currentModule.status.slice(1).toLowerCase()
                        : "Draft"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Clinical QA Status</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-semibold flex items-center gap-1",
                        currentModule.isAuthorized
                          ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                          : "text-amber-800 bg-amber-50 border-amber-200"
                      )}
                    >
                      {currentModule.isAuthorized ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Authorized QA
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Pending Approval
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Total Materials</span>
                    <span className="font-semibold text-gray-900">{contents.length} Items</span>
                  </div>

                  {isFacilityAdmin && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Local Facility Preceptors</span>
                      <span className="font-bold text-[#194611]">
                        {initialMentors.filter((m) => m.hasAccess).length} Authorized
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
                  {isFacilityAdmin
                    ? "Read-only view of national clinical protocols, videos, and reference guides."
                    : "Downloadable clinical protocols, instructional surgical videos, podcasts, and reference links."}
                </p>
              </div>

              {/* Conditionally Render "+ Add Learning Material" ONLY for Super Admins */}
              {isSuperAdmin && (
                <Button
                  onClick={() => setIsAddMaterialOpen(true)}
                  className="bg-[#194611] hover:bg-[#13360d] text-white shadow-2xs font-semibold h-8 px-3 text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  + Add Learning Material
                </Button>
              )}
            </div>

            {contents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl space-y-3">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
                <h4 className="text-sm font-semibold text-gray-700">No Learning Materials Attached</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  {isSuperAdmin
                    ? "Click '+ Add Learning Material' above to upload your first PDF, instructional video, or external guide."
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

                            {/* Super Admin Publication & Authorization Badges */}
                            {isSuperAdmin && (
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] uppercase px-1.5 py-0 rounded font-semibold",
                                    item.isPublished !== false
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : "bg-gray-100 text-gray-600 border-gray-200"
                                  )}
                                >
                                  {item.isPublished !== false ? "Published" : "Draft"}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] uppercase px-1.5 py-0 rounded font-semibold",
                                    item.isAuthorized !== false
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                  )}
                                >
                                  {item.isAuthorized !== false ? "Authorized" : "Pending QA"}
                                </Badge>
                              </div>
                            )}
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

                          {resourceAssignments[String(item.id)] && resourceAssignments[String(item.id)].length > 0 && (
                            <div className="pt-1">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-[#194611] border border-emerald-200">
                                <Users className="w-3 h-3 text-[#194611]" />
                                Assigned to: {resourceAssignments[String(item.id)].join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Links & Conditional Edit/Trash for Super Admin */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
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

                        {/* Mentor Action: Assign Resource to Mentee */}
                        {isMentor && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenAssignResource(item)}
                            className="bg-[#194611] hover:bg-[#13360d] text-white text-xs h-8 px-3 font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Assign to Mentee</span>
                          </Button>
                        )}

                        {/* View/Download link (available to all roles) */}
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

                        {/* Super Admin Individual Resource CRUD: Edit & Trash */}
                        {isSuperAdmin && (
                          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-gray-200">
                            <Button
                              onClick={() => handleOpenEditContent(item)}
                              variant="ghost"
                              size="icon"
                              title="Edit Resource"
                              className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              onClick={() => setDeletingContent(item)}
                              variant="ghost"
                              size="icon"
                              title="Delete Resource"
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 3. MENTOR ACCESS TAB: Available EXCLUSIVELY to Facility Admin */}
        {isFacilityAdmin && (
          <TabsContent value="mentor-access" className="space-y-6">
            <MentorAccessTab
              moduleId={currentModule.id}
              initialMentors={initialMentors}
              facilityName={user?.facility}
              thematicAreaTitle={
                typeof currentModule.thematicArea === "object"
                  ? currentModule.thematicArea?.name
                  : (currentModule.thematicAreaName || (typeof currentModule.thematicArea === "string" ? currentModule.thematicArea : undefined))
              }
              thematicAreaId={
                typeof currentModule.thematicArea === "object"
                  ? currentModule.thematicArea?.id
                  : currentModule.thematicAreaId
              }
              moduleStatus={currentModule.status}
              isPublished={currentModule.isPublished}
              isAuthorized={currentModule.isAuthorized}
              onModuleAuthorized={() => {
                setCurrentModule((prev) => ({
                  ...prev,
                  status: "published",
                  isPublished: true,
                  isAuthorized: true,
                }));
              }}
            />
          </TabsContent>
        )}

        

        {/* Mentee Clinical Competencies Tab */}
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

      {/* ---------------------------------------------------- */}
      {/* MENTOR MODAL: ASSIGN RESOURCE TO MENTEE */}
      {/* ---------------------------------------------------- */}
      {isMentor && (
        <Dialog open={!!assigningResource} onOpenChange={(open) => !open && setAssigningResource(null)}>
          <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-xl">
            <DialogHeader className="pb-3 border-b border-gray-100">
              <DialogTitle className="text-lg font-bold text-[#194611] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#194611]" />
                Assign Resource to Mentee
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Grant your assigned junior midwives direct access to study this material.
              </DialogDescription>
            </DialogHeader>

            {assigningResource && (
              <div className="space-y-4 py-2">
                {/* Resource summary banner */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#194611] flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{assigningResource.title}</p>
                    <p className="text-[11px] text-gray-500 capitalize">
                      {assigningResource.type || "Document"} • Module #{currentModule.id}
                    </p>
                  </div>
                </div>

                {/* Mentees checklist */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">
                      Select Mentees ({selectedMenteeIds.length} of {myMentees.length} selected)
                    </label>
                    {myMentees.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleSelectAllMentees}
                        className="text-xs font-semibold text-[#194611] hover:underline cursor-pointer"
                      >
                        {selectedMenteeIds.length === myMentees.length ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>

                  {isLoadingMentees ? (
                    <div className="py-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#194611]" />
                      Loading your assigned mentees...
                    </div>
                  ) : myMentees.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border border-gray-200 p-4">
                      <Users className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                      <p className="font-semibold text-gray-700">No Active Mentees Found</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        You do not currently have any junior midwives assigned to you in this mentorship cycle.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
                      {myMentees.map((mentee) => {
                        const isSelected = selectedMenteeIds.includes(mentee.id);
                        return (
                          <div
                            key={mentee.id}
                            onClick={() => handleToggleMentee(mentee.id)}
                            className={cn(
                              "p-3 flex items-center justify-between cursor-pointer transition select-none",
                              isSelected ? "bg-emerald-50/70" : "hover:bg-gray-50"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#194611] flex items-center justify-center text-xs font-bold shrink-0">
                                {mentee.name ? mentee.name.charAt(0).toUpperCase() : "M"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">{mentee.name}</p>
                                <p className="text-[11px] text-gray-500 truncate">
                                  {mentee.title || mentee.code || "Resident Midwife"}{" "}
                                  {mentee.facility ? `• ${mentee.facility}` : ""}
                                </p>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="size-4 rounded text-[#194611] focus:ring-[#194611] border-gray-300"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssigningResource(null)}
                disabled={isSubmittingAssignment}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAssignResource}
                disabled={isSubmittingAssignment || selectedMenteeIds.length === 0}
                className="bg-[#194611] hover:bg-[#13360d] text-white text-xs font-semibold gap-1.5 shadow-2xs"
              >
                {isSubmittingAssignment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign to {selectedMenteeIds.length} Mentee{selectedMenteeIds.length === 1 ? "" : "s"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUPER ADMIN MODALS: EDIT MODULE, DELETE, ADD/EDIT CONTENT */}
      {/* ---------------------------------------------------- */}

      {/* Modal 1: Edit Module */}
      {isSuperAdmin && (
        <Dialog open={isEditModuleOpen} onOpenChange={setIsEditModuleOpen}>
          <DialogContent className="max-w-lg bg-white p-6 rounded-2xl shadow-xl">
            <DialogHeader className="pb-3 border-b border-gray-100">
              <DialogTitle className="text-lg font-bold text-[#194611]">
                Edit Learning Module
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-1">
                Update core module title, syllabus description, and publication state.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateModule} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800">Module Title *</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-9 text-xs bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full h-9 rounded-lg border border-gray-200 px-3 text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#194611]"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Super Admin Module Clinical QA Authorization Checkbox */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <input
                  type="checkbox"
                  id="editIsAuthorized"
                  checked={editIsAuthorized}
                  onChange={(e) => setEditIsAuthorized(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#194611] focus:ring-[#194611] cursor-pointer"
                />
                <label htmlFor="editIsAuthorized" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  Clinical QA Authorization (Accredited by National Administration)
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800">Description / Syllabus</label>
                <Textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              {/* Super Admin Material Publication & Authorization Checkboxes */}
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newMaterialIsPublished"
                    checked={newMaterialIsPublished}
                    onChange={(e) => setNewMaterialIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#194611] focus:ring-[#194611] cursor-pointer"
                  />
                  <label htmlFor="newMaterialIsPublished" className="text-xs font-semibold text-gray-800 cursor-pointer">
                    Publish Immediately (Visible to preceptors &amp; mentees)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newMaterialIsAuthorized"
                    checked={newMaterialIsAuthorized}
                    onChange={(e) => setNewMaterialIsAuthorized(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#194611] focus:ring-[#194611] cursor-pointer"
                  />
                  <label htmlFor="newMaterialIsAuthorized" className="text-xs font-semibold text-gray-800 cursor-pointer">
                    Clinical Authorization (QA Approved Protocol)
                  </label>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModuleOpen(false)}
                  className="h-8 text-xs border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingModule}
                  className="bg-[#194611] hover:bg-[#13360d] text-white h-8 px-4 text-xs font-semibold shadow-2xs"
                >
                  {isSavingModule ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 2: Delete Module Confirmation */}
      {isSuperAdmin && (
        <Dialog open={isDeleteModuleOpen} onOpenChange={setIsDeleteModuleOpen}>
          <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-xl">
            <DialogHeader className="pb-3 border-b border-gray-100">
              <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Delete Learning Module?
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 mt-2 leading-relaxed">
                Are you sure you want to permanently delete <strong>&quot;{currentModule.title}&quot;</strong>?
                This action will delete all attached learning materials and cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeletingModule}
                onClick={() => setIsDeleteModuleOpen(false)}
                className="h-8 text-xs border-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isDeletingModule}
                onClick={handleDeleteModule}
                className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 text-xs font-semibold shadow-2xs"
              >
                {isDeletingModule ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Yes, Delete Module
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 3: Add Learning Material */}
      {isSuperAdmin && (
        <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
          <DialogContent className="max-w-xl bg-white p-6 rounded-2xl shadow-xl">
            <DialogHeader className="pb-3 border-b border-gray-100">
              <DialogTitle className="text-lg font-bold text-[#194611]">
                Add Learning Material to Module
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-1">
                Attach a PDF guide, procedural video, audio debrief, or web link to #{currentModule.id} - {currentModule.title}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddMaterialSubmit} className="space-y-4 pt-4">
              {materialModalError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{materialModalError}</span>
                </div>
              )}

              {/* Material Type Selection */}
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

      {/* Modal 4: Edit Resource */}
      {isSuperAdmin && editingContent && (
        <Dialog open={Boolean(editingContent)} onOpenChange={() => setEditingContent(null)}>
          <DialogContent className="max-w-lg bg-white p-6 rounded-2xl shadow-xl">
            <DialogHeader className="pb-3 border-b border-gray-100">
              <DialogTitle className="text-base font-bold text-[#194611]">
                Edit Learning Resource
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-1">
                Modify title, description, or link for this resource.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEditContent} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800">Resource Title *</label>
                <Input
                  value={editContentTitle}
                  onChange={(e) => setEditContentTitle(e.target.value)}
                  className="h-9 text-xs bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-800">Description</label>
                <Textarea
                  rows={2}
                  value={editContentDesc}
                  onChange={(e) => setEditContentDesc(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              {editContentType === "link" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-800">Resource URL</label>
                  <Input
                    type="url"
                    value={editContentUrl}
                    onChange={(e) => setEditContentUrl(e.target.value)}
                    className="h-9 text-xs bg-white"
                  />
                </div>
              )}

              {/* Super Admin Edit Resource Publication & Authorization */}
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editContentIsPublished"
                    checked={editContentIsPublished}
                    onChange={(e) => setEditContentIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#194611] focus:ring-[#194611] cursor-pointer"
                  />
                  <label htmlFor="editContentIsPublished" className="text-xs font-semibold text-gray-800 cursor-pointer">
                    Published (Visible to facility preceptors and mentees)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editContentIsAuthorized"
                    checked={editContentIsAuthorized}
                    onChange={(e) => setEditContentIsAuthorized(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#194611] focus:ring-[#194611] cursor-pointer"
                  />
                  <label htmlFor="editContentIsAuthorized" className="text-xs font-semibold text-gray-800 cursor-pointer">
                    Authorized (Clinical QA Protocol Approved)
                  </label>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingContent(null)}
                  className="h-8 text-xs border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingContent}
                  className="bg-[#194611] hover:bg-[#13360d] text-white h-8 px-4 text-xs font-semibold shadow-2xs"
                >
                  {isSavingContent ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 5: Delete Resource Confirmation */}
      {isSuperAdmin && deletingContent && (
        <Dialog open={Boolean(deletingContent)} onOpenChange={() => setDeletingContent(null)}>
          <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-xl">
            <DialogHeader className="pb-3 border-b border-gray-100">
              <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Remove Resource?
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 mt-2 leading-relaxed">
                Are you sure you want to remove <strong>&quot;{deletingContent.title}&quot;</strong> from this learning module?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeletingContent}
                onClick={() => setDeletingContent(null)}
                className="h-8 text-xs border-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isDeletingContent}
                onClick={handleConfirmDeleteContent}
                className="bg-red-600 hover:bg-red-700 text-white h-8 px-4 text-xs font-semibold shadow-2xs"
              >
                {isDeletingContent ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Yes, Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
