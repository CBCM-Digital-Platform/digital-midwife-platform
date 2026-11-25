"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createResource,
  updateResource,
} from "@/services/resources.service";
import { getModules, getModuleContents } from "@/services/learning.service";
import {
  createPracticalChecklist,
  type PracticalChecklistItem,
} from "@/services/practical-checklists.service";
import type { LearningModule, ModuleContent } from "@/types/learning";
import type {
  AdminResource,
  AdminResourceType,
  LearningMaterialCategory,
  LearningExaminationStage,
} from "@/types/resource";
import {
  FileText,
  Video,
  UploadCloud,
  X,
  Loader2,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  ShieldAlert,
  Award,
  ClipboardCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardMaterialCategory =
  | "PARTICIPANT_MANUAL"
  | "POWERPOINT_PRESENTATION"
  | "FACILITATOR_GUIDE"
  | "EXAMINATION"
  | "PRACTICAL_ASSESSMENT";

export type ExamSubcategory = "EXAM_QUESTIONS" | "ANSWER_KEY";

export interface ChecklistRowItem {
  id: string;
  item_text: string;
  weight: number;
  is_critical: boolean;
}

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: AdminResource | null;
  onSuccess: (resource: AdminResource) => void;
}

const DEFAULT_OSCE_PRESETS: ChecklistRowItem[] = [
  {
    id: "preset-1",
    item_text:
      "Verifies patient identity, reviews clinical history, and explains the procedure to obtain verbal/written informed consent.",
    weight: 10,
    is_critical: false,
  },
  {
    id: "preset-2",
    item_text:
      "Performs hand hygiene according to WHO protocol and dons sterile gloves and appropriate personal protective equipment (PPE).",
    weight: 15,
    is_critical: true,
  },
  {
    id: "preset-3",
    item_text:
      "Prepares all required sterile instruments, uterotonics, and resuscitation equipment in advance of the clinical intervention.",
    weight: 15,
    is_critical: true,
  },
  {
    id: "preset-4",
    item_text:
      "Executes the standardized clinical intervention according to national guidelines while actively communicating with the patient.",
    weight: 40,
    is_critical: true,
  },
  {
    id: "preset-5",
    item_text:
      "Safely disposes of sharps and biohazardous waste, cleans instruments, washes hands, and documents findings in the patient chart.",
    weight: 20,
    is_critical: false,
  },
];

