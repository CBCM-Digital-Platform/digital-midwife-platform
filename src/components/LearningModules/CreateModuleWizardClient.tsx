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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  createModule,
  addContent,
  CreateModulePayload,
  AddContentPayload,
} from "@/services/super-admin.service";
import type { ThematicArea } from "@/types/thematic-area";
import {
  Check,
  CheckCircle2,
  AlertCircle,
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export type MaterialTypeOption = "pdf" | "video" | "audio" | "link";

interface CreateModuleWizardClientProps {
  thematicAreas: ThematicArea[];
}

export function CreateModuleWizardClient({ thematicAreas }: CreateModuleWizardClientProps) {
  const router = useRouter();

  // Wizard Navigation State
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [isStep2Unlocked, setIsStep2Unlocked] = useState(false);

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

  // Step 2 Form State
  const [materialType, setMaterialType] = useState<MaterialTypeOption>("pdf");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [step2Errors, setStep2Errors] = useState<{
    materialTitle?: string;
    fileOrUrl?: string;
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
    description: area.code ? `[${area.code}] - ${area.category}` : area.category,
  }));

  // Auto-dismiss toast
  React.useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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
        // Prepopulate material title if empty
        if (!materialTitle) {
          setMaterialTitle(`${title.trim()} - Primary Reference Material`);
        }
        setToastMessage({
          type: "success",
          text: `Module created successfully (ID #${result.moduleId})! Now attach learning material.`,
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

  // Validate Step 2
  const validateStep2 = (): boolean => {
    const errors: { materialTitle?: string; fileOrUrl?: string } = {};

    if (!materialTitle.trim()) {
      errors.materialTitle = "Learning material title is required.";
    }

    if (materialType === "link") {
      if (!linkUrl.trim()) {
        errors.fileOrUrl = "External resource URL is required for Link type.";
      } else if (!/^https?:\/\/.+/i.test(linkUrl.trim())) {
        errors.fileOrUrl = "Please provide a valid web URL starting with http:// or https://";
      }
    } else {
      if (!selectedFile) {
        errors.fileOrUrl = `Please select or upload a ${materialType.toUpperCase()} file.`;
      }
    }

    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Step 2 Drag and Drop
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
        if (!materialTitle) {
          setMaterialTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
      }
    },
    [materialTitle]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setStep2Errors((prev) => ({ ...prev, fileOrUrl: undefined }));
      if (!materialTitle) {
        setMaterialTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  // Determine file accept pattern based on selected type
  const getAcceptedExtensions = (): string => {
    switch (materialType) {
      case "pdf":
        return ".pdf,application/pdf";
      case "video":
        return ".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime";
      case "audio":
        return ".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4";
      default:
        return "*";
    }
  };

  // Handle Step 2 Submission (Save Module & Material)
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

    if (!validateStep2()) return;

    setIsSubmittingStep2(true);
    setToastMessage(null);

    try {
      const payload: AddContentPayload = {
        title: materialTitle.trim(),
        type: materialType,
        description: materialDescription.trim() || undefined,
        file: selectedFile || undefined,
        url: materialType === "link" ? linkUrl.trim() : undefined,
        order: 1,
        isRequired: true,
      };

      const result = await addContent(createdModuleId, payload);

      if (result.success) {
        setToastMessage({
          type: "success",
          text: "Learning module and material published successfully! Redirecting...",
        });
        setTimeout(() => {
          router.push(`/learning/modules/${createdModuleId}`);
        }, 1200);
      } else {
        throw new Error(result.message || "Failed to attach learning material.");
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to save material. Please verify file.",
      });
      setIsSubmittingStep2(false);
    }
  };

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
              Create Learning Module
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              Configure standardized clinical competencies, thematic classification, and upload initial learning materials for midwife mentors and mentees.
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

      {/* 2-Step Progress Indicator Stepper */}
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
                Add Learning Material
              </h3>
              <p className="text-[11px] text-gray-500 truncate">
                Upload PDFs, surgical videos, audio or links
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
                  placeholder="e.g., Advanced Postpartum Hemorrhage & Surgical Interventions"
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
                    "text-sm bg-white resize-y min-h-[110px]",
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
                <p className="text-[11px] text-gray-500">
                  Provide midwives and preceptors with a clear outline of expected clinical skills, prerequisites, and evaluation standards.
                </p>
              </div>
            </CardContent>

            <CardFooter className="py-4 px-6 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-gray-400" />
                Step 1 will save this module to the database and generate a persistent Module ID.
              </p>

              <Button
                type="submit"
                disabled={isSubmittingStep1}
                className="bg-[#194611] hover:bg-[#13360d] text-white shadow-2xs font-semibold px-5 h-10 cursor-pointer"
              >
                {isSubmittingStep1 ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Module...
                  </>
                ) : (
                  <>
                    Next: Add Learning Material
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* STEP 2: ADD LEARNING MATERIAL */}
      {activeStep === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-6">
          {/* Module Confirmed Banner */}
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

          <Card className="border-gray-200/90 shadow-2xs bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-[#194611]">
                Add Learning Material
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Attach digital materials (PDF clinical guidelines, instructional videos, audio debriefs, or reference links).
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Material Type Radio Group (Large Icon Cards) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-800">
                  Select Material Type <span className="text-red-500">*</span>
                </label>

                <RadioGroup
                  value={materialType}
                  onValueChange={(val: any) => {
                    setMaterialType(val);
                    setSelectedFile(null);
                    setStep2Errors((prev) => ({ ...prev, fileOrUrl: undefined }));
                  }}
                  className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1"
                >
                  {/* PDF Card */}
                  <div
                    onClick={() => {
                      setMaterialType("pdf");
                      setSelectedFile(null);
                    }}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-start justify-between min-h-[120px] select-none",
                      materialType === "pdf"
                        ? "border-[#194611] bg-emerald-50/50 shadow-2xs"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <RadioGroupItem value="pdf" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-gray-900">PDF Document</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Clinical manuals, protocols & guides
                      </p>
                    </div>
                  </div>

                  {/* Video Card */}
                  <div
                    onClick={() => {
                      setMaterialType("video");
                      setSelectedFile(null);
                    }}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-start justify-between min-h-[120px] select-none",
                      materialType === "video"
                        ? "border-[#194611] bg-emerald-50/50 shadow-2xs"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Video className="w-5 h-5" />
                      </div>
                      <RadioGroupItem value="video" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-gray-900">Video Lecture</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Surgical drills & demonstrations
                      </p>
                    </div>
                  </div>

                  {/* Audio Card */}
                  <div
                    onClick={() => {
                      setMaterialType("audio");
                      setSelectedFile(null);
                    }}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-start justify-between min-h-[120px] select-none",
                      materialType === "audio"
                        ? "border-[#194611] bg-emerald-50/50 shadow-2xs"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Headphones className="w-5 h-5" />
                      </div>
                      <RadioGroupItem value="audio" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-gray-900">Audio Recording</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Clinical case debriefs & podcasts
                      </p>
                    </div>
                  </div>

                  {/* Link Card */}
                  <div
                    onClick={() => {
                      setMaterialType("link");
                      setSelectedFile(null);
                    }}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-start justify-between min-h-[120px] select-none",
                      materialType === "link"
                        ? "border-[#194611] bg-emerald-50/50 shadow-2xs"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                      </div>
                      <RadioGroupItem value="link" />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-gray-900">External Link</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Web references & MoH repositories
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Material Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800">
                  Material Title <span className="text-red-500">*</span>
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

              {/* Material Description / Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800">
                  Material Summary / Instructions (Optional)
                </label>
                <Textarea
                  rows={2}
                  placeholder="Brief summary or reading guidance for mentees before practical clinical assessment..."
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  className="text-sm bg-white border-gray-200 focus-visible:ring-[#194611]"
                />
              </div>

              {/* Drag and Drop Upload Zone for PDF/Video/Audio OR Web Link Input */}
              {materialType === "link" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-800">
                    External Resource URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="url"
                      placeholder="https://moh.gov.et/guidelines/obstetric-care"
                      value={linkUrl}
                      onChange={(e) => {
                        setLinkUrl(e.target.value);
                        if (step2Errors.fileOrUrl) {
                          setStep2Errors((prev) => ({ ...prev, fileOrUrl: undefined }));
                        }
                      }}
                      className={cn(
                        "pl-9 h-10 text-sm bg-white",
                        step2Errors.fileOrUrl
                          ? "border-red-500 focus-visible:ring-red-500"
                          : "border-gray-200 focus-visible:ring-[#194611]"
                      )}
                    />
                  </div>
                  {step2Errors.fileOrUrl && (
                    <p className="text-red-500 text-xs flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {step2Errors.fileOrUrl}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-500">
                    Enter the full URL including https:// where mentors and mentees can access this material.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-800">
                    Upload {materialType.toUpperCase()} File <span className="text-red-500">*</span>
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
                          ? "border-red-400 bg-red-50/20 hover:bg-red-50/30"
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
                          {materialType === "pdf" && "PDF guidelines up to 50MB"}
                          {materialType === "video" && "MP4, WebM or MOV videos up to 200MB"}
                          {materialType === "audio" && "MP3 or WAV audio clips up to 50MB"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[#194611] text-white flex items-center justify-center shrink-0">
                          {materialType === "pdf" && <FileText className="w-5 h-5" />}
                          {materialType === "video" && <Video className="w-5 h-5" />}
                          {materialType === "audio" && <Headphones className="w-5 h-5" />}
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
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="h-8 w-8 text-gray-400 hover:text-red-600 cursor-pointer"
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
              )}
            </CardContent>

            <CardFooter className="py-4 px-6 bg-gray-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(1)}
                className="border-gray-200 text-gray-600 hover:text-gray-900 w-full sm:w-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Back to Module Info
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
                      Saving Module & Material...
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
