"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  createModule,
  addContent,
  CreateModulePayload,
  AddContentPayload,
} from "@/services/super-admin.service";
import {
  createPracticalChecklist,
  type PracticalChecklistItem,
} from "@/services/practical-checklists.service";
import { detectBackendResourceType } from "@/services/resources.service";
import type { ThematicArea } from "@/types/thematic-area";
import type { LearningMaterialCategory } from "@/types/resource";
import {
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileText,
  Video,
  Headphones,
  Globe,
  X,
  Loader2,
  Sparkles,
  Layers,
  Lock,
  BookOpen,
  Info,
  ExternalLink,
  Award,
  Plus,
  Trash2,
  ShieldAlert,
  ClipboardCheck,
  CheckSquare,
  HelpCircle,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type MaterialTypeOption = "pdf" | "video" | "audio" | "presentation" | "link";

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

interface CreateModuleWizardClientProps {
  thematicAreas: ThematicArea[];
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

export function CreateModuleWizardClient({ thematicAreas }: CreateModuleWizardClientProps) {
  const router = useRouter();

  // Wizard Navigation State
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [isStep2Unlocked, setIsStep2Unlocked] = useState(false);

  // Step 2 internal page: 1 = Category & Metadata, 2 = Tailored Upload / Builder
  const [step2Page, setStep2Page] = useState<1 | 2>(1);

  // Step 1 Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thematicAreaId, setThematicAreaId] = useState("");
  const [step1Errors, setStep1Errors] = useState<{
    title?: string;
    description?: string;
    thematicAreaId?: string;
  }>({});
  const [isSubmittingStep1, setIsSubmittingStep1] = useState(false);

  // Stored Created Module State
  const [createdModuleId, setCreatedModuleId] = useState<string | number | null>(null);
  const [createdModuleTitle, setCreatedModuleTitle] = useState("");

  // Step 2 Category Selector (Placed right at the very top of form 2)
  const [materialCategory, setMaterialCategory] =
    useState<WizardMaterialCategory>("PARTICIPANT_MANUAL");

  // Examination Subcategory & Stage
  const [examSubcategory, setExamSubcategory] = useState<ExamSubcategory>("EXAM_QUESTIONS");
  const [examinationStage, setExaminationStage] = useState<"PRETEST" | "POST_TEST">("PRETEST");

  // Practical Assessment Fields
  const [moduleTopicName, setModuleTopicName] = useState("");
  const [procedureName, setProcedureName] = useState("");
  const [practicalBenchmark, setPracticalBenchmark] = useState("Level 3 (Competent Benchmark)");
  const [checklistItems, setChecklistItems] = useState<ChecklistRowItem[]>(DEFAULT_OSCE_PRESETS);

  // General Metadata Fields
  const [materialType, setMaterialType] = useState<MaterialTypeOption>("pdf");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [isRequired, setIsRequired] = useState(true);

  // Upload Fields for Next Page
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Errors & Loading
  const [step2Errors, setStep2Errors] = useState<{
    materialTitle?: string;
    procedureName?: string;
    fileOrUrl?: string;
    checklist?: string;
  }>({});
  const [isSubmittingStep2, setIsSubmittingStep2] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build thematic area options for SearchableSelect
  const thematicAreaOptions = thematicAreas.map((area) => ({
    value: String(area.id),
    label: area.name,
    description: area.code ? `Domain Code: ${area.code}` : undefined,
  }));

  // Auto-dismiss toast
  React.useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Handle Category Change & Adapt Default Settings
  const handleCategoryChange = (newCat: WizardMaterialCategory) => {
    setMaterialCategory(newCat);
    setStep2Errors({});

    if (newCat === "POWERPOINT_PRESENTATION") {
      setMaterialType("presentation");
      setIsRequired(true);
      if (!materialTitle || materialTitle.includes("Manual") || materialTitle.includes("Guide")) {
        setMaterialTitle(`${title.trim() || "Clinical Training"} - Presentation Slides`);
      }
    } else if (newCat === "FACILITATOR_GUIDE") {
      setMaterialType("pdf");
      setIsRequired(false); // Mentor only, not required for mentee completion
      if (!materialTitle || materialTitle.includes("Manual") || materialTitle.includes("Slides")) {
        setMaterialTitle(`${title.trim() || "Clinical Module"} - Facilitator Guide (Mentor Only)`);
      }
    } else if (newCat === "EXAMINATION") {
      setMaterialType("pdf");
      setIsRequired(examSubcategory === "EXAM_QUESTIONS");
      if (!materialTitle || materialTitle.includes("Manual") || materialTitle.includes("Slides")) {
        setMaterialTitle(
          `${title.trim() || "Clinical Module"} - Course Examination`
        );
      }
    } else if (newCat === "PRACTICAL_ASSESSMENT") {
      setMaterialType("pdf");
      setIsRequired(true);
      if (!procedureName) {
        setProcedureName(title.trim() || "Standard Clinical Midwifery Procedure");
      }
      if (!materialTitle || materialTitle.includes("Manual") || materialTitle.includes("Slides")) {
        setMaterialTitle(`${title.trim() || "Clinical Skill"} - OSCE Practical Competency Checklist`);
      }
    } else {
      // PARTICIPANT_MANUAL
      setMaterialType("pdf");
      setIsRequired(true);
      if (!materialTitle || materialTitle.includes("Guide") || materialTitle.includes("Slides")) {
        setMaterialTitle(`${title.trim() || "Clinical Module"} - Participant Manual`);
      }
    }
  };

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const errors: { title?: string; description?: string; thematicAreaId?: string } = {};

    if (!title.trim()) {
      errors.title = "Module Title is required.";
    } else if (title.trim().length < 3) {
      errors.title = "Module Title must be at least 3 characters.";
    }

    if (!description.trim()) {
      errors.description = "Module Description is required.";
    } else if (description.trim().length < 10) {
      errors.description = "Module Description must be at least 10 characters.";
    }

    if (!thematicAreaId) {
      errors.thematicAreaId = "Please select a Thematic Area.";
    }

    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Step 1 Submission
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setIsSubmittingStep1(true);
    setToastMessage(null);

    try {
      const payload: CreateModulePayload = {
        title: title.trim(),
        description: description.trim(),
        thematicAreaId: thematicAreaId,
        status: "published",
      };

      const result = await createModule(payload);

      if (result.success && result.moduleId) {
        setCreatedModuleId(result.moduleId);
        setCreatedModuleTitle(title.trim());
        setIsStep2Unlocked(true);
        setActiveStep(2);
        setStep2Page(1); // Start on Category & Metadata page

        // Prepopulate titles based on module title
        if (!materialTitle) {
          setMaterialTitle(`${title.trim()} - Participant Manual`);
        }
        if (!procedureName) {
          setProcedureName(title.trim());
        }

        setToastMessage({
          type: "success",
          text: `Module created successfully (ID #${result.moduleId})! Select content category to configure.`,
        });
      } else {
        throw new Error(result.message || "Failed to create module.");
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to create module. Please review inputs.",
      });
    } finally {
      setIsSubmittingStep1(false);
    }
  };

  // Validate Page 1 of Step 2 (Category & Metadata)
  const validateStep2Page1 = (): boolean => {
    const errors: { materialTitle?: string; procedureName?: string } = {};

    if (!materialTitle.trim()) {
      errors.materialTitle = "Title is required.";
    }

    if (materialCategory === "PRACTICAL_ASSESSMENT" && !procedureName.trim()) {
      errors.procedureName = "Clinical Procedure Name is required for practical assessment.";
    }

    setStep2Errors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // Proceed to Step 2 Page 2 (The Next Page)
  const handleProceedToNextPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2Page1()) return;
    setStep2Page(2);
  };

  // Validate Page 2 of Step 2
  const validateStep2Page2 = (): boolean => {
    const errors: { fileOrUrl?: string; checklist?: string } = {};

    if (materialCategory === "PRACTICAL_ASSESSMENT") {
      if (checklistItems.length === 0) {
        errors.checklist = "At least one OSCE checklist step is required.";
      } else {
        const emptyItems = checklistItems.some((item) => !item.item_text.trim());
        if (emptyItems) {
          errors.checklist = "All checklist steps must have a description.";
        }
      }
    } else {
      if (!selectedFile) {
        if (materialCategory === "EXAMINATION") {
          errors.fileOrUrl =
            examSubcategory === "EXAM_QUESTIONS"
              ? "Please upload the examination question bank or exam paper document."
              : "Please upload the official answer key document.";
        } else if (materialCategory === "POWERPOINT_PRESENTATION") {
          errors.fileOrUrl = "Please upload presentation slide deck file (.ppt, .pptx, or .pdf).";
        } else {
          errors.fileOrUrl = "Please select or upload a file for this learning material.";
        }
      }
    }

    setStep2Errors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // Drag and Drop Handlers
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        setSelectedFile(file);
        setStep2Errors((prev) => ({ ...prev, fileOrUrl: undefined }));
      }
    },
    []
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setStep2Errors((prev) => ({ ...prev, fileOrUrl: undefined }));
    }
  };

  // Determine accepted file extensions
  const getAcceptedExtensions = (): string => {
    switch (materialCategory) {
      case "POWERPOINT_PRESENTATION":
        return ".ppt,.pptx,.pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf";
      case "EXAMINATION":
      case "FACILITATOR_GUIDE":
      case "PARTICIPANT_MANUAL":
      case "PRACTICAL_ASSESSMENT":
      default:
        return ".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
  };

  // OSCE Checklist Builder Handlers
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
    setStep2Errors((prev) => ({ ...prev, checklist: undefined }));
  };

  const handleRemoveChecklistRow = (id: string) => {
    if (checklistItems.length <= 1) {
      setToastMessage({
        type: "error",
        text: "The practical assessment checklist must have at least one step.",
      });
      return;
    }
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateChecklistItem = (
    id: string,
    field: keyof ChecklistRowItem,
    value: any
  ) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    if (field === "item_text" && value.trim()) {
      setStep2Errors((prev) => ({ ...prev, checklist: undefined }));
    }
  };

  const handleLoadPresets = () => {
    setChecklistItems(DEFAULT_OSCE_PRESETS);
    setToastMessage({
      type: "success",
      text: "Loaded 5 standard midwifery clinical OSCE checklist steps.",
    });
  };

  // Submit Step 2 (Final Save)
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdModuleId) {
      setToastMessage({
        type: "error",
        text: "Module information must be saved first in Step 1.",
      });
      setActiveStep(1);
      return;
    }

    if (!validateStep2Page2()) return;

    setIsSubmittingStep2(true);
    setToastMessage(null);

    try {
      if (materialCategory === "PRACTICAL_ASSESSMENT") {
        const effectiveTopic = moduleTopicName.trim() || procedureName.trim();

        // 1. Create the versioned practical assessment checklist on the backend
        const checklistPayload = {
          thematic_area_id: Number(thematicAreaId) || 1,
          procedure: effectiveTopic,
          title: materialTitle.trim(),
          description: `Topic/Resource: ${effectiveTopic}. Benchmark: ${practicalBenchmark}. ${materialDescription.trim()}`.trim(),
          items: checklistItems.map((item) => ({
            item_text: item.item_text.trim(),
            is_required: true,
            is_critical: item.is_critical,
            weight: item.weight,
          })),
        };

        await createPracticalChecklist(checklistPayload);

        // 2. Attach content entry to the module so it appears in the curriculum syllabus
        const contentPayload: AddContentPayload = {
          title: `[OSCE] ${materialTitle.trim()}`,
          type: "document",
          description: `Topic/Skill: ${effectiveTopic}. ${checklistItems.length} clinical observation steps (${checklistItems.filter((i) => i.is_critical).length} critical steps). Benchmark: ${practicalBenchmark}. ${materialDescription.trim()}`,
          order: 1,
          isRequired: true,
          category: "PRACTICAL_ASSESSMENT",
          thematicAreaId,
          file: selectedFile || undefined,
        };

        await addContent(createdModuleId, contentPayload);

        setToastMessage({
          type: "success",
          text: "Module & OSCE Practical Assessment Checklist published successfully! Redirecting...",
        });
      } else {
        // Standard Material / Presentation / Facilitator Guide / Examination
        const targetCategory: LearningMaterialCategory =
          materialCategory === "EXAMINATION" && examSubcategory === "ANSWER_KEY"
            ? "ANSWER_KEY"
            : (materialCategory as LearningMaterialCategory);

        const effectiveType = detectBackendResourceType(materialType, selectedFile);
        const contentPayload: AddContentPayload = {
          title: materialTitle.trim(),
          type: effectiveType,
          description: materialDescription.trim() || undefined,
          file: selectedFile || undefined,
          url: undefined,
          order: 1,
          isRequired:
            targetCategory === "FACILITATOR_GUIDE" || targetCategory === "ANSWER_KEY"
              ? false
              : isRequired,
          category: targetCategory,
          examinationStage: materialCategory === "EXAMINATION" ? examinationStage : undefined,
          thematicAreaId,
        };

        const result = await addContent(createdModuleId, contentPayload);

        if (!result.success) {
          throw new Error(result.message || "Failed to attach learning material.");
        }

        setToastMessage({
          type: "success",
          text: "Module & Learning Material published successfully! Redirecting...",
        });
      }

      setTimeout(() => {
        router.push(`/learning/modules/${createdModuleId}`);
      }, 1200);
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to save material. Please verify inputs.",
      });
    } finally {
      setIsSubmittingStep2(false);
    }
  };

  // Calculations for OSCE Summary
  const totalChecklistPoints = checklistItems.reduce((acc, i) => acc + (Number(i.weight) || 0), 0);
  const totalCriticalSteps = checklistItems.filter((i) => i.is_critical).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-gray-900 transition">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/learning/modules" className="hover:text-gray-900 transition">
            Learning Modules
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#194611]">Create Module</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-[#194611] border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-[#194611]" />
                Super Admin Curriculum Wizard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#194611]">
              Create Learning Module & Curriculum
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              Configure standardized clinical competencies, select resource categories, and build tailored OSCE checklists or examination papers.
            </p>
          </div>

          <Link
            href="/learning/modules"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-gray-200 text-gray-600 hover:text-gray-900 h-9 text-xs"
            )}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Cancel & Return
          </Link>
        </div>
      </div>

      {/* 2-Step Progress Stepper */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
          {/* Step 1 Indicator */}
          <div
            onClick={() => setActiveStep(1)}
            className={cn(
              "flex items-center gap-3.5 p-3 rounded-lg transition cursor-pointer select-none border",
              activeStep === 1
                ? "bg-emerald-50/60 border-[#194611]/30 ring-1 ring-[#194611]/20"
                : isStep2Unlocked
                ? "bg-gray-50/80 border-gray-200 hover:bg-gray-100"
                : "bg-white border-transparent"
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all shadow-2xs",
                isStep2Unlocked
                  ? "bg-emerald-600 text-white"
                  : activeStep === 1
                  ? "bg-[#194611] text-white"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {isStep2Unlocked ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  activeStep === 1 ? "text-[#194611]" : "text-gray-500"
                )}
              >
                Step 1
              </p>
              <h3 className="text-sm font-bold text-gray-900 truncate">
                Module Information
              </h3>
              <p className="text-[11px] text-gray-500 truncate">
                Title, description & clinical thematic area
              </p>
            </div>
          </div>

          {/* Step 2 Indicator */}
          <div
            onClick={() => {
              if (isStep2Unlocked) setActiveStep(2);
            }}
            className={cn(
              "flex items-center gap-3.5 p-3 rounded-lg transition border",
              !isStep2Unlocked && "opacity-60 cursor-not-allowed border-transparent bg-gray-50/40",
              isStep2Unlocked &&
                (activeStep === 2
                  ? "bg-emerald-50/60 border-[#194611]/30 ring-1 ring-[#194611]/20 cursor-pointer"
                  : "bg-gray-50/80 border-gray-200 hover:bg-gray-100 cursor-pointer")
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all shadow-2xs",
                activeStep === 2
                  ? "bg-[#194611] text-white"
                  : isStep2Unlocked
                  ? "bg-[#FDD028] text-gray-900"
                  : "bg-gray-200 text-gray-400"
              )}
            >
              {!isStep2Unlocked ? <Lock className="w-4 h-4" /> : "2"}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  activeStep === 2 ? "text-[#194611]" : "text-gray-500"
                )}
              >
                Step 2
              </p>
              <h3 className="text-sm font-bold text-gray-900 truncate">
                Category & Curriculum Content
              </h3>
              <p className="text-[11px] text-gray-500 truncate">
                Manuals, slides, guides, exams, or practical OSCE
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: MODULE INFORMATION FORM */}
      {activeStep === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-6">
          <Card className="border-gray-200/90 shadow-2xs bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-[#194611]">
                    Module Information
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-0.5">
                    Enter the core identifier, clinical domain, and detailed syllabus description.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-emerald-200 text-[#194611] bg-emerald-50">
                  Required Step
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Module Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                  <span>
                    Module Title <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    {title.length}/120 characters
                  </span>
                </label>
                <Input
                  type="text"
                  maxLength={120}
                  placeholder="e.g., Active Management of Third Stage of Labor (AMTSL)"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (step1Errors.title) {
                      setStep1Errors((prev) => ({ ...prev, title: undefined }));
                    }
                  }}
                  className={cn(
                    "h-10 text-sm bg-white",
                    step1Errors.title
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-gray-200 focus-visible:ring-[#194611]"
                  )}
                />
                {step1Errors.title && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {step1Errors.title}
                  </p>
                )}
                <p className="text-[11px] text-gray-500">
                  Provide a concise, standard clinical title aligned with national adolescent and maternal care curricula.
                </p>
              </div>

              {/* Thematic Area Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800">
                  Thematic Area <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={thematicAreaOptions}
                  value={thematicAreaId}
                  onChange={(val) => {
                    setThematicAreaId(val);
                    if (step1Errors.thematicAreaId) {
                      setStep1Errors((prev) => ({ ...prev, thematicAreaId: undefined }));
                    }
                  }}
                  placeholder="Select a thematic curriculum area (e.g. Surgical Procedures, Maternal Health)..."
                  searchPlaceholder="Search thematic areas..."
                  error={Boolean(step1Errors.thematicAreaId)}
                  className="bg-white text-sm"
                />
                {step1Errors.thematicAreaId && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {step1Errors.thematicAreaId}
                  </p>
                )}
                <p className="text-[11px] text-gray-500">
                  Categorizes this module under the designated clinical specialty for preceptor assignment and competency tracking.
                </p>
              </div>

              {/* Description Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                  <span>
                    Description & Syllabus Overview <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    {description.length} characters
                  </span>
                </label>
                <Textarea
                  rows={4}
                  placeholder="Detail the clinical objectives, competency requirements, surgical procedures, and learning outcomes for midwives..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (step1Errors.description) {
                      setStep1Errors((prev) => ({ ...prev, description: undefined }));
                    }
                  }}
                  className={cn(
                    "text-sm bg-white resize-y",
                    step1Errors.description
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-gray-200 focus-visible:ring-[#194611]"
                  )}
                />
                {step1Errors.description && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {step1Errors.description}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="py-4 px-6 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Saving creates the module record and unlocks the content configuration form.
              </p>
              <Button
                type="submit"
                disabled={isSubmittingStep1}
                className="bg-[#194611] hover:bg-[#13360d] text-white shadow-2xs font-semibold px-5 h-10 cursor-pointer"
              >
                {isSubmittingStep1 ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Module...
                  </>
                ) : (
                  <>
                    Save & Proceed to Content
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* STEP 2: CONTENT CREATION FLOW */}
      {activeStep === 2 && (
        <div className="space-y-6">
          {/* Confirmed Module Context Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Module Created • ID #{createdModuleId}
                </p>
                <h4 className="text-sm font-bold text-emerald-900 truncate max-w-md">
                  {createdModuleTitle || title}
                </h4>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveStep(1)}
              className="border-emerald-300 text-emerald-900 hover:bg-emerald-100/80 text-xs h-8"
            >
              Edit Module Info
            </Button>
          </div>

          {/* PAGE 1: CATEGORY SELECTOR AT VERY TOP & CONDITIONAL METADATA */}
          {step2Page === 1 && (
            <form onSubmit={handleProceedToNextPage} className="space-y-6">
              <Card className="border-gray-200/90 shadow-2xs bg-white">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-[#194611]">
                        Content Category & Metadata
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 mt-0.5">
                        Select the resource category at the top; all fields and the next page adapt dynamically.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50">
                      Step 2 of 2 • Setup
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {/* CATEGORY SELECTOR PLACED RIGHT AT THE VERY TOP */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Select Category <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-gray-500">
                        Controls subsequent fields and next page layout
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                      {/* 1. PARTICIPANT_MANUAL */}
                      <div
                        onClick={() => handleCategoryChange("PARTICIPANT_MANUAL")}
                        className={cn(
                          "p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[120px] select-none",
                          materialCategory === "PARTICIPANT_MANUAL"
                            ? "border-[#194611] bg-emerald-50/60 shadow-xs ring-1 ring-[#194611]/20"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#194611] flex items-center justify-center">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          {materialCategory === "PARTICIPANT_MANUAL" && (
                            <CheckCircle2 className="w-4 h-4 text-[#194611]" />
                          )}
                        </div>
                        <div className="mt-2.5">
                          <h4 className="text-xs font-bold text-gray-900 leading-snug">
                            Participant Manual
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                            Clinical reference & student guide
                          </p>
                        </div>
                      </div>

                      {/* 2. POWERPOINT_PRESENTATION */}
                      <div
                        onClick={() => handleCategoryChange("POWERPOINT_PRESENTATION")}
                        className={cn(
                          "p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[120px] select-none",
                          materialCategory === "POWERPOINT_PRESENTATION"
                            ? "border-[#194611] bg-purple-50/60 shadow-xs ring-1 ring-[#194611]/20"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                          </div>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-purple-50 text-purple-700 border-purple-200">
                            Course Training
                          </Badge>
                        </div>
                        <div className="mt-2.5">
                          <h4 className="text-xs font-bold text-gray-900 leading-snug">
                            PowerPoint Slides
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                            Interactive training slide deck
                          </p>
                        </div>
                      </div>

                      {/* 3. FACILITATOR_GUIDE */}
                      <div
                        onClick={() => handleCategoryChange("FACILITATOR_GUIDE")}
                        className={cn(
                          "p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[120px] select-none",
                          materialCategory === "FACILITATOR_GUIDE"
                            ? "border-amber-600 bg-amber-50/60 shadow-xs ring-1 ring-amber-500/20"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-100 text-amber-900 border-amber-300 font-semibold">
                            Mentor Only
                          </Badge>
                        </div>
                        <div className="mt-2.5">
                          <h4 className="text-xs font-bold text-gray-900 leading-snug">
                            Facilitator Guide
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                            Hidden from mentees
                          </p>
                        </div>
                      </div>

                      {/* 4. EXAMINATION */}
                      <div
                        onClick={() => handleCategoryChange("EXAMINATION")}
                        className={cn(
                          "p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[120px] select-none",
                          materialCategory === "EXAMINATION"
                            ? "border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-500/20"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                            <Award className="w-4 h-4" />
                          </div>
                          {materialCategory === "EXAMINATION" && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="mt-2.5">
                          <h4 className="text-xs font-bold text-gray-900 leading-snug">
                            Examination
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                            Pre/Post Theory & Keys
                          </p>
                        </div>
                      </div>

                      {/* 5. PRACTICAL_ASSESSMENT (NEW) */}
                      <div
                        onClick={() => handleCategoryChange("PRACTICAL_ASSESSMENT")}
                        className={cn(
                          "p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[120px] select-none",
                          materialCategory === "PRACTICAL_ASSESSMENT"
                            ? "border-rose-600 bg-rose-50/60 shadow-xs ring-1 ring-rose-500/20"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                            <ClipboardCheck className="w-4 h-4" />
                          </div>
                          <Badge className="text-[9px] px-1 py-0 bg-rose-600 text-white font-bold">
                            New • OSCE
                          </Badge>
                        </div>
                        <div className="mt-2.5">
                          <h4 className="text-xs font-bold text-gray-900 leading-snug">
                            Practical OSCE
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                            Dynamic skill checklist
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DYNAMIC FIELDS CONDITIONALLY RENDERED BASED ON SELECTED CATEGORY */}
                  <div className="pt-4 border-t border-gray-100 space-y-5">
                    {/* CASE 1: EXAMINATION SPECIFIC SUB-SELECTORS */}
                    {materialCategory === "EXAMINATION" && (
                      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-4">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-blue-700" />
                          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                            Examination Architecture & Subcategory
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Subcategory: Questions vs Answer Key */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-800">
                              Examination Subcategory <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setExamSubcategory("EXAM_QUESTIONS");
                                  setIsRequired(true);
                                }}
                                className={cn(
                                  "py-2 px-3 text-xs font-semibold rounded-lg border transition text-center",
                                  examSubcategory === "EXAM_QUESTIONS"
                                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                )}
                              >
                                Questions (EXAM_QUESTIONS)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setExamSubcategory("ANSWER_KEY");
                                  setIsRequired(false);
                                }}
                                className={cn(
                                  "py-2 px-3 text-xs font-semibold rounded-lg border transition text-center",
                                  examSubcategory === "ANSWER_KEY"
                                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                )}
                              >
                                Answer Key (ANSWER_KEY)
                              </button>
                            </div>
                          </div>

                          {/* Unified Examination Note */}
                          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-100/70 border border-blue-200 text-blue-900 text-xs">
                            <Award className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="font-bold text-blue-950">Unified Course Examination</p>
                              <p className="text-[11px] text-blue-800 leading-relaxed">
                                Pre-Test and Post-Test use the exact same examination paper. Questions and choices are automatically shuffled by the platform for mentees. You only need to upload one exam file.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Answer Key Security Badge */}
                        {examSubcategory === "ANSWER_KEY" && (
                          <div className="flex items-start gap-2 p-3 bg-amber-100/70 border border-amber-300 rounded-lg text-amber-900 text-xs">
                            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-800" />
                            <div>
                              <p className="font-bold">Confidential Answer Key Flagged</p>
                              <p className="mt-0.5 text-[11px] text-amber-800">
                                This answer key will be locked until mentees complete their examination. Accessible solely to mentors and super admins.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CASE 2: FACILITATOR GUIDE MENTOR-ONLY WARNING BADGE */}
                    {materialCategory === "FACILITATOR_GUIDE" && (
                      <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm">Mentor Only — Hidden from Mentees</p>
                          <p className="mt-0.5 text-xs text-amber-800">
                            Facilitator guides contain preceptor coaching notes and answers. Mentees will not see or download this file.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* CASE 3: PRACTICAL ASSESSMENT METADATA */}
                    {materialCategory === "PRACTICAL_ASSESSMENT" ? (
                      <div className="space-y-4">
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2 text-rose-900 text-xs font-semibold">
                            <ClipboardCheck className="w-4 h-4 text-rose-700" />
                            <span>Practical OSCE Procedure Configuration</span>
                          </div>
                          <Badge className="bg-rose-600 text-white text-[10px]">OSCE Template</Badge>
                        </div>

                        {/* Module Topic / Evaluated Resource */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-800">
                            Module Topic / Curriculum Resource Evaluated <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g., Topic 1: AMTSL & Third Stage Active Management"
                            value={moduleTopicName}
                            onChange={(e) => {
                              setModuleTopicName(e.target.value);
                              if (!procedureName) setProcedureName(e.target.value);
                            }}
                            className="h-10 text-sm bg-white border-gray-200 focus-visible:ring-[#194611]"
                          />
                          <p className="text-[11px] text-gray-500">
                            Defines the clinical topic or practical learning resource under this module evaluated by this checklist.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Procedure Name */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-800">
                              Clinical Procedure / Practical Skill <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="text"
                              placeholder="e.g., Active Management of Third Stage of Labor (AMTSL)"
                              value={procedureName}
                              onChange={(e) => {
                                setProcedureName(e.target.value);
                                if (step2Errors.procedureName) {
                                  setStep2Errors((prev) => ({ ...prev, procedureName: undefined }));
                                }
                              }}
                              className={cn(
                                "h-10 text-sm bg-white",
                                step2Errors.procedureName
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : "border-gray-200 focus-visible:ring-[#194611]"
                              )}
                            />
                            {step2Errors.procedureName && (
                              <p className="text-red-500 text-xs mt-1 font-medium">
                                {step2Errors.procedureName}
                              </p>
                            )}
                          </div>

                          {/* Benchmark Competency Level */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-800">
                              Target Competency Benchmark
                            </label>
                            <select
                              value={practicalBenchmark}
                              onChange={(e) => setPracticalBenchmark(e.target.value)}
                              className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#194611]"
                            >
                              <option value="Level 1 (Novice)">Level 1 (Novice)</option>
                              <option value="Level 2 (Advanced Beginner)">Level 2 (Advanced Beginner)</option>
                              <option value="Level 3 (Competent Benchmark)">Level 3 (Competent — National Benchmark)</option>
                              <option value="Level 4 (Proficient)">Level 4 (Proficient)</option>
                              <option value="Level 5 (Master / Expert)">Level 5 (Master / Expert)</option>
                            </select>
                          </div>
                        </div>

                        {/* Title of Checklist */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-800">
                            Practical Checklist Title <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g., AMTSL Bedside Clinical Skill Checklist"
                            value={materialTitle}
                            onChange={(e) => {
                              setMaterialTitle(e.target.value);
                              if (step2Errors.materialTitle) {
                                setStep2Errors((prev) => ({ ...prev, materialTitle: undefined }));
                              }
                            }}
                            className={cn(
                              "h-10 text-sm bg-white",
                              step2Errors.materialTitle
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-gray-200 focus-visible:ring-[#194611]"
                            )}
                          />
                        </div>

                        {/* Preceptor Evaluation Guidance */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-800">
                            Preceptor Evaluation Guidelines (Optional)
                          </label>
                          <Textarea
                            rows={3}
                            placeholder="Clinical instructions for midwife preceptors conducting the observation session..."
                            value={materialDescription}
                            onChange={(e) => setMaterialDescription(e.target.value)}
                            className="text-sm bg-white border-gray-200 focus-visible:ring-[#194611]"
                          />
                        </div>
                      </div>
                    ) : (
                      /* STANDARD METADATA INPUTS FOR MANUAL / PRESENTATION / GUIDE / EXAM */
                      <div className="space-y-4">
                        {/* Material Title */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-800">
                            {materialCategory === "EXAMINATION"
                              ? "Examination Title"
                              : "Material Title"}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g., Clinical Guideline & Protocol Checklist"
                            value={materialTitle}
                            onChange={(e) => {
                              setMaterialTitle(e.target.value);
                              if (step2Errors.materialTitle) {
                                setStep2Errors((prev) => ({ ...prev, materialTitle: undefined }));
                              }
                            }}
                            className={cn(
                              "h-10 text-sm bg-white",
                              step2Errors.materialTitle
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-gray-200 focus-visible:ring-[#194611]"
                            )}
                          />
                          {step2Errors.materialTitle && (
                            <p className="text-red-500 text-xs flex items-center gap-1 mt-1 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              {step2Errors.materialTitle}
                            </p>
                          )}
                        </div>

                        {/* Material Description */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-800">
                            Instructions / Syllabus Notes (Optional)
                          </label>
                          <Textarea
                            rows={3}
                            placeholder="Brief instructions or pre-requisite reading notes for mentees or mentors..."
                            value={materialDescription}
                            onChange={(e) => setMaterialDescription(e.target.value)}
                            className="text-sm bg-white border-gray-200 focus-visible:ring-[#194611]"
                          />
                        </div>

                        {/* Required Checkbox */}
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
                          <span>
                            Required for mentee module completion{" "}
                            {(materialCategory === "FACILITATOR_GUIDE" ||
                              (materialCategory === "EXAMINATION" && examSubcategory === "ANSWER_KEY")) &&
                              "(Disabled for mentor-only resources)"}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="py-4 px-6 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveStep(1)}
                    className="border-gray-200 text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Back to Module Info
                  </Button>

                  <Button
                    type="submit"
                    className="bg-[#194611] hover:bg-[#13360d] text-white shadow-2xs font-semibold px-5 h-10 cursor-pointer"
                  >
                    {materialCategory === "PRACTICAL_ASSESSMENT" ? (
                      <>
                        Continue to OSCE Checklist Builder
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : materialCategory === "EXAMINATION" ? (
                      <>
                        Continue to Exam Setup / Upload
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Continue to Document Upload
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          )}

          {/* PAGE 2: THE TAILORED NEXT PAGE (DOCUMENT UPLOAD OR OSCE PRACTICAL CHECKLIST BUILDER) */}
          {step2Page === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <Card className="border-gray-200/90 shadow-2xs bg-white">
                <CardHeader className="pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep2Page(1)}
                        className="text-xs text-gray-500 hover:text-gray-900 h-7 px-2 -ml-2"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Category & Metadata
                      </Button>
                      <span className="text-gray-300">|</span>
                      <Badge className="bg-[#194611] text-white text-[10px]">
                        {materialCategory.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-[#194611]">
                      {materialCategory === "PRACTICAL_ASSESSMENT"
                        ? "OSCE Practical Checklist Builder"
                        : materialCategory === "EXAMINATION"
                        ? `${
                            examSubcategory === "EXAM_QUESTIONS"
                              ? "Question Bank / Exam Paper"
                              : "Official Answer Key"
                          } (Pre-Test & Post-Test Shuffled)`
                        : "Upload Training & Curriculum Media"}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 mt-0.5">
                      {materialTitle}
                    </CardDescription>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStep2Page(1)}
                    className="border-gray-200 text-xs h-8"
                  >
                    Change Category
                  </Button>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {/* TAILORED VIEW 1: PRACTICAL ASSESSMENT OSCE CHECKLIST BUILDER */}
                  {materialCategory === "PRACTICAL_ASSESSMENT" && (
                    <div className="space-y-5">
                      {/* OSCE Header & Presets */}
                      <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                            <ClipboardCheck className="w-4 h-4 text-rose-700" />
                            Procedure: {procedureName}
                          </div>
                          <p className="text-xs text-rose-800 mt-0.5">
                            Benchmark: {practicalBenchmark} • Evaluated live by preceptors
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleLoadPresets}
                          className="bg-white border-rose-300 text-rose-900 hover:bg-rose-100 text-xs h-8"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                          Load Standard Midwifery Steps
                        </Button>
                      </div>

                      {/* Score Summary Metrics */}
                      <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Total Steps</p>
                          <p className="text-lg font-bold text-gray-900">{checklistItems.length}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Total Weight Points</p>
                          <p className="text-lg font-bold text-emerald-800">{totalChecklistPoints} pts</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Critical Steps</p>
                          <p className="text-lg font-bold text-amber-800">{totalCriticalSteps}</p>
                        </div>
                      </div>

                      {/* Checklist Items Rows */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-800">
                            OSCE Task Steps & Weight Scoring <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[11px] text-gray-500">
                            Critical steps must pass to achieve clinical competency
                          </span>
                        </div>

                        {step2Errors.checklist && (
                          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2 font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                            <span>{step2Errors.checklist}</span>
                          </div>
                        )}

                        <div className="space-y-3">
                          {checklistItems.map((item, index) => (
                            <div
                              key={item.id}
                              className={cn(
                                "p-3.5 rounded-xl border transition-all space-y-3",
                                item.is_critical
                                  ? "bg-amber-50/40 border-amber-300 shadow-2xs"
                                  : "bg-white border-gray-200 shadow-2xs"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                                  {index + 1}
                                </span>

                                <div className="flex-1 space-y-2">
                                  {/* Task Description */}
                                  <Textarea
                                    rows={2}
                                    placeholder={`Step ${index + 1}: e.g. Administers 10 IU Oxytocin IM within 1 minute of fetal delivery...`}
                                    value={item.item_text}
                                    onChange={(e) =>
                                      handleUpdateChecklistItem(item.id, "item_text", e.target.value)
                                    }
                                    className="text-xs bg-white border-gray-200 focus-visible:ring-[#194611]"
                                  />

                                  {/* Row Controls: Points & Critical Toggle */}
                                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                    <div className="flex items-center gap-4">
                                      {/* Points */}
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-gray-600 font-medium">Points:</span>
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
                                          className="h-7 w-20 text-xs text-center bg-white"
                                        />
                                      </div>

                                      {/* Critical Step Toggle */}
                                      <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={item.is_critical}
                                          onChange={(e) =>
                                            handleUpdateChecklistItem(
                                              item.id,
                                              "is_critical",
                                              e.target.checked
                                            )
                                          }
                                          className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                        />
                                        <span
                                          className={cn(
                                            item.is_critical
                                              ? "text-amber-900 font-bold"
                                              : "text-gray-600"
                                          )}
                                        >
                                          Critical Step (Must Pass)
                                        </span>
                                      </label>
                                    </div>

                                    {/* Delete Row Button */}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveChecklistRow(item.id)}
                                      className="text-gray-400 hover:text-red-600 text-xs h-7 px-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Step Button */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddChecklistRow}
                          className="w-full border-dashed border-gray-300 hover:border-[#194611] text-xs text-gray-700 h-9"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5 text-[#194611]" />
                          Add Checklist Step
                        </Button>
                      </div>

                      {/* Optional Reference Document */}
                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                          <span>Optional Reference Protocol Document</span>
                          <span className="text-[11px] text-gray-400 font-normal">Optional</span>
                        </label>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileSelect}
                          className="text-xs bg-white h-9"
                        />
                        <p className="text-[11px] text-gray-500">
                          Preceptors can reference this protocol SOP alongside the checklist during live observation.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAILORED VIEW 2: EXAMINATION (QUESTIONS OR ANSWER KEY) */}
                  {materialCategory === "EXAMINATION" && (
                    <div className="space-y-5">
                      {examSubcategory === "ANSWER_KEY" ? (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                          <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-amber-700 shrink-0" />
                            <h4 className="text-sm font-bold">
                              Locked Until Post-Exam Completion
                            </h4>
                          </div>
                          <p className="text-xs text-amber-800 leading-relaxed">
                            This official answer key will be encrypted and hidden from mentees. It automatically unlocks only for authorized midwife preceptors after the mentee submits their post-test attempt.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                              <Award className="w-4 h-4 text-blue-700" />
                              Unified Course Examination Questions
                            </div>
                            <p className="text-xs text-blue-800 mt-0.5">
                              Uploaded test questions serve as both Pre-Test and Post-Test (shuffled automatically by the system).
                            </p>
                          </div>
                          <Badge className="bg-blue-600 text-white text-[10px]">
                            Pre/Post Shuffled
                          </Badge>
                        </div>
                      )}

                      {/* File Upload for Exam Document */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-800">
                          Upload{" "}
                          {examSubcategory === "ANSWER_KEY"
                            ? "Answer Key Document"
                            : "Examination Question Bank"}{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="file"
                          ref={fileInputRef}
                          accept={getAcceptedExtensions()}
                          onChange={handleFileSelect}
                          className="hidden"
                        />

                        {!selectedFile ? (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3",
                              isDragOver
                                ? "border-[#194611] bg-emerald-50/70 scale-[0.99]"
                                : step2Errors.fileOrUrl
                                ? "border-red-400 bg-red-50/20"
                                : "border-gray-300 bg-gray-50/50 hover:bg-gray-100/60 hover:border-gray-400"
                            )}
                          >
                            <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-[#194611]">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                Click to browse or drag and drop examination file
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PDF, DOCX, or Excel examination formats up to 50MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-[#194611] text-white flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                  {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for upload
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-8 text-xs border-gray-300"
                              >
                                Change
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedFile(null)}
                                className="h-8 w-8 text-gray-400 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {step2Errors.fileOrUrl && (
                          <p className="text-red-500 text-xs flex items-center gap-1 mt-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {step2Errors.fileOrUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAILORED VIEW 3: STANDARD MEDIA (PARTICIPANT MANUAL, SLIDES, FACILITATOR GUIDE) */}
                  {(materialCategory === "PARTICIPANT_MANUAL" ||
                    materialCategory === "POWERPOINT_PRESENTATION" ||
                    materialCategory === "FACILITATOR_GUIDE") && (
                    <div className="space-y-5">
                      {/* Warning badge if Facilitator Guide */}
                      {materialCategory === "FACILITATOR_GUIDE" && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-center gap-3">
                          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                              Mentor Only — Hidden from Mentees
                            </h4>
                            <p className="text-xs text-amber-800 mt-0.5">
                              This resource will only appear in preceptor dashboards for clinical facilitation.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Presentation badge if PowerPoint */}
                      {materialCategory === "POWERPOINT_PRESENTATION" && (
                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-5 h-5 text-purple-700 shrink-0" />
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                                Course Training Slide Deck
                              </h4>
                              <p className="text-xs text-purple-800 mt-0.5">
                                Accepts PowerPoint (.ppt, .pptx) or PDF presentation slides.
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-purple-600 text-white text-[10px]">
                            Slide Deck
                          </Badge>
                        </div>
                      )}

                      {/* File Upload Zone */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-800">
                          Upload Document File <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="file"
                          ref={fileInputRef}
                          accept={getAcceptedExtensions()}
                          onChange={handleFileSelect}
                          className="hidden"
                        />

                        {!selectedFile ? (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3",
                              isDragOver
                                ? "border-[#194611] bg-emerald-50/70 scale-[0.99]"
                                : step2Errors.fileOrUrl
                                ? "border-red-400 bg-red-50/20"
                                : "border-gray-300 bg-gray-50/50 hover:bg-gray-100/60 hover:border-gray-400"
                            )}
                          >
                            <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-[#194611]">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                Click to browse or drag and drop your file here
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {materialCategory === "POWERPOINT_PRESENTATION"
                                  ? "PPT, PPTX or PDF slides up to 100MB"
                                  : "PDF guidelines or Word documents up to 50MB"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-[#194611] text-white flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                  {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for upload
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-8 text-xs border-gray-300"
                              >
                                Change
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedFile(null)}
                                className="h-8 w-8 text-gray-400 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {step2Errors.fileOrUrl && (
                          <p className="text-red-500 text-xs flex items-center gap-1 mt-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {step2Errors.fileOrUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="py-4 px-6 bg-gray-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep2Page(1)}
                    className="border-gray-200 text-gray-600 hover:text-gray-900 w-full sm:w-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Back to Category & Metadata
                  </Button>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (createdModuleId) {
                          router.push(`/learning/modules/${createdModuleId}`);
                        }
                      }}
                      className="text-gray-500 hover:text-gray-900 text-xs"
                    >
                      Skip for now & Finish
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSubmittingStep2}
                      className="bg-[#194611] hover:bg-[#13360d] text-white shadow-2xs font-semibold px-5 h-10 cursor-pointer w-full sm:w-auto"
                    >
                      {isSubmittingStep2 ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : materialCategory === "PRACTICAL_ASSESSMENT" ? (
                        <>
                          Save & Publish Practical Checklist
                          <Check className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Save Module & Material
                          <Check className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </form>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-3",
            toastMessage.type === "success"
              ? "bg-[#194611] border-emerald-800 text-white"
              : "bg-red-900 border-red-800 text-white"
          )}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          )}
          <div>
            <p className="text-xs font-bold leading-tight">
              {toastMessage.type === "success" ? "Success" : "Error"}
            </p>
            <p className="text-xs text-white/90">{toastMessage.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-3 text-white/70 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