export function ResourceFormDialog({
  open,
  onOpenChange,
  resource,
  onSuccess,
}: ResourceFormDialogProps) {
  const isEditing = Boolean(resource);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Sub-page State: 1 = Category & Metadata, 2 = Tailored Upload / OSCE Builder
  const [page, setPage] = useState<1 | 2>(1);

  // Category Selector placed right at the very top
  const [materialCategory, setMaterialCategory] =
    useState<WizardMaterialCategory>("PARTICIPANT_MANUAL");

  // Examination Subcategory & Stage
  const [examSubcategory, setExamSubcategory] = useState<ExamSubcategory>("EXAM_QUESTIONS");
  const [examinationStage, setExaminationStage] = useState<"PRETEST" | "POST_TEST">("PRETEST");

  // Modules & Topics under the Module
  const [availableModules, setAvailableModules] = useState<LearningModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [moduleTopics, setModuleTopics] = useState<ModuleContent[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [customTopicName, setCustomTopicName] = useState<string>("");

  // Practical Assessment Fields
  const [procedureName, setProcedureName] = useState("");
  const [practicalBenchmark, setPracticalBenchmark] = useState("Level 3 (Competent Benchmark)");
  const [checklistItems, setChecklistItems] = useState<ChecklistRowItem[]>(DEFAULT_OSCE_PRESETS);

  // General Metadata Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<AdminResourceType>("document");
  const [isRequired, setIsRequired] = useState(true);

  // Upload Fields for Page 2
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Submission & Errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    moduleId?: string;
    procedure?: string;
    fileOrUrl?: string;
    checklist?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Load modules on mount
  useEffect(() => {
    getModules()
      .then((list) => {
        if (Array.isArray(list)) setAvailableModules(list);
      })
      .catch(() => {});
  }, []);

  // When selectedModuleId changes, fetch module topics / resources
  useEffect(() => {
    if (!selectedModuleId) {
      setModuleTopics([]);
      setSelectedTopicId("");
      return;
    }
    setIsLoadingTopics(true);
    getModuleContents(selectedModuleId)
      .then((contents) => {
        if (Array.isArray(contents)) {
          setModuleTopics(contents);
        }
      })
      .catch(() => setModuleTopics([]))
      .finally(() => setIsLoadingTopics(false));
  }, [selectedModuleId]);

  // Synchronize form when dialog opens or resource prop changes
  useEffect(() => {
    if (open) {
      setPage(1);
      setServerError(null);
      setErrors({});

      if (resource) {
        setTitle(resource.title || "");
        setDescription(resource.description || "");
        setResourceType(resource.type || "document");
        setSelectedModuleId(resource.moduleId ? String(resource.moduleId) : "");
        setIsRequired(resource.isRequired !== undefined ? resource.isRequired : true);

        // Map Category
        const cat = (resource.category as WizardMaterialCategory) || "PARTICIPANT_MANUAL";
        setMaterialCategory(cat);

        if (cat === "EXAMINATION") {
          setExamSubcategory(
            resource.category === ("ANSWER_KEY" as any) ? "ANSWER_KEY" : "EXAM_QUESTIONS"
          );
          setExaminationStage(resource.examinationStage || "PRETEST");
        }

        setExistingFileName(
          resource.fileName || (resource.fileId ? `Attached File (ID: ${resource.fileId})` : null)
        );
        setSelectedFile(null);
      } else {
        setTitle("");
        setDescription("");
        setResourceType("document");
        setSelectedModuleId(availableModules.length > 0 ? String(availableModules[0].id) : "");
        setSelectedTopicId("");
        setCustomTopicName("");
        setProcedureName("");
        setMaterialCategory("PARTICIPANT_MANUAL");
        setExamSubcategory("EXAM_QUESTIONS");
        setExaminationStage("PRETEST");
        setIsRequired(true);
        setExistingFileName(null);
        setSelectedFile(null);
        setChecklistItems(DEFAULT_OSCE_PRESETS);
      }
    }
  }, [open, resource, availableModules]);

  // Handle Category Change
  const handleCategoryChange = (newCat: WizardMaterialCategory) => {
    setMaterialCategory(newCat);
    setErrors({});

    if (newCat === "POWERPOINT_PRESENTATION") {
      setResourceType("presentation");
      setIsRequired(true);
      if (!title || title.includes("Manual") || title.includes("Guide")) {
        setTitle("Clinical Training Slide Deck");
      }
    } else if (newCat === "FACILITATOR_GUIDE") {
      setResourceType("document");
      setIsRequired(false);
      if (!title || title.includes("Manual") || title.includes("Slides")) {
        setTitle("Facilitator Guide (Mentor Only)");
      }
    } else if (newCat === "EXAMINATION") {
      setResourceType("document");
      setIsRequired(examSubcategory === "EXAM_QUESTIONS");
      if (!title || title.includes("Manual") || title.includes("Slides")) {
        setTitle(
          `Course Examination ${
            examSubcategory === "ANSWER_KEY" ? "Answer Key" : "Questions"
          }`
        );
      }
    } else if (newCat === "PRACTICAL_ASSESSMENT") {
      setResourceType("document");
      setIsRequired(true);
      if (!title || title.includes("Manual") || title.includes("Slides")) {
        setTitle("Clinical Procedure OSCE Practical Checklist");
      }
    } else {
      setResourceType("document");
      setIsRequired(true);
      if (!title || title.includes("Guide") || title.includes("Slides")) {
        setTitle("Participant Clinical Manual");
      }
    }
  };

  // Handle Topic Selection under the Module
  const handleTopicChange = (topicVal: string) => {
    setSelectedTopicId(topicVal);
    if (topicVal && topicVal !== "__custom__") {
      const foundTopic = moduleTopics.find((t) => String(t.id) === topicVal || t.title === topicVal);
      const chosenTitle = foundTopic ? foundTopic.title : topicVal;
      setProcedureName(chosenTitle);
      setTitle(`${chosenTitle} - OSCE Practical Checklist`);
    } else if (topicVal === "__custom__") {
      setProcedureName(customTopicName);
    }
  };

  // Validate Page 1
  const validatePage1 = (): boolean => {
    const errs: { title?: string; moduleId?: string; procedure?: string } = {};

    if (!title.trim()) {
      errs.title = "Resource title is required.";
    }

    if (!selectedModuleId) {
      errs.moduleId = "Please select an associated learning module.";
    }

    if (materialCategory === "PRACTICAL_ASSESSMENT") {
      const effProcedure = selectedTopicId === "__custom__" ? customTopicName : procedureName;
      if (!effProcedure.trim()) {
        errs.procedure = "Please select or specify the clinical topic/procedure under this module.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceedToNextPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePage1()) return;
    setPage(2);
  };

  // Validate Page 2
  const validatePage2 = (): boolean => {
    const errs: { fileOrUrl?: string; checklist?: string } = {};

    if (materialCategory === "PRACTICAL_ASSESSMENT") {
      if (checklistItems.length === 0) {
        errs.checklist = "At least one OSCE checklist step is required.";
      } else {
        const hasEmpty = checklistItems.some((i) => !i.item_text.trim());
        if (hasEmpty) {
          errs.checklist = "All checklist steps must have a task description.";
        }
      }
    } else {
      if (!isEditing && !selectedFile) {
        errs.fileOrUrl = "Please select or upload a document file for this resource.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // OSCE Row Handlers
  const handleAddChecklistRow = () => {
    setChecklistItems((prev) => [
      ...prev,
      {
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        item_text: "",
        weight: 10,
        is_critical: false,
      },
    ]);
    setErrors((prev) => ({ ...prev, checklist: undefined }));
  };

  const handleRemoveChecklistRow = (id: string) => {
    if (checklistItems.length <= 1) return;
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateChecklistItem = (
    id: string,
    field: keyof ChecklistRowItem,
    val: any
  ) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleLoadPresets = () => {
    setChecklistItems(DEFAULT_OSCE_PRESETS);
  };

  // File Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExistingFileName(null);
      setErrors((prev) => ({ ...prev, fileOrUrl: undefined }));
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setExistingFileName(null);
      setErrors((prev) => ({ ...prev, fileOrUrl: undefined }));
    }
  }, []);

  const getAcceptedExtensions = (): string => {
    switch (materialCategory) {
      case "POWERPOINT_PRESENTATION":
        return ".ppt,.pptx,.pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf";
      default:
        return ".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
  };

  // Final Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePage2()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const linkedModule = availableModules.find(
        (mod) => String(mod.id) === String(selectedModuleId)
      );
      const effectiveThematicAreaId = linkedModule?.thematicAreaId || 1;
      const effectiveProcedure =
        selectedTopicId === "__custom__"
          ? customTopicName.trim()
          : procedureName.trim() || title.trim();

      if (materialCategory === "PRACTICAL_ASSESSMENT") {
        // 1. Create practical checklist on backend
        await createPracticalChecklist({
          thematic_area_id: Number(effectiveThematicAreaId),
          procedure: effectiveProcedure,
          title: title.trim(),
          description: description.trim() || undefined,
          items: checklistItems.map((item) => ({
            item_text: item.item_text.trim(),
            is_required: true,
            is_critical: item.is_critical,
            weight: item.weight,
          })),
        });

        // 2. Create resource entry linked to the module
        const created = await createResource({
          title: `[OSCE] ${title.trim()}`,
          description: `Topic/Skill: ${effectiveProcedure}. ${checklistItems.length} checklist steps (${checklistItems.filter((i) => i.is_critical).length} critical). Benchmark: ${practicalBenchmark}. ${description.trim()}`,
          type: "document",
          file: selectedFile || undefined,
          moduleId: selectedModuleId ? Number(selectedModuleId) : undefined,
          thematicAreaId: effectiveThematicAreaId,
          category: "PRACTICAL_ASSESSMENT",
          isRequired: true,
        });

        onSuccess(created);
        onOpenChange(false);
      } else {
        const targetCategory: LearningMaterialCategory =
          materialCategory === "EXAMINATION" && examSubcategory === "ANSWER_KEY"
            ? "ANSWER_KEY"
            : (materialCategory as LearningMaterialCategory);

        if (isEditing && resource) {
          const updated = await updateResource(resource.id, {
            title: title.trim(),
            description: description.trim() || undefined,
            type: resourceType,
            file: selectedFile || undefined,
            moduleId: selectedModuleId ? Number(selectedModuleId) : undefined,
            thematicAreaId: effectiveThematicAreaId,
            category: targetCategory,
            examinationStage: materialCategory === "EXAMINATION" ? examinationStage : undefined,
            isRequired:
              targetCategory === "FACILITATOR_GUIDE" || targetCategory === "ANSWER_KEY"
                ? false
                : isRequired,
          });
          onSuccess(updated);
          onOpenChange(false);
        } else {
          const created = await createResource({
            title: title.trim(),
            description: description.trim() || undefined,
            type: resourceType,
            file: selectedFile || undefined,
            moduleId: selectedModuleId ? Number(selectedModuleId) : undefined,
            thematicAreaId: effectiveThematicAreaId,
            category: targetCategory,
            examinationStage: materialCategory === "EXAMINATION" ? examinationStage : undefined,
            isRequired:
              targetCategory === "FACILITATOR_GUIDE" || targetCategory === "ANSWER_KEY"
                ? false
                : isRequired,
          });
          onSuccess(created);
          onOpenChange(false);
        }
      }
    } catch (err: any) {
      console.error("Resource creation failed:", err);
      setServerError(err?.message || "An error occurred while saving the clinical resource.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPoints = checklistItems.reduce((acc, i) => acc + (Number(i.weight) || 0), 0);
  const totalCritical = checklistItems.filter((i) => i.is_critical).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl p-0 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="p-5 sm:p-6 bg-gray-50/90 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#194611] flex items-center justify-center shrink-0">
                {materialCategory === "PRACTICAL_ASSESSMENT" ? (
                  <ClipboardCheck className="w-5 h-5 text-rose-600" />
                ) : materialCategory === "EXAMINATION" ? (
                  <Award className="w-5 h-5 text-blue-600" />
                ) : materialCategory === "FACILITATOR_GUIDE" ? (
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                ) : materialCategory === "POWERPOINT_PRESENTATION" ? (
                  <FileText className="w-5 h-5 text-purple-600" />
                ) : (
                  <BookOpen className="w-5 h-5 text-[#194611]" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {isEditing ? "Edit Clinical Resource" : "Add Clinical Resource & Content"}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Category selector is placed at the top; fields and the next page adapt dynamically.
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] bg-white text-gray-700 border-gray-200">
              Page {page} of 2
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        {page === 1 ? (
          <form onSubmit={handleProceedToNextPage} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {serverError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* CATEGORY SELECTOR PLACED RIGHT AT THE VERY TOP */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                Resource Category <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {/* 1. PARTICIPANT_MANUAL */}
                <div
                  onClick={() => handleCategoryChange("PARTICIPANT_MANUAL")}
                  className={cn(
                    "p-2.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between select-none text-left min-h-[92px]",
                    materialCategory === "PARTICIPANT_MANUAL"
                      ? "border-[#194611] bg-emerald-50/60 shadow-2xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <BookOpen className="w-4 h-4 text-[#194611]" />
                  <div className="mt-1.5">
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">Participant Manual</p>
                    <p className="text-[9px] text-gray-500 mt-0.5 leading-none">Reference</p>
                  </div>
                </div>

                {/* 2. POWERPOINT_PRESENTATION */}
                <div
                  onClick={() => handleCategoryChange("POWERPOINT_PRESENTATION")}
                  className={cn(
                    "p-2.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between select-none text-left min-h-[92px]",
                    materialCategory === "POWERPOINT_PRESENTATION"
                      ? "border-purple-600 bg-purple-50/60 shadow-2xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <FileText className="w-4 h-4 text-purple-700" />
                  <div className="mt-1.5">
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">PowerPoint</p>
                    <p className="text-[9px] text-purple-700 font-semibold mt-0.5 leading-none">Course Training</p>
                  </div>
                </div>

                {/* 3. FACILITATOR_GUIDE */}
                <div
                  onClick={() => handleCategoryChange("FACILITATOR_GUIDE")}
                  className={cn(
                    "p-2.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between select-none text-left min-h-[92px]",
                    materialCategory === "FACILITATOR_GUIDE"
                      ? "border-amber-600 bg-amber-50/60 shadow-2xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <div className="mt-1.5">
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">Facilitator Guide</p>
                    <p className="text-[9px] text-amber-800 font-bold mt-0.5 leading-none">Mentor Only</p>
                  </div>
                </div>

                {/* 4. EXAMINATION */}
                <div
                  onClick={() => handleCategoryChange("EXAMINATION")}
                  className={cn(
                    "p-2.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between select-none text-left min-h-[92px]",
                    materialCategory === "EXAMINATION"
                      ? "border-blue-600 bg-blue-50/60 shadow-2xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <Award className="w-4 h-4 text-blue-700" />
                  <div className="mt-1.5">
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">Examination</p>
                    <p className="text-[9px] text-blue-700 font-medium mt-0.5 leading-none">Pre/Post Test</p>
                  </div>
                </div>

                {/* 5. PRACTICAL_ASSESSMENT */}
                <div
                  onClick={() => handleCategoryChange("PRACTICAL_ASSESSMENT")}
                  className={cn(
                    "p-2.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between select-none text-left min-h-[92px]",
                    materialCategory === "PRACTICAL_ASSESSMENT"
                      ? "border-rose-600 bg-rose-50/60 shadow-2xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <ClipboardCheck className="w-4 h-4 text-rose-700" />
                  <div className="mt-1.5">
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">Practical OSCE</p>
                    <p className="text-[9px] text-rose-700 font-bold mt-0.5 leading-none">Skill Checklist</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ASSOCIATED LEARNING MODULE SELECTOR */}
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="res-module" className="text-xs font-semibold text-gray-700">
                Associated Learning Module <span className="text-red-500">*</span>
              </Label>
              <select
                id="res-module"
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value);
                  if (errors.moduleId) setErrors((prev) => ({ ...prev, moduleId: undefined }));
                }}
                className={cn(
                  "h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#194611]",
                  errors.moduleId && "border-red-500 focus:ring-red-500"
                )}
              >
                <option value="">Select a learning module...</option>
                {availableModules.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    #{mod.id} - {mod.title}
                  </option>
                ))}
              </select>
              {errors.moduleId && (
                <p className="text-[11px] font-medium text-red-600">{errors.moduleId}</p>
              )}
            </div>

            {/* DYNAMIC FIELDS CONDITIONALLY RENDERED */}
            <div className="pt-2 border-t border-gray-100 space-y-4">
              {/* CASE 1: EXAMINATION SUB-SELECTORS */}
              {materialCategory === "EXAMINATION" && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div>
                    <Label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Examination Component <span className="text-red-500">*</span>
                    </Label>
                    <select
                      value={examSubcategory}
                      onChange={(e) => {
                        const val = e.target.value as ExamSubcategory;
                        setExamSubcategory(val);
                        setIsRequired(val === "EXAM_QUESTIONS");
                        setTitle(`Course Examination ${val === "ANSWER_KEY" ? "Answer Key" : "Questions"}`);
                      }}
                      className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#194611]"
                    >
                      <option value="EXAM_QUESTIONS">Course Examination Paper (Questions)</option>
                      <option value="ANSWER_KEY">Official Answer Key (Mentor/Admin Only)</option>
                    </select>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 bg-blue-100/70 border border-blue-200 rounded-lg text-blue-900 text-xs">
                    <Award className="w-4 h-4 shrink-0 text-blue-700 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      <strong>Unified Course Examination:</strong> Pre-Test and Post-Test use the same exam paper (questions and choices are automatically shuffled by the system for mentees). Only one exam document needs to be uploaded.
                    </span>
                  </div>

                  {examSubcategory === "ANSWER_KEY" && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-100/90 p-2.5 rounded-lg border border-amber-300">
                      <Lock className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                      <span>
                        Confidential Answer Key: Locked until mentees complete their examination.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* CASE 2: FACILITATOR GUIDE WARNING BADGE */}
              {materialCategory === "FACILITATOR_GUIDE" && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>
                    <strong>Mentor Only — Hidden from Mentees:</strong> Facilitator guides are restricted to preceptor dashboards.
                  </span>
                </div>
              )}

              {/* CASE 3: PRACTICAL ASSESSMENT (LINKED TO SPECIFIC TOPIC/RESOURCE UNDER MODULE) */}
              {materialCategory === "PRACTICAL_ASSESSMENT" && (
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-900 text-xs font-bold">
                      <ClipboardCheck className="w-4 h-4 text-rose-700" />
                      <span>Topic / Resource Practical Skill Scope</span>
                    </div>
                    <Badge className="bg-rose-600 text-white text-[9px]">OSCE Checklist</Badge>
                  </div>

                  {/* Topic / Resource under the Module */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-800">
                      Evaluate Topic / Resource under this Module <span className="text-red-500">*</span>
                    </Label>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => handleTopicChange(e.target.value)}
                      className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-xs"
                    >
                      <option value="">Select topic/resource under this module...</option>
                      {moduleTopics.map((topic) => (
                        <option key={topic.id} value={topic.title}>
                          Topic: {topic.title}
                        </option>
                      ))}
                      <option value="__custom__">+ Custom Clinical Topic / Procedure...</option>
                    </select>
                    <p className="text-[10px] text-gray-500">
                      Links this practical checklist to the specific topic or skill taught in this module.
                    </p>
                  </div>

                  {/* Custom Procedure Input if selected or no existing topic picked */}
                  {(selectedTopicId === "__custom__" || moduleTopics.length === 0) && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-800">
                        Clinical Procedure / Practical Skill Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g., Active Management of Third Stage of Labor (AMTSL)"
                        value={selectedTopicId === "__custom__" ? customTopicName : procedureName}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (selectedTopicId === "__custom__") setCustomTopicName(val);
                          setProcedureName(val);
                          if (errors.procedure) setErrors((prev) => ({ ...prev, procedure: undefined }));
                        }}
                        className="h-9 text-xs bg-white"
                      />
                      {errors.procedure && (
                        <p className="text-[11px] font-medium text-red-600">{errors.procedure}</p>
                      )}
                    </div>
                  )}

                  {/* Benchmark Level */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-800">
                      Target Competency Benchmark
                    </Label>
                    <select
                      value={practicalBenchmark}
                      onChange={(e) => setPracticalBenchmark(e.target.value)}
                      className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-xs"
                    >
                      <option value="Level 1 (Novice)">Level 1 (Novice)</option>
                      <option value="Level 2 (Advanced Beginner)">Level 2 (Advanced Beginner)</option>
                      <option value="Level 3 (Competent Benchmark)">Level 3 (Competent — National Benchmark)</option>
                      <option value="Level 4 (Proficient)">Level 4 (Proficient)</option>
                      <option value="Level 5 (Master / Expert)">Level 5 (Master / Expert)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <Label htmlFor="res-title" className="text-xs font-semibold text-gray-700">
                  {materialCategory === "PRACTICAL_ASSESSMENT"
                    ? "Checklist Title"
                    : materialCategory === "EXAMINATION"
                    ? "Examination Title"
                    : "Resource Title"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="res-title"
                  placeholder="e.g., Postpartum Hemorrhage Clinical Guidelines"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  className={cn(
                    "h-10 text-sm bg-white border-gray-200 focus-visible:ring-[#194611]",
                    errors.title && "border-red-300 focus-visible:ring-red-400"
                  )}
                />
                {errors.title && (
                  <p className="text-[11px] font-medium text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <Label htmlFor="res-desc" className="text-xs font-semibold text-gray-700">
                  Instructions / Guidance (Optional)
                </Label>
                <Textarea
                  id="res-desc"
                  rows={2}
                  placeholder="Instructions for preceptors and mentees..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs bg-white border-gray-200 focus-visible:ring-[#194611]"
                />
              </div>

              {/* Required Completion Checkbox */}
              {materialCategory !== "PRACTICAL_ASSESSMENT" && (
                <label
                  className={cn(
                    "flex items-center gap-2 text-xs text-gray-800 cursor-pointer pt-1",
                    (materialCategory === "FACILITATOR_GUIDE" ||
                      (materialCategory === "EXAMINATION" && examSubcategory === "ANSWER_KEY")) &&
                      "opacity-60 cursor-not-allowed"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={
                      materialCategory === "FACILITATOR_GUIDE" ||
                      (materialCategory === "EXAMINATION" && examSubcategory === "ANSWER_KEY")
                        ? false
                        : isRequired
                    }
                    disabled={
                      materialCategory === "FACILITATOR_GUIDE" ||
                      (materialCategory === "EXAMINATION" && examSubcategory === "ANSWER_KEY")
                    }
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#194611] focus:ring-[#194611]"
                  />
                  <span>Required for mentee module completion</span>
                </label>
              )}
            </div>

            {/* Modal Footer Page 1 */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-4 text-xs font-medium rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 px-5 text-xs font-semibold rounded-xl bg-[#194611] hover:bg-[#14380e] text-white shadow-xs cursor-pointer flex items-center gap-2"
              >
                <span>
                  {materialCategory === "PRACTICAL_ASSESSMENT"
                    ? "Continue to OSCE Checklist Builder"
                    : materialCategory === "EXAMINATION"
                    ? "Continue to Exam Setup"
                    : "Continue to Document Upload"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        ) : (
          /* PAGE 2: TAILORED NEXT PAGE (DOCUMENT UPLOAD OR OSCE CHECKLIST BUILDER) */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {serverError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Top Bar on Page 2 */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPage(1)}
                className="text-xs text-gray-600 hover:text-gray-900 h-8 px-2 -ml-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Category & Metadata
              </Button>

              <Badge className="bg-[#194611] text-white text-[10px]">
                {materialCategory.replace(/_/g, " ")}
              </Badge>
            </div>

            {/* VIEW 1: OSCE PRACTICAL CHECKLIST BUILDER */}
            {materialCategory === "PRACTICAL_ASSESSMENT" ? (
              <div className="space-y-4">
                {/* Header with Procedure & Presets */}
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <p className="text-xs font-bold text-rose-950">
                      Topic: {selectedTopicId === "__custom__" ? customTopicName : procedureName}
                    </p>
                    <p className="text-[11px] text-rose-800">
                      Benchmark: {practicalBenchmark}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLoadPresets}
                    className="bg-white border-rose-300 text-rose-900 hover:bg-rose-100 text-xs h-7"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-rose-600" />
                    Load Standard Midwifery Steps
                  </Button>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-lg border text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500">Steps:</span>{" "}
                    <strong>{checklistItems.length}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500">Total Points:</span>{" "}
                    <strong className="text-emerald-800">{totalPoints} pts</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500">Critical:</span>{" "}
                    <strong className="text-amber-800">{totalCritical}</strong>
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-2.5">
                  {checklistItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 rounded-xl border space-y-2",
                        item.is_critical ? "bg-amber-50/50 border-amber-300" : "bg-white border-gray-200"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-1">
                          {index + 1}
                        </span>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            rows={2}
                            placeholder={`Step ${index + 1}: e.g. Prepares sterile instruments and sterile gloves...`}
                            value={item.item_text}
                            onChange={(e) =>
                              handleUpdateChecklistItem(item.id, "item_text", e.target.value)
                            }
                            className="text-xs bg-white"
                          />

                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] text-gray-600">Points:</span>
                                <Input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={item.weight}
                                  onChange={(e) =>
                                    handleUpdateChecklistItem(
                                      item.id,
                                      "weight",
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  className="h-7 w-16 text-xs text-center bg-white"
                                />
                              </div>

                              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.is_critical}
                                  onChange={(e) =>
                                    handleUpdateChecklistItem(item.id, "is_critical", e.target.checked)
                                  }
                                  className="h-3.5 w-3.5 rounded border-amber-400 text-amber-600"
                                />
                                <span
                                  className={cn(
                                    item.is_critical ? "text-amber-900 font-bold" : "text-gray-600"
                                  )}
                                >
                                  Critical Step (Must Pass)
                                </span>
                              </label>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveChecklistRow(item.id)}
                              className="text-gray-400 hover:text-red-600 text-xs h-6 px-1.5"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddChecklistRow}
                    className="w-full border-dashed border-gray-300 text-xs text-gray-700 h-8"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-[#194611]" />
                    Add Checklist Step
                  </Button>
                </div>
              </div>
            ) : (
              /* VIEW 2: TAILORED DOCUMENT / PRESENTATION / EXAM UPLOAD */
              <div className="space-y-4">
                {materialCategory === "FACILITATOR_GUIDE" && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Mentor Only — This guide will be hidden from mentees.</span>
                  </div>
                )}

                {materialCategory === "EXAMINATION" && examSubcategory === "ANSWER_KEY" && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Locked Until Post-Exam Completion (Encrypted from mentees).</span>
                  </div>
                )}

                {/* Upload Area */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-800">
                    Upload {materialCategory === "POWERPOINT_PRESENTATION" ? "Presentation Deck" : "Document"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept={getAcceptedExtensions()}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {!selectedFile && !existingFileName ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2",
                        isDragOver
                          ? "border-[#194611] bg-emerald-50/70"
                          : errors.fileOrUrl
                          ? "border-red-400 bg-red-50/20"
                          : "border-gray-300 bg-gray-50/50 hover:bg-gray-100/60"
                      )}
                    >
                      <UploadCloud className="w-8 h-8 text-[#194611]" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          Click to browse or drag and drop file here
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {materialCategory === "POWERPOINT_PRESENTATION"
                            ? "PPT, PPTX or PDF slides"
                            : "PDF or Word documents"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-5 h-5 text-[#194611] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {selectedFile?.name || existingFileName}
                          </p>
                          {selectedFile && (
                            <p className="text-[10px] text-gray-500">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-7 text-[11px] border-gray-300"
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedFile(null);
                            setExistingFileName(null);
                          }}
                          className="h-7 w-7 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {errors.fileOrUrl && (
                    <p className="text-[11px] font-medium text-red-600">{errors.fileOrUrl}</p>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer Page 2 */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage(1)}
                className="h-10 px-4 text-xs font-medium rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Metadata
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-10 px-3 text-xs text-gray-500"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 text-xs font-semibold rounded-xl bg-[#194611] hover:bg-[#14380e] text-white shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : materialCategory === "PRACTICAL_ASSESSMENT" ? (
                    <>
                      <span>Save & Publish Practical Checklist</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>{isEditing ? "Save Changes" : "Publish Resource"}</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
