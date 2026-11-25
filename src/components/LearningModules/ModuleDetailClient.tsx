"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { getMyMentees } from "@/services/my-mentees.service";
import type { MyMentee } from "@/types/my-mentee";
import {
  assignResourceToMentee,
  completeAssignedResource,
  downloadAssignedResource,
  openResourceInNewTab,
} from "@/services/resources.service";
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
  ShieldAlert,
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
  Unlock,
  KeyRound,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ENDPOINTS } from "@/services/endpoints";

interface ModuleDetailClientProps {
  module: LearningModule;
  initialContents: ModuleContent[];
  userRole?: string;
}

export function ModuleDetailClient({
  module: initialModule,
  initialContents,
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

  const isFacilityAdmin = false;
  const isMentor = rawRole === "mentor";
  const isMentee = rawRole === "mentee" || (!isSuperAdmin && !isMentor);

  // Module & Contents State
  const [currentModule, setCurrentModule] = useState<LearningModule>(initialModule);
  const [contents, setContents] = useState<ModuleContent[]>(initialContents);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isModuleAuthorized =
    currentModule.isAuthorized !== false &&
    (currentModule.isAuthorized === true || String(currentModule.status).toLowerCase() === "published");

  // Persistent assignments cache for current mentee/module
  const [assignedResourceIds, setAssignedResourceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cbcm_mentee_resource_assignments");
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            const ids = list
              .filter(
                (a: any) =>
                  !a.moduleId ||
                  String(a.moduleId) === String(currentModule.id)
              )
              .map((a: any) => String(a.resourceId));
            setAssignedResourceIds(new Set(ids));
          }
        }
      } catch {
        // ignore
      }
    }
  }, [currentModule.id]);

  // Client-side fetch to load database contents (e.g. mentee assigned resources via /api/v1/learning/my/resources)
  useEffect(() => {
    if (contents.length === 0 && currentModule?.id) {
      getModuleContents(currentModule.id)
        .then((fresh: ModuleContent[]) => {
          if (fresh && fresh.length > 0) {
            setContents(fresh);
          }
        })
        .catch(() => {
          // Keep empty if none assigned in the database
        });
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
    setCompletedContentIds(new Set(contents.filter((content) => content.isCompleted).map((content) => String(content.id))));
  }, [contents]);

  const toggleMaterialCompletion = async (contentId: string | number) => {
    const idStr = String(contentId);
    if (isMentee && !completedContentIds.has(idStr)) {
      await completeAssignedResource(contentId);
    }
    setCompletedContentIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        next.add(idStr);
      }
      return next;
    });
  };

  const openMaterial = async (item: ModuleContent, isExternalLink: boolean) => {
    if (isExternalLink) {
      if (item.url && item.url !== "#") window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      if (!isMentee) {
        await openResourceInNewTab(item.id);
        return;
      }

      const blob = await downloadAssignedResource(item.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error: any) {
      setFeedbackMessage({
        type: "error",
        text: error?.message || "Unable to open this clinical material.",
      });
    }
  };

  // ----------------------------------------------------
  // Mentee Sequential Gating & Visibility Helpers
  // ----------------------------------------------------
  type MenteeProgressStage = 1 | 2 | 3 | 4;

  const [menteeStage, setMenteeStage] = useState<MenteeProgressStage>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`cbcm_mentee_stage_${currentModule.id}`);
        if (stored && ["1", "2", "3", "4"].includes(stored)) {
          return Number(stored) as MenteeProgressStage;
        }
      } catch {}
    }
    return 1;
  });

  const [pretestScore, setPretestScore] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`cbcm_mentee_pretest_score_${currentModule.id}`);
        if (stored !== null && stored !== "") return Number(stored);
      } catch {}
    }
    return null;
  });

  const [postTestScore, setPostTestScore] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`cbcm_mentee_posttest_score_${currentModule.id}`);
        if (stored !== null && stored !== "") return Number(stored);
      } catch {}
    }
    return null;
  });

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [activeExamType, setActiveExamType] = useState<"PRETEST" | "POST_TEST">("PRETEST");
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [examAnswers, setExamAnswers] = useState<{ q1: string; q2: string; q3: string }>({
    q1: "A",
    q2: "A",
    q3: "A",
  });

  // Calculate dynamic quiz score based on current user answer selections
  const calculateDynamicExamScore = () => {
    let correct = 0;
    if (examAnswers.q1 === "A") correct++;
    if (examAnswers.q2 === "A") correct++;
    if (examAnswers.q3 === "A") correct++;
    return Math.round((correct / 3) * 100);
  };

  const handleSetStage = (s: MenteeProgressStage) => {
    setMenteeStage(s);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`cbcm_mentee_stage_${currentModule.id}`, String(s));
      } catch {}
    }
    if (s === 1) {
      setFeedbackMessage({
        type: "success",
        text: "Stage 1 Active: Pre-Exam is ready. Training materials, Post-Exam, and Answer Key are locked.",
      });
    } else if (s === 2) {
      setFeedbackMessage({
        type: "success",
        text: `Stage 2 Active: Pre-Exam completed${pretestScore !== null ? ` (Score: ${pretestScore}%)` : ""}. Participant Manual and training materials unlocked! Answer Key hidden.`,
      });
    } else if (s === 3) {
      setFeedbackMessage({
        type: "success",
        text: "Stage 3 Active: Clinical Preceptor has unlocked Post-Exam! Ready for examination.",
      });
    } else if (s === 4) {
      setFeedbackMessage({
        type: "success",
        text: `Stage 4 Active: Post-Exam submitted${postTestScore !== null ? ` (Score: ${postTestScore}%)` : ""}. Course Theory Completed & Locked! Official Answer Key revealed.`,
      });
    }
  };

  const handleStartExam = (type: "PRETEST" | "POST_TEST") => {
    setActiveExamType(type);
    setIsExamModalOpen(true);
  };

  const handleConfirmSubmitExam = () => {
    setIsSubmittingExam(true);
    const dynamicScore = calculateDynamicExamScore();

    setTimeout(() => {
      setIsSubmittingExam(false);
      setIsExamModalOpen(false);
      if (activeExamType === "PRETEST") {
        setPretestScore(dynamicScore);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`cbcm_mentee_pretest_score_${currentModule.id}`, String(dynamicScore));
          } catch {}
        }
        handleSetStage(2);
      } else {
        setPostTestScore(dynamicScore);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`cbcm_mentee_posttest_score_${currentModule.id}`, String(dynamicScore));
          } catch {}
        }
        handleSetStage(4);
      }
    }, 600);
  };

  // 1. Facilitator Guide Guard: strictly hide from mentees
  const isFacilitatorGuide = (item: ModuleContent) => {
    const cat = String(item.category || "").toUpperCase();
    const title = String(item.title || "").toLowerCase();
    return cat === "FACILITATOR_GUIDE" || title.includes("facilitator guide");
  };

  // 2. Classify content type for sequential gating
  const getItemStageType = (item: ModuleContent): "PRETEST" | "POST_TEST" | "ANSWER_KEY" | "TRAINING" => {
    const cat = String(item.category || "").toUpperCase();
    const stage = String(item.examinationStage || "").toUpperCase();
    const title = String(item.title || "").toLowerCase();

    if (cat === "ANSWER_KEY" || title.includes("answer key")) {
      return "ANSWER_KEY";
    }
    if (
      cat === "EXAMINATION" ||
      stage === "POST_TEST" ||
      title.includes("post-test") ||
      title.includes("post-exam") ||
      title.includes("posttest")
    ) {
      if (stage === "PRETEST" || title.includes("pre-test") || title.includes("pre-exam") || title.includes("pretest")) {
        return "PRETEST";
      }
      return "POST_TEST";
    }
    if (stage === "PRETEST" || title.includes("pre-test") || title.includes("pre-exam") || title.includes("pretest")) {
      return "PRETEST";
    }
    return "TRAINING";
  };

  // 3. Mentee Visible Contents:
  // - Strictly filters out any FACILITATOR_GUIDE for mentees
  // - Hides ANSWER_KEY until Stage 4
  const visibleContents = useMemo<ModuleContent[]>(() => {
    if (!isMentee) return contents;
    return contents.filter((item: ModuleContent) => {
      if (isFacilitatorGuide(item)) return false;
      const stageType = getItemStageType(item);
      if (stageType === "ANSWER_KEY" && menteeStage < 4) {
        return false;
      }
      return true;
    });
  }, [contents, isMentee, menteeStage]);

  // 4. Sequential Gating Logic per item
  const isItemGated = (item: ModuleContent) => {
    if (!isMentee) return { isLocked: false, badgeText: null, reason: null };
    const stageType = getItemStageType(item);

    // Stage 1: Pre-Exam active. Training, Post-Exam, and Answer Key are locked!
    if (menteeStage === 1) {
      if (stageType === "PRETEST") {
        return { isLocked: false, badgeText: "Pre-Exam Active", reason: "Ready to take" };
      }
      return {
        isLocked: true,
        badgeText: "Complete Pre-Exam to Unlock",
        reason: "Locked until baseline pre-examination is submitted.",
      };
    }

    // Stage 2: Pre-Exam Done. Training materials unlocked. Post-Exam waiting for mentor.
    if (menteeStage === 2) {
      if (stageType === "PRETEST") {
        return {
          isLocked: true,
          badgeText: pretestScore !== null ? `Pre-Exam: ${pretestScore}% (Completed)` : "Pre-Exam (Completed)",
          reason: "Baseline established",
        };
      }
      if (stageType === "TRAINING") {
        return { isLocked: false, badgeText: null, reason: "Unlocked for self-study" };
      }
      if (stageType === "POST_TEST") {
        return {
          isLocked: true,
          badgeText: "Waiting for Mentor to Unlock",
          reason: "Your clinical preceptor will unlock this exam after verifying clinical preparation.",
        };
      }
      if (stageType === "ANSWER_KEY") {
        return { isLocked: true, badgeText: "Hidden until Post-Exam", reason: "Hidden" };
      }
    }

    // Stage 3: Mentor Unlocked Post-Exam!
    if (menteeStage === 3) {
      if (stageType === "PRETEST") {
        return {
          isLocked: true,
          badgeText: pretestScore !== null ? `Pre-Exam: ${pretestScore}% (Completed)` : "Pre-Exam (Completed)",
          reason: "Baseline established",
        };
      }
      if (stageType === "TRAINING") {
        return { isLocked: false, badgeText: null, reason: "Unlocked for self-study" };
      }
      if (stageType === "POST_TEST") {
        return { isLocked: false, badgeText: "Post-Exam Ready", reason: "Unlocked by mentor - ready to take" };
      }
      if (stageType === "ANSWER_KEY") {
        return { isLocked: true, badgeText: "Hidden until Post-Exam", reason: "Hidden" };
      }
    }

    // Stage 4: Post-Exam submitted! Answer Key revealed. Course Theory Completed & Locked.
    if (menteeStage === 4) {
      if (stageType === "PRETEST") {
        return {
          isLocked: true,
          badgeText: pretestScore !== null ? `Pre-Exam: ${pretestScore}% (Completed)` : "Pre-Exam (Completed)",
          reason: "Baseline established",
        };
      }
      if (stageType === "TRAINING") {
        return { isLocked: false, badgeText: "Curriculum Completed", reason: "Available for reference" };
      }
      if (stageType === "POST_TEST") {
        return {
          isLocked: true,
          badgeText: postTestScore !== null
            ? `Course Theory Completed & Locked (${postTestScore}%)`
            : "Course Theory Completed & Locked",
          reason: "Exam finalized. Retakes disabled.",
        };
      }
      if (stageType === "ANSWER_KEY") {
        return { isLocked: false, badgeText: "Official Answer Key Revealed", reason: "Unlocked for review" };
      }
    }

    return { isLocked: false, badgeText: null, reason: null };
  };

  const hasPreTestInContents = useMemo(() => {
    return contents.some((item: ModuleContent) => getItemStageType(item) === "PRETEST");
  }, [contents]);

  const hasPostTestInContents = useMemo(() => {
    return contents.some((item: ModuleContent) => getItemStageType(item) === "POST_TEST");
  }, [contents]);

  const hasAnswerKeyInContents = useMemo(() => {
    return contents.some((item: ModuleContent) => getItemStageType(item) === "ANSWER_KEY");
  }, [contents]);

  const menteeCompletedCount = visibleContents.filter((c: ModuleContent) =>
    completedContentIds.has(String(c.id))
  ).length;
  const menteeProgressPercent =
    visibleContents.length > 0 ? Math.round((menteeCompletedCount / visibleContents.length) * 100) : 0;

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
        currentModule.id,
        assigningResource
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
            // Also ensure all current contents and assigned resource are saved in module contents cache
            const modKey = `cbcm_module_contents_${currentModule.id}`;
            const rawMod = localStorage.getItem(modKey);
            const existingMod = rawMod ? JSON.parse(rawMod) : [...contents];
            const found = existingMod.some((m: any) => String(m.id) === String(assigningResource.id));
            if (!found) {
              existingMod.push(assigningResource);
            }
            localStorage.setItem(modKey, JSON.stringify(existingMod));
          } catch {
            // ignore
          }
          return updated;
        });

        // Track resource locally as assigned
        setAssignedResourceIds((prev) => new Set([...Array.from(prev), String(assigningResource.id)]));

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
  const [newMaterialType, setNewMaterialType] = useState<"pdf" | "video" | "audio" | "presentation" | "link">("pdf");
  const [newMaterialCategory, setNewMaterialCategory] = useState<
    "PARTICIPANT_MANUAL" | "POWERPOINT_PRESENTATION" | "FACILITATOR_GUIDE" | "EXAMINATION" | "ANSWER_KEY" | "PRACTICAL_ASSESSMENT"
  >("PARTICIPANT_MANUAL");
  const [newExamSubcategory, setNewExamSubcategory] = useState<"EXAM_QUESTIONS" | "ANSWER_KEY">("EXAM_QUESTIONS");
  const [newExamStage, setNewExamStage] = useState<"PRETEST" | "POST_TEST">("PRETEST");
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
    if (String(newMaterialType) === "link") {
      setMaterialModalError("External links are not supported by the backend resource model. Upload a file instead.");
      return;
    }
    if (newMaterialType !== "link" && !newMaterialFile) {
      setMaterialModalError(`Please select a ${newMaterialType.toUpperCase()} file to attach.`);
      return;
    }

    setIsSubmittingMaterial(true);
    setMaterialModalError(null);

    try {
      const targetCategory =
        newMaterialCategory === "EXAMINATION" && newExamSubcategory === "ANSWER_KEY"
          ? "ANSWER_KEY"
          : newMaterialCategory;

      const payload: AddContentPayload = {
        title: newMaterialTitle.trim(),
        type: newMaterialType,
        description: newMaterialDesc.trim() || undefined,
        url: undefined,
        file: newMaterialFile || undefined,
        order: contents.length + 1,
        // Facilitator guides and answer keys are mentor-only materials and
        // cannot be required for mentee completion by the backend rules.
        isRequired: !["FACILITATOR_GUIDE", "ANSWER_KEY"].includes(targetCategory),
        category: targetCategory,
        examinationStage: newMaterialCategory === "EXAMINATION" ? newExamStage : undefined,
        thematicAreaId: currentModule.thematicAreaId,
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
                {menteeCompletedCount} of {visibleContents.length} Materials Reviewed ({menteeProgressPercent}%)
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

      {/* Dev / QA Simulator Toolbar & Sequential Gating Stepper (Mentee View) */}
      {isMentee && (
        <div className="space-y-4">
          {/* Dev/QA State Simulator Toolbar */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-200 text-amber-900 font-bold text-[11px]">
                  QA
                </span>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    Mentee Gating Flow Simulator
                    <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-900 border-amber-300 px-1.5 py-0 font-semibold">
                      Mock State
                    </Badge>
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Switch between the 4 sequential gating stages to test role-based access, lockouts, and answer key visibility.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetStage(1)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border",
                    menteeStage === 1
                      ? "bg-[#194611] text-white border-[#194611] shadow-2xs"
                      : "bg-white text-gray-700 border-amber-200 hover:bg-amber-100/50"
                  )}
                >
                  Stage 1: Pre-Exam
                </button>
                <button
                  type="button"
                  onClick={() => handleSetStage(2)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border",
                    menteeStage === 2
                      ? "bg-[#194611] text-white border-[#194611] shadow-2xs"
                      : "bg-white text-gray-700 border-amber-200 hover:bg-amber-100/50"
                  )}
                >
                  Stage 2: Training
                </button>
                <button
                  type="button"
                  onClick={() => handleSetStage(3)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border",
                    menteeStage === 3
                      ? "bg-[#194611] text-white border-[#194611] shadow-2xs"
                      : "bg-white text-gray-700 border-amber-200 hover:bg-amber-100/50"
                  )}
                >
                  Stage 3: Post-Exam Ready
                </button>
                <button
                  type="button"
                  onClick={() => handleSetStage(4)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border",
                    menteeStage === 4
                      ? "bg-[#194611] text-white border-[#194611] shadow-2xs"
                      : "bg-white text-gray-700 border-amber-200 hover:bg-amber-100/50"
                  )}
                >
                  Stage 4: Completed & Locked
                </button>
              </div>
            </div>
          </div>

          {/* Visual 4-Stage Pathway Stepper */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#194611]" />
              Sequential Clinical Learning Pathway
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Step 1 */}
              <div
                className={cn(
                  "p-3 rounded-xl border transition flex flex-col justify-between",
                  menteeStage === 1
                    ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20"
                    : menteeStage > 1
                    ? "bg-emerald-50/60 border-emerald-200"
                    : "bg-gray-50 border-gray-200 opacity-60"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Step 1: Baseline
                  </span>
                  {menteeStage > 1 ? (
                    <Badge className="bg-emerald-100 text-[#194611] border-emerald-200 text-[10px] font-bold px-1.5 py-0 flex items-center gap-1">
                      <Check className="w-3 h-3" /> {pretestScore !== null ? `${pretestScore}%` : "Passed"}
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold px-1.5 py-0 animate-pulse">
                      Active Now
                    </Badge>
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Theoretical Pre-Exam</h5>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {menteeStage === 1
                      ? "Mandatory baseline evaluation. Complete to unlock training materials."
                      : pretestScore !== null
                      ? `Passed with baseline score of ${pretestScore}%. Materials unlocked.`
                      : "Baseline pre-exam completed. Materials unlocked."}
                  </p>
                </div>
                {menteeStage === 1 && (
                  <Button
                    size="sm"
                    onClick={() => handleStartExam("PRETEST")}
                    className="mt-3 w-full bg-[#194611] hover:bg-[#13360d] text-white text-xs font-semibold h-7 cursor-pointer"
                  >
                    Take Pre-Exam
                  </Button>
                )}
              </div>

              {/* Step 2 */}
              <div
                className={cn(
                  "p-3 rounded-xl border transition flex flex-col justify-between",
                  menteeStage === 2
                    ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20"
                    : menteeStage > 2
                    ? "bg-emerald-50/60 border-emerald-200"
                    : "bg-gray-50 border-gray-200 opacity-60"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Step 2: Training
                  </span>
                  {menteeStage < 2 ? (
                    <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-300 px-1.5 py-0 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-[#194611] border-emerald-200 text-[10px] font-bold px-1.5 py-0">
                      Unlocked
                    </Badge>
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Training Materials</h5>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {menteeStage < 2
                      ? "Manuals & presentations unlocked upon completing baseline Pre-Exam."
                      : "Participant manuals & presentations unlocked for clinical study."}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={cn(
                  "p-3 rounded-xl border transition flex flex-col justify-between",
                  menteeStage === 3
                    ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20"
                    : menteeStage > 3
                    ? "bg-emerald-50/60 border-emerald-200"
                    : "bg-gray-50 border-gray-200 opacity-60"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Step 3: Verification
                  </span>
                  {menteeStage < 3 ? (
                    <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50 border-amber-200 px-1.5 py-0 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Waiting Mentor
                    </Badge>
                  ) : menteeStage === 3 ? (
                    <Badge className="bg-[#194611] text-white text-[10px] font-bold px-1.5 py-0">
                      Ready to Take
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-[#194611] border-emerald-200 text-[10px] font-bold px-1.5 py-0 flex items-center gap-1">
                      <Check className="w-3 h-3" /> {postTestScore !== null ? `${postTestScore}%` : "Passed"}
                    </Badge>
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Theoretical Post-Exam</h5>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {menteeStage < 3
                      ? "Preceptor must unlock post-exam after clinical preparation."
                      : menteeStage === 3
                      ? "Preceptor unlocked! Complete post-exam to finalize theory."
                      : postTestScore !== null
                      ? `Submitted & scored ${postTestScore}%. Exam finalized.`
                      : "Submitted & evaluated. Exam finalized."}
                  </p>
                </div>
                {menteeStage === 3 && (
                  <Button
                    size="sm"
                    onClick={() => handleStartExam("POST_TEST")}
                    className="mt-3 w-full bg-[#194611] hover:bg-[#13360d] text-white text-xs font-semibold h-7 cursor-pointer"
                  >
                    Take Post-Exam
                  </Button>
                )}
              </div>

              {/* Step 4 */}
              <div
                className={cn(
                  "p-3 rounded-xl border transition flex flex-col justify-between",
                  menteeStage === 4
                    ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20"
                    : "bg-gray-50 border-gray-200 opacity-60"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Step 4: Lockout
                  </span>
                  {menteeStage < 4 ? (
                    <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 px-1.5 py-0">
                      Hidden
                    </Badge>
                  ) : (
                    <Badge className="bg-[#194611] text-white text-[10px] font-bold px-1.5 py-0 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </Badge>
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">Theory Sign-Off & Key</h5>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {menteeStage < 4
                      ? "Official Answer Key revealed and exam retakes disabled upon post-test submission."
                      : "Course Theory Completed & Locked. Retakes disabled. Official Answer Key unlocked."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              {isMentee ? visibleContents.length : contents.length}
            </span>
          </TabsTrigger>

          {/* Mentor visibility is derived from active thematic-area assignments. */}
          {isFacilityAdmin && (
            <TabsTrigger value="thematic-visibility" className="gap-2 px-5 text-xs font-semibold cursor-pointer">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mentor Visibility</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-[#194611] font-bold">
                Thematic Area
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

              {/* Mentee Sequential Clinical Learning Track */}
              {isMentee && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#194611]" />
                        Sequential Clinical Learning Track
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Follow the 4-stage progression from baseline pre-exam to supervised theoretical sign-off.
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5",
                        menteeStage === 1 && "bg-amber-100 text-amber-900 border-amber-300",
                        menteeStage === 2 && "bg-blue-100 text-blue-900 border-blue-300",
                        menteeStage === 3 && "bg-purple-100 text-purple-900 border-purple-300",
                        menteeStage === 4 && "bg-emerald-100 text-[#194611] border-emerald-300"
                      )}
                    >
                      Stage {menteeStage} of 4 Active
                    </Badge>
                  </div>

                  {/* 1. Pre-Exam Quick Status Card */}
                  <div
                    className={cn(
                      "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition",
                      menteeStage === 1
                        ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20"
                        : "bg-emerald-50/50 border-emerald-200"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                          menteeStage === 1 ? "bg-amber-200 text-amber-900" : "bg-emerald-100 text-[#194611]"
                        )}
                      >
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-900">Baseline Theoretical Pre-Exam</h4>
                          {menteeStage > 1 ? (
                            <Badge className="bg-emerald-100 text-[#194611] border-emerald-200 text-[10px] font-bold">
                              {pretestScore !== null ? `Completed (${pretestScore}%)` : "Completed"}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-200 text-amber-900 border-amber-400 text-[10px] font-bold animate-pulse">
                              Active / Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          {menteeStage === 1
                            ? "Complete this baseline assessment to unlock all study manuals and presentations."
                            : pretestScore !== null
                            ? `Baseline score: ${pretestScore}%. Clinical materials successfully unlocked.`
                            : "Baseline assessment completed. Clinical materials successfully unlocked."}
                        </p>
                      </div>
                    </div>
                    {menteeStage === 1 ? (
                      <Button
                        size="sm"
                        onClick={() => handleStartExam("PRETEST")}
                        className="bg-[#194611] hover:bg-[#13360d] text-white text-xs font-semibold shrink-0 cursor-pointer shadow-2xs"
                      >
                        Take Pre-Exam
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Passed
                      </span>
                    )}
                  </div>

                  {/* 2. Assigned Materials with Sequential Locking */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#194611]" />
                        Assigned Study Materials ({visibleContents.length})
                      </h4>
                      {menteeStage === 1 && (
                        <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50 border-amber-200 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Complete Pre-Exam to Unlock
                        </Badge>
                      )}
                    </div>

                    {visibleContents.length > 0 ? (
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                        {visibleContents.map((item: ModuleContent, idx: number) => {
                          const gating = isItemGated(item);
                          const isCompleted = completedContentIds.has(String(item.id));

                          return (
                            <div
                              key={item.id || idx}
                              className={cn(
                                "p-3.5 flex items-center justify-between gap-3 transition",
                                gating.isLocked
                                  ? "bg-gray-50/70 opacity-70"
                                  : "hover:bg-gray-50/50 bg-white"
                              )}
                            >
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <p
                                    className={cn(
                                      "text-xs font-bold truncate",
                                      gating.isLocked ? "text-gray-500 filter blur-[0.5px]" : "text-gray-900"
                                    )}
                                  >
                                    {item.title}
                                  </p>
                                  {gating.badgeText && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[9px] font-semibold px-1.5 py-0",
                                        gating.isLocked
                                          ? "text-amber-800 bg-amber-50 border-amber-200"
                                          : "text-[#194611] bg-emerald-50 border-emerald-200"
                                      )}
                                    >
                                      {gating.badgeText}
                                    </Badge>
                                  )}
                                  {isCompleted && (
                                    <Badge className="bg-emerald-100 text-[#194611] text-[9px] border-emerald-200">
                                      Reviewed
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 capitalize">
                                  {item.type} {item.durationLabel ? `• ${item.durationLabel}` : item.fileSizeMb ? `• ${item.fileSizeMb} MB` : ""}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {gating.isLocked ? (
                                  <span
                                    title={gating.reason || "Complete previous step to unlock"}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-500 bg-gray-100 rounded-lg border border-gray-200 cursor-not-allowed"
                                  >
                                    <Lock className="w-3 h-3 text-gray-400" />
                                    <span>Locked</span>
                                  </span>
                                ) : (
                                  item.url && item.url !== "#" ? (
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#194611] text-white hover:bg-[#13360d] transition shadow-2xs"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Study</span>
                                    </a>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">Attached file</span>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500">No training materials attached yet.</p>
                      </div>
                    )}
                  </div>

                  {/* 3. Post-Exam Quick Status Card */}
                  <div
                    className={cn(
                      "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition",
                      menteeStage === 3
                        ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20"
                        : menteeStage === 4
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                          menteeStage === 3
                            ? "bg-amber-200 text-amber-900"
                            : menteeStage === 4
                            ? "bg-emerald-100 text-[#194611]"
                            : "bg-gray-200 text-gray-500"
                        )}
                      >
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-900">Comprehensive Theoretical Post-Exam</h4>
                          {menteeStage === 1 && (
                            <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-300">
                              Locked (Pre-Exam Required)
                            </Badge>
                          )}
                          {menteeStage === 2 && (
                            <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50 border-amber-200">
                              Waiting for Mentor to Unlock
                            </Badge>
                          )}
                          {menteeStage === 3 && (
                            <Badge className="bg-[#194611] text-white text-[10px] font-bold">
                              Ready to Take
                            </Badge>
                          )}
                          {menteeStage === 4 && (
                            <Badge className="bg-emerald-100 text-[#194611] border-emerald-200 text-[10px] font-bold">
                              {postTestScore !== null
                                ? `Course Theory Completed & Locked (${postTestScore}%)`
                                : "Course Theory Completed & Locked"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          {menteeStage < 3
                            ? "Your clinical preceptor will unlock this exam after observing your bedside preparation."
                            : menteeStage === 3
                            ? "Your preceptor has unlocked this exam. Submit now to finalize course theoretical requirements."
                            : "Examination finalized and submitted. Retakes disabled. Official Answer Key unlocked."}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {menteeStage === 3 ? (
                        <Button
                          size="sm"
                          onClick={() => handleStartExam("POST_TEST")}
                          className="bg-[#194611] hover:bg-[#13360d] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                          Take Post-Exam
                        </Button>
                      ) : menteeStage === 4 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg border border-gray-200">
                          <Lock className="w-3.5 h-3.5" /> Retakes Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-400 bg-gray-100 rounded-lg border border-gray-200">
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4. Official Answer Key Reveal Card (Stage 4 Only) */}
                  {menteeStage === 4 && (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-200 text-[#194611] flex items-center justify-center shrink-0">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#194611]">Official Theoretical Answer Key</h4>
                            <Badge className="bg-emerald-100 text-[#194611] border-emerald-300 text-[10px] font-bold">
                              Revealed
                            </Badge>
                          </div>
                          <p className="text-[11px] text-emerald-900 mt-0.5">
                            Unlocked following successful Post-Exam completion. Review correct rationales and clinical guidance.
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFeedbackMessage({
                            type: "success",
                            text: "Official Answer Key opened for post-exam review and clinical self-reflection.",
                          });
                        }}
                        className="border-[#194611] text-[#194611] hover:bg-emerald-100 text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Review Answer Key
                      </Button>
                    </div>
                  )}
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
                    You are in Content Distribution mode for your facility. Review the standardized curriculum materials in the <strong>Resources</strong> tab. Mentors assigned to this module's thematic area receive it automatically after authorization and publication.
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
                        Automatic thematic-area access
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

            {isMentor && !isModuleAuthorized ? (
              <div className="text-center py-12 border-2 border-dashed border-amber-200 bg-amber-50/50 rounded-xl space-y-3 p-6">
                <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                <h4 className="text-sm font-bold text-gray-900">Module Pending Clinical QA Authorization</h4>
                <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                  Only resources linked to an authorized learning module are available to mentors. Once this module is authorized by the national quality assurance team, its attached clinical guides, videos, and protocols will be accessible for preceptors to review and assign to junior midwives.
                </p>
              </div>
            ) : (isMentee ? visibleContents.length === 0 : contents.length === 0) ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl space-y-3">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
                <h4 className="text-sm font-semibold text-gray-700">
                  {isMentee ? "No Clinical Materials Assigned Yet" : "No Learning Materials Attached"}
                </h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  {isMentee
                    ? "Your clinical preceptor has not yet assigned any materials for this module. Assigned materials, surgical videos, and checklists will appear here once dispatched by your mentor."
                    : isSuperAdmin
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
              <div className="space-y-4">
                {/* Mentee Stage 1 Milestone: Theoretical Pre-Exam Card */}
                {isMentee && !visibleContents.some((item: ModuleContent) => getItemStageType(item) === "PRETEST") && (
                  <div
                    className={cn(
                      "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition shadow-2xs",
                      menteeStage === 1
                        ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20"
                        : "bg-emerald-50/50 border-emerald-200"
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                          menteeStage === 1 ? "bg-amber-200 text-amber-900" : "bg-emerald-100 text-[#194611]"
                        )}
                      >
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">Baseline Theoretical Pre-Exam</h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold px-1.5 py-0 rounded text-gray-600 bg-gray-50 border-gray-200"
                          >
                            Examination
                          </Badge>
                          {menteeStage > 1 ? (
                            <Badge className="bg-emerald-100 text-[#194611] border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> {pretestScore !== null ? `Baseline: ${pretestScore}% (Completed)` : "Pre-Exam Completed"}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold animate-pulse">
                              Active / Mandatory
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {menteeStage === 1
                            ? "Mandatory theoretical pre-assessment. Complete to establish baseline and unlock curriculum materials."
                            : pretestScore !== null
                            ? `Baseline established with a passing score of ${pretestScore}%. Study manuals unlocked.`
                            : "Baseline established. Study manuals unlocked."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {menteeStage === 1 ? (
                        <Button
                          size="sm"
                          onClick={() => handleStartExam("PRETEST")}
                          className="bg-[#194611] hover:bg-[#13360d] text-white text-xs font-semibold h-8 px-3.5 cursor-pointer shadow-2xs"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
                          Take Pre-Exam
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-[#194611] border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pre-Exam Passed {pretestScore !== null ? `(${pretestScore}%)` : ""}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Primary Resource Content Items */}
                <div className="divide-y divide-gray-100">
                  {(isMentee ? visibleContents : contents).map((item: ModuleContent, index: number) => {
                    const type = String(item.type || "document").toLowerCase();
                    const isPdf = type.includes("doc") || type.includes("pdf") || type.includes("file");
                    const isVid = type.includes("video") || type.includes("mp4");
                    const isAud = type.includes("audio") || type.includes("podcast");
                    const isUrl = type.includes("link") || type.includes("url");
                    const isCompleted = completedContentIds.has(String(item.id));
                    const gating = isItemGated(item);
                    const stageType = getItemStageType(item);
                    const materialUrl =
                      isMentee && !isUrl
                        ? ENDPOINTS.LEARNING.MY_RESOURCE_CONTENT(item.id)
                        : item.url;

                    return (
                      <div
                        key={item.id || index}
                        className={cn(
                          "py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl transition",
                          gating.isLocked
                            ? "bg-gray-50/70 border border-dashed border-gray-200/80 opacity-70"
                            : "hover:bg-gray-50/60"
                        )}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          {/* Type Icon */}
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                              gating.isLocked
                                ? "bg-gray-100 text-gray-400"
                                : isPdf && "bg-red-100 text-red-700",
                              !gating.isLocked && isVid && "bg-blue-100 text-blue-700",
                              !gating.isLocked && isAud && "bg-amber-100 text-amber-800",
                              !gating.isLocked && isUrl && "bg-purple-100 text-purple-700"
                            )}
                          >
                            {gating.isLocked ? (
                              <Lock className="w-5 h-5 text-gray-400" />
                            ) : isPdf ? (
                              <FileText className="w-5 h-5" />
                            ) : isVid ? (
                              <Video className="w-5 h-5" />
                            ) : isAud ? (
                              <Headphones className="w-5 h-5" />
                            ) : (
                              <Globe className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={cn(
                                  "text-sm font-bold truncate",
                                  gating.isLocked ? "text-gray-500 filter blur-[0.4px]" : "text-gray-900"
                                )}
                              >
                                {item.title}
                              </h4>
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase font-bold px-1.5 py-0 rounded text-gray-600 bg-gray-50 border-gray-200"
                              >
                                {item.type}
                              </Badge>

                              {/* Gating Status Badge for Mentees */}
                              {isMentee && gating.badgeText && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-bold px-1.5 py-0 rounded flex items-center gap-1",
                                    gating.isLocked
                                      ? "text-amber-800 bg-amber-50 border-amber-200"
                                      : "text-[#194611] bg-emerald-50 border-emerald-200"
                                  )}
                                >
                                  {gating.isLocked ? <Lock className="w-2.5 h-2.5" /> : null}
                                  {gating.badgeText}
                                </Badge>
                              )}

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
                              {isMentee && (assignedResourceIds.has(String(item.id)) || Boolean((item as any).assignedBy)) && (
                                <Badge className="bg-emerald-100 text-[#194611] text-[10px] border-emerald-200 flex items-center gap-1 font-semibold">
                                  <Sparkles className="w-3 h-3 text-[#194611]" /> Assigned by Preceptor
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
                          {/* Mentee Mark Completed Toggle (only active if unlocked) */}
                          {isMentee && !gating.isLocked && (
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

                          {/* Mentor Action: Assign Resource to Mentee (Only available on authorized modules and resources) */}
                          {isMentor && (
                            item.isAuthorized !== false && isModuleAuthorized ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleOpenAssignResource(item)}
                                className="bg-[#194611] hover:bg-[#13360d] text-white text-xs h-8 px-3 font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Assign to Mentee</span>
                              </Button>
                            ) : (
                              <span
                                title="Only resources linked to an authorized learning module are available to mentors."
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-800 bg-amber-50 rounded-lg border border-amber-200"
                              >
                                <Lock className="w-3 h-3 text-amber-700" />
                                <span>Requires QA Approval</span>
                              </span>
                            )
                          )}

                          {/* Gated Mentee Action vs Standard View/Download */}
                          {isMentee && gating.isLocked ? (
                            <span
                              title={gating.reason || "Locked"}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked</span>
                            </span>
                          ) : isMentee && stageType === "PRETEST" && menteeStage === 1 ? (
                            <Button
                              size="sm"
                              onClick={() => handleStartExam("PRETEST")}
                              className="bg-[#194611] hover:bg-[#13360d] text-white text-xs font-semibold h-8 px-3 cursor-pointer shadow-2xs"
                            >
                              Take Pre-Exam
                            </Button>
                          ) : isMentee && stageType === "POST_TEST" && menteeStage === 3 ? (
                            <Button
                              size="sm"
                              onClick={() => handleStartExam("POST_TEST")}
                              className="bg-[#194611] hover:bg-[#13360d] text-white text-xs font-semibold h-8 px-3 cursor-pointer shadow-2xs"
                            >
                              Take Post-Exam
                            </Button>
                          ) : isMentee && stageType === "POST_TEST" && menteeStage === 4 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Retakes Disabled</span>
                            </span>
                          ) : materialUrl && materialUrl !== "#" ? (
                            <button
                              type="button"
                              onClick={() => openMaterial(item, isUrl)}
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
                            </button>
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

                {/* Mentee Stage 3 & 4 Milestone: Theoretical Post-Exam Card */}
                {isMentee && !visibleContents.some((item: ModuleContent) => getItemStageType(item) === "POST_TEST") && (
                  <div
                    className={cn(
                      "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition shadow-2xs",
                      menteeStage === 3
                        ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20"
                        : menteeStage === 4
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                          menteeStage === 3
                            ? "bg-amber-200 text-amber-900"
                            : menteeStage === 4
                            ? "bg-emerald-100 text-[#194611]"
                            : "bg-gray-200 text-gray-400"
                        )}
                      >
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">Comprehensive Theoretical Post-Exam</h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold px-1.5 py-0 rounded text-gray-600 bg-gray-50 border-gray-200"
                          >
                            Examination
                          </Badge>
                          {menteeStage === 1 && (
                            <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-300">
                              Locked (Pre-Exam Required)
                            </Badge>
                          )}
                          {menteeStage === 2 && (
                            <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50 border-amber-200 flex items-center gap-1 font-semibold">
                              <Lock className="w-2.5 h-2.5" /> Waiting for Mentor to Unlock
                            </Badge>
                          )}
                          {menteeStage === 3 && (
                            <Badge className="bg-[#194611] text-white text-[10px] font-bold">
                              Ready to Take
                            </Badge>
                          )}
                          {menteeStage === 4 && (
                            <Badge className="bg-emerald-100 text-[#194611] border-emerald-200 text-[10px] font-bold">
                              {postTestScore !== null
                                ? `Course Theory Completed & Locked (${postTestScore}%)`
                                : "Course Theory Completed & Locked"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {menteeStage < 3
                            ? "Supervised post-training assessment. Your clinical preceptor will unlock this exam after observing your clinical readiness."
                            : menteeStage === 3
                            ? "Your preceptor has unlocked this exam. Submit now to finalize theoretical requirements."
                            : "Course theory finalized and submitted. Retakes disabled. Official Answer Key unlocked."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {menteeStage === 3 ? (
                        <Button
                          size="sm"
                          onClick={() => handleStartExam("POST_TEST")}
                          className="bg-[#194611] hover:bg-[#13360d] text-white text-xs font-semibold h-8 px-3.5 cursor-pointer shadow-2xs"
                        >
                          <Award className="w-3.5 h-3.5 mr-1" />
                          Take Post-Exam
                        </Button>
                      ) : menteeStage === 4 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Retakes Disabled</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Mentee Stage 4 Milestone: Official Answer Key Card */}
                {isMentee && menteeStage === 4 && !visibleContents.some((item: ModuleContent) => getItemStageType(item) === "ANSWER_KEY") && (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50 shadow-2xs">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-200 text-[#194611] flex items-center justify-center shrink-0 shadow-2xs">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#194611]">Official Theoretical Answer Key</h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold px-1.5 py-0 rounded text-[#194611] bg-white border-emerald-300"
                          >
                            Answer Key
                          </Badge>
                          <Badge className="bg-emerald-100 text-[#194611] border-emerald-300 text-[10px] font-bold">
                            Revealed
                          </Badge>
                        </div>
                        <p className="text-xs text-emerald-900">
                          Unlocked following post-exam submission. Review clinical rationales and procedural principles for bedside practice.
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFeedbackMessage({
                          type: "success",
                          text: "Official Answer Key opened for post-exam review and clinical self-reflection.",
                        });
                      }}
                      className="border-[#194611] text-[#194611] hover:bg-emerald-100 text-xs font-semibold shrink-0 cursor-pointer h-8 px-3.5"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Review Answer Key
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 3. MENTOR VISIBILITY TAB */}
        {isFacilityAdmin && (
          <TabsContent value="thematic-visibility" className="space-y-6">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-xs">
              <h3 className="text-base font-bold text-blue-950">Mentor visibility is thematic-area based</h3>
              <p className="mt-2 text-sm leading-relaxed text-blue-900">
                Facility administrators do not grant module access to individual mentors. Active mentors assigned to this module&apos;s thematic area can see its resources once the module is published and authorized. Manage mentor assignments from the Assignments area.
              </p>
              <Link href="/assignments" className="mt-4 inline-flex text-sm font-semibold text-[#194611] underline underline-offset-2">
                View thematic-area assignments
              </Link>
            </div>
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
                Attach a PDF guide, procedural video, audio debrief, or PowerPoint presentation to #{currentModule.id} - {currentModule.title}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddMaterialSubmit} className="space-y-4 pt-4">
              {materialModalError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{materialModalError}</span>
                </div>
              )}

              {/* Category Selector Placed Right At Top */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800">
                  Resource Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newMaterialCategory}
                  onChange={(e) => {
                    const next = e.target.value as typeof newMaterialCategory;
                    setNewMaterialCategory(next);
                    if (next === "POWERPOINT_PRESENTATION") setNewMaterialType("presentation");
                  }}
                  className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#194611]"
                >
                  <option value="PARTICIPANT_MANUAL">Participant Manual</option>
                  <option value="POWERPOINT_PRESENTATION">PowerPoint Presentation (Course Training)</option>
                  <option value="FACILITATOR_GUIDE">Facilitator Guide (Mentor Only)</option>
                  <option value="EXAMINATION">Examination</option>
                  <option value="PRACTICAL_ASSESSMENT">Practical Assessment (OSCE)</option>
                </select>
              </div>

              {/* Conditional Subcategory & Stage for EXAMINATION */}
              {newMaterialCategory === "EXAMINATION" && (
                <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Subcategory
                      </label>
                      <select
                        value={newExamSubcategory}
                        onChange={(e) => setNewExamSubcategory(e.target.value as any)}
                        className="h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-xs"
                      >
                        <option value="EXAM_QUESTIONS">Questions (EXAM_QUESTIONS)</option>
                        <option value="ANSWER_KEY">Answer Key (ANSWER_KEY)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Exam Stage
                      </label>
                      <select
                        value={newExamStage}
                        onChange={(e) => setNewExamStage(e.target.value as any)}
                        className="h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-xs"
                      >
                        <option value="PRETEST">Pre-Test (PRETEST)</option>
                        <option value="POST_TEST">Post-Test (POST_TEST)</option>
                      </select>
                    </div>
                  </div>

                  {newExamSubcategory === "ANSWER_KEY" && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-100/80 p-2 rounded border border-amber-300">
                      <Lock className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                      <span>Locked until post-exam completion (Mentor/Admin view only).</span>
                    </div>
                  )}
                </div>
              )}

              {/* Warning badge for FACILITATOR_GUIDE */}
              {newMaterialCategory === "FACILITATOR_GUIDE" && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>Mentor Only — Hidden from Mentees</span>
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
                    { id: "presentation", label: "PowerPoint", icon: FileText },
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

      {/* Modal 6: Mentee Clinical Examination Simulation Modal */}
      {isMentee && (
        <Dialog open={isExamModalOpen} onOpenChange={setIsExamModalOpen}>
          <DialogContent className="max-w-xl bg-white p-6 rounded-2xl shadow-xl">
            <DialogHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#194611] flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-gray-900">
                    {activeExamType === "PRETEST"
                      ? "Theoretical Pre-Exam (Baseline Assessment)"
                      : "Comprehensive Theoretical Post-Exam"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500 mt-0.5">
                    {activeExamType === "PRETEST"
                      ? "Establish baseline clinical knowledge before unlocking training manuals. Single attempt."
                      : "Clinical preceptor authorized post-examination. Passing establishes course theory sign-off."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-5 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              {/* Question 1 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <p className="font-bold text-gray-900">
                  1. What is the recommended first-line uterotonic for Active Management of the Third Stage of Labor (AMTSL)?
                </p>
                <div className="space-y-2">
                  <label
                    onClick={() => setExamAnswers((prev) => ({ ...prev, q1: "A" }))}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition",
                      examAnswers.q1 === "A" ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="q1"
                      checked={examAnswers.q1 === "A"}
                      onChange={() => setExamAnswers((prev) => ({ ...prev, q1: "A" }))}
                      className="accent-[#194611]"
                    />
                    <span className={cn(examAnswers.q1 === "A" ? "font-semibold text-emerald-950" : "text-gray-700")}>
                      A) Oxytocin 10 IU IM immediately after delivery of the anterior shoulder or neonate
                    </span>
                  </label>
                  <label
                    onClick={() => setExamAnswers((prev) => ({ ...prev, q1: "B" }))}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition",
                      examAnswers.q1 === "B" ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="q1"
                      checked={examAnswers.q1 === "B"}
                      onChange={() => setExamAnswers((prev) => ({ ...prev, q1: "B" }))}
                      className="accent-[#194611]"
                    />
                    <span className={cn(examAnswers.q1 === "B" ? "font-semibold text-emerald-950" : "text-gray-700")}>
                      B) Methylergometrine 0.2 mg IV push regardless of maternal blood pressure
                    </span>
                  </label>
                  <label
                    onClick={() => setExamAnswers((prev) => ({ ...prev, q1: "C" }))}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition",
                      examAnswers.q1 === "C" ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="q1"
                      checked={examAnswers.q1 === "C"}
                      onChange={() => setExamAnswers((prev) => ({ ...prev, q1: "C" }))}
                      className="accent-[#194611]"
                    />
                    <span className={cn(examAnswers.q1 === "C" ? "font-semibold text-emerald-950" : "text-gray-700")}>
                      C) Misoprostol 800 mcg rectal suppository as routine prophylaxis
                    </span>
                  </label>
                </div>
              </div>

              {/* Question 2 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <p className="font-bold text-gray-900">
                  2. In the immediate postpartum period, how frequently should uterine tone and vital signs be monitored during the first 2 hours?
                </p>
                <div className="space-y-2">
                  <label
                    onClick={() => setExamAnswers((prev) => ({ ...prev, q2: "A" }))}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition",
                      examAnswers.q2 === "A" ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="q2"
                      checked={examAnswers.q2 === "A"}
                      onChange={() => setExamAnswers((prev) => ({ ...prev, q2: "A" }))}
                      className="accent-[#194611]"
                    />
                    <span className={cn(examAnswers.q2 === "A" ? "font-semibold text-emerald-950" : "text-gray-700")}>
                      A) Every 15 minutes for the first hour, then every 30 minutes for the second hour
                    </span>
                  </label>
                  <label
                    onClick={() => setExamAnswers((prev) => ({ ...prev, q2: "B" }))}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition",
                      examAnswers.q2 === "B" ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="q2"
                      checked={examAnswers.q2 === "B"}
                      onChange={() => setExamAnswers((prev) => ({ ...prev, q2: "B" }))}
                      className="accent-[#194611]"
                    />
                    <span className={cn(examAnswers.q2 === "B" ? "font-semibold text-emerald-950" : "text-gray-700")}>
                      B) Once at 60 minutes and once at discharge
                    </span>
                  </label>
                  <label
                    onClick={() => setExamAnswers((prev) => ({ ...prev, q2: "C" }))}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition",
                      examAnswers.q2 === "C" ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="q2"
                      checked={examAnswers.q2 === "C"}
                      onChange={() => setExamAnswers((prev) => ({ ...prev, q2: "C" }))}
                      className="accent-[#194611]"
                    />
                    <span className={cn(examAnswers.q2 === "C" ? "font-semibold text-emerald-950" : "text-gray-700")}>
                      C) Every 4 hours if the patient is resting comfortably
                    </span>
                  </label>
                </div>
              </div>

              {/* Question 3 */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <p className="font-bold text-gray-900">
                  3. When assessing neonatal resuscitation within the golden first minute, which indicator dictates immediate bag-mask ventilation?
                </p>
                <div className="space-y-2">
                  <label
                    onClick={() => setExamAnswers((prev) => ({ ...prev, q3: "A" }))}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition",
                      examAnswers.q3 === "A" ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="q3"
                      checked={examAnswers.q3 === "A"}
                      onChange={() => setExamAnswers((prev) => ({ ...prev, q3: "A" }))}
                      className="accent-[#194611]"
                    />
                    <span className={cn(examAnswers.q3 === "A" ? "font-semibold text-emerald-950" : "text-gray-700")}>
                      A) Apnea/gasping or heart rate &lt; 100 bpm despite thorough drying and stimulation
                    </span>
                  </label>
                  <label
                    onClick={() => setExamAnswers((prev) => ({ ...prev, q3: "B" }))}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition",
                      examAnswers.q3 === "B" ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="q3"
                      checked={examAnswers.q3 === "B"}
                      onChange={() => setExamAnswers((prev) => ({ ...prev, q3: "B" }))}
                      className="accent-[#194611]"
                    />
                    <span className={cn(examAnswers.q3 === "B" ? "font-semibold text-emerald-950" : "text-gray-700")}>
                      B) Mild acrocyanosis with vigorous crying
                    </span>
                  </label>
                  <label
                    onClick={() => setExamAnswers((prev) => ({ ...prev, q3: "C" }))}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition",
                      examAnswers.q3 === "C" ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="q3"
                      checked={examAnswers.q3 === "C"}
                      onChange={() => setExamAnswers((prev) => ({ ...prev, q3: "C" }))}
                      className="accent-[#194611]"
                    />
                    <span className={cn(examAnswers.q3 === "C" ? "font-semibold text-emerald-950" : "text-gray-700")}>
                      C) Heart rate 130 bpm with regular spontaneous respirations
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-medium">
                Calculated Score: {calculateDynamicExamScore()}%
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingExam}
                  onClick={() => setIsExamModalOpen(false)}
                  className="h-8 text-xs border-gray-200"
                >
                  Exit Exam
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmittingExam}
                  onClick={handleConfirmSubmitExam}
                  className="bg-[#194611] hover:bg-[#13360d] text-white h-8 px-4 text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  {isSubmittingExam ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Submit {activeExamType === "PRETEST" ? "Pre-Exam" : "Post-Exam"} ({calculateDynamicExamScore()}%)
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
