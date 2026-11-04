"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  resourceFormSchema,
  ResourceFormData,
  resourceTypeOptions,
} from "@/schemas/resource-schema";
import {
  createResource,
  updateResource,
} from "@/services/resources.service";
import type { AdminResource, AdminResourceType } from "@/types/resource";
import {
  FileText,
  Video,
  Link2,
  UploadCloud,
  X,
  Loader2,
  AlertCircle,
  FileUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: AdminResource | null;
  onSuccess: (resource: AdminResource) => void;
}

export function ResourceFormDialog({
  open,
  onOpenChange,
  resource,
  onSuccess,
}: ResourceFormDialogProps) {
  const isEditing = Boolean(resource);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "document",
      url: "",
    },
  });

  const selectedType = watch("type");

  // Sync form values whenever dialog opens or editing target changes
  useEffect(() => {
    if (open) {
      if (resource) {
        reset({
          title: resource.title || "",
          description: resource.description || "",
          type: resource.type || "document",
          url: resource.url || "",
        });
        setExistingFileName(resource.fileName || (resource.fileId ? `File attached (ID: ${resource.fileId})` : null));
        setSelectedFile(null);
      } else {
        reset({
          title: "",
          description: "",
          type: "document",
          url: "",
        });
        setExistingFileName(null);
        setSelectedFile(null);
      }
      setServerError(null);
    }
  }, [open, resource, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExistingFileName(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setExistingFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: ResourceFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      if (isEditing && resource) {
        const updated = await updateResource(resource.id, {
          title: data.title,
          description: data.description,
          type: data.type as AdminResourceType,
          url: data.url || undefined,
          file: selectedFile || undefined,
        });
        onSuccess(updated);
        onOpenChange(false);
      } else {
        const created = await createResource({
          title: data.title,
          description: data.description,
          type: data.type as AdminResourceType,
          url: data.url || undefined,
          file: selectedFile || undefined,
        });
        onSuccess(created);
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("Resource form submit failed:", err);
      setServerError(
        err?.message || "An unexpected error occurred while saving the resource."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[560px] p-0 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="p-5 sm:p-6 bg-gray-50/90 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#194611] flex items-center justify-center shrink-0">
              {selectedType === "video" ? (
                <Video className="w-5 h-5 text-indigo-600" />
              ) : selectedType === "link" ? (
                <Link2 className="w-5 h-5 text-amber-600" />
              ) : (
                <FileText className="w-5 h-5 text-[#194611]" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                {isEditing ? "Edit Clinical Resource" : "Add New Clinical Resource"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                {isEditing
                  ? "Update module metadata, clinical guidelines, or media links."
                  : "Publish an accredited clinical guideline, instructional video, or reference URL."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
        >
          {serverError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-1.5">
            <Label htmlFor="res-title" className="text-xs font-semibold text-gray-700">
              Resource Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="res-title"
              placeholder="e.g., Postpartum Hemorrhage Clinical Guidelines"
              className={cn(
                "h-10 text-sm bg-white border-gray-200 focus-visible:ring-[#194611]",
                errors.title && "border-red-300 focus-visible:ring-red-400"
              )}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-[11px] font-medium text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Resource Type Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="res-type" className="text-xs font-semibold text-gray-700">
              Resource Type <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <select
                id="res-type"
                className={cn(
                  "w-full h-10 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 font-medium transition focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent",
                  errors.type && "border-red-300 focus:ring-red-400"
                )}
                {...register("type")}
              >
                {resourceTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.type && (
              <p className="text-[11px] font-medium text-red-600">
                {errors.type.message}
              </p>
            )}
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <Label htmlFor="res-desc" className="text-xs font-semibold text-gray-700">
              Description / Clinical Context
            </Label>
            <textarea
              id="res-desc"
              rows={3}
              placeholder="Provide a brief clinical summary, protocol highlights, or target learning objectives..."
              className={cn(
                "w-full p-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent resize-none",
                errors.description && "border-red-300 focus:ring-red-400"
              )}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-[11px] font-medium text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Conditional Input Section: File Upload & URL */}
          <div className="pt-2 border-t border-gray-100 space-y-4">
            {/* File Upload (Available for Document or Video) */}
            {selectedType !== "link" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  {selectedType === "video"
                    ? "Video File Upload (Optional if providing URL)"
                    : "Document File (PDF, DOCX, Manual)"}
                </Label>

                {selectedFile || existingFileName ? (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileUp className="w-4 h-4 text-[#194611] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {selectedFile ? selectedFile.name : existingFileName}
                        </p>
                        {selectedFile && (
                          <p className="text-[10px] text-gray-500">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 hover:border-[#194611] rounded-xl p-4 text-center cursor-pointer bg-gray-50/50 hover:bg-emerald-50/20 transition group"
                  >
                    <UploadCloud className="w-7 h-7 mx-auto text-gray-400 group-hover:text-[#194611] transition mb-1.5" />
                    <p className="text-xs font-semibold text-gray-700 group-hover:text-[#194611]">
                      Click to choose a file from your computer
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {selectedType === "video"
                        ? "MP4, MOV, or WEBM (Max 50MB)"
                        : "PDF, DOCX, PPTX (Max 25MB)"}
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={
                    selectedType === "video"
                      ? "video/mp4,video/quicktime,video/webm"
                      : ".pdf,.doc,.docx,.ppt,.pptx"
                  }
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* URL Input (Required for Link, optional for Video or Document with external host) */}
            <div className="space-y-1.5">
              <Label htmlFor="res-url" className="text-xs font-semibold text-gray-700">
                {selectedType === "link" ? (
                  <span>
                    Destination URL <span className="text-red-500">*</span>
                  </span>
                ) : selectedType === "video" ? (
                  "Video Link (YouTube, Vimeo, or Hosted Stream)"
                ) : (
                  "External Document URL (Optional alternative to file upload)"
                )}
              </Label>
              <div className="relative">
                <Input
                  id="res-url"
                  type="text"
                  placeholder={
                    selectedType === "video"
                      ? "https://www.youtube.com/watch?v=..."
                      : selectedType === "link"
                      ? "https://who.int/reproductive-health/..."
                      : "https://drive.google.com/... or https://..."
                  }
                  className={cn(
                    "h-10 text-sm bg-white border-gray-200 focus-visible:ring-[#194611]",
                    errors.url && "border-red-300 focus-visible:ring-red-400"
                  )}
                  {...register("url")}
                />
              </div>
              {errors.url && (
                <p className="text-[11px] font-medium text-red-600">
                  {errors.url.message}
                </p>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
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
              disabled={isSubmitting}
              className="h-10 px-5 text-xs font-semibold rounded-xl bg-[#194611] hover:bg-[#14380e] text-white shadow-xs cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isEditing ? "Saving Changes..." : "Publishing..."}</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Publish Resource"}</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
