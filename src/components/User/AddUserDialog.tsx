"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Plus, UserPlus, X } from "lucide-react";
import { userFormSchema, UserFormData, thematicAreasList } from "@/schemas/user-schema";
import { ClinicalUser, MentorUser, MenteeUser } from "@/types/user";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddUserDialogProps {
  role: "mentor" | "mentee";
  onUserCreated?: (user: ClinicalUser) => void;
  triggerButton?: React.ReactNode;
}

// Helper outside the component to guarantee pure rendering
function createNewUserFromForm(formData: UserFormData, role: "mentor" | "mentee"): ClinicalUser {
  const nameParts = formData.name.trim().split(" ");
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : formData.name.substring(0, 2).toUpperCase();

  const timestamp = Date.now();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const systemId = role === "mentor" ? `MEN-2024-${randomSuffix}` : `MNT-2024-${randomSuffix}`;

  if (role === "mentor") {
    const newMentor: MentorUser = {
      id: `mentor-${timestamp}`,
      systemId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: "mentor",
      avatarInitials: initials,
      avatarBgColor: "bg-emerald-100 text-emerald-800",
      profession: formData.profession,
      department: formData.department || "General Clinical Preceptorship",
      facility: formData.facility,
      thematicArea: formData.thematicArea,
      yearsOfExperience: formData.yearsOfExperience || 1,
      assignedMenteesCount: 0,
      status: "active",
    };
    return newMentor;
  } else {
    const newMentee: MenteeUser = {
      id: `mentee-${timestamp}`,
      systemId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: "mentee",
      avatarInitials: initials,
      avatarBgColor: "bg-blue-100 text-blue-800",
      profession: formData.profession,
      cadreLevel: formData.cadreLevel || "Junior Midwife Resident",
      facility: formData.facility,
      thematicArea: formData.thematicArea,
      assignedMentor: {
        status: "pending_review",
      },
      knowledgeScore: 0,
      scoreTier: "Tier 2",
      status: "pending_start",
    };
    return newMentee;
  }
}

const FACILITY_OPTIONS = [
  { id: 1, name: "St. Paul's Hospital (SPHMMC)" },
  { id: 2, name: "Tikur Anbessa Specialized Hospital (TASH)" },
  { id: 3, name: "Zewditu Memorial Hospital" },
  { id: 4, name: "Yekatit 12 Hospital Medical College" },
  { id: 5, name: "Gandhi Memorial Hospital" },
  { id: 6, name: "Tirunesh Beijing General Hospital" },
];

export function AddUserDialog({ role, onUserCreated, triggerButton }: AddUserDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      role: role,
      facility: "2",
      phone: "+251911234567",
      profession: "BSc Midwifery",
      thematicArea: "Maternal & Child",
      yearsOfExperience: role === "mentor" ? 5 : undefined,
    },
  });

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSubmitError(null);
    }
  };

  const onSubmit = async (formData: UserFormData) => {
    setSubmitError(null);
    try {
      // Build exact payload schema expected by backend:
      const payload = {
        full_name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: "TemporaryPass1!",
        role: role,
        facility_id: Number(formData.facility) || 2,
        phone: formData.phone?.trim() || "+251911234567",
        highest_qualification: formData.profession?.trim() || "BSc Midwifery",
        training_status: "in_training",
        must_change_password: true,
      };

      const response = await apiClient.post<any>("/api/v1/users", payload);
      const newUser = createNewUserFromForm(formData, role);

      onUserCreated?.(newUser);
      reset();
      setOpen(false);
      setToastMessage(
        `${payload.full_name} was successfully registered as a ${role === "mentor" ? "Mentor" : "Mentee"}.`
      );
      router.refresh();
    } catch (err: any) {
      console.error("Failed to register user:", err);
      const message =
        err?.message ||
        err?.data?.message ||
        err?.data?.error?.message ||
        "Failed to register clinician. Please verify details and try again.";
      setSubmitError(message);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger className="flex items-center gap-2 bg-[#194611] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#14370d] transition shadow-sm">
          {triggerButton ? (
            triggerButton
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Add New {role === "mentor" ? "Mentor" : "Mentee"}</span>
            </>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white border border-gray-100 shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 bg-gray-50/70 border-b border-gray-100">
            <div className="flex items-center gap-2 text-[#194611] mb-1">
              <UserPlus className="h-5 w-5" />
              <DialogTitle className="text-xl font-bold text-gray-900">
                Register New {role === "mentor" ? "Clinical Mentor" : "Mentee"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-gray-500">
              Enter the clinician&apos;s credentials and facility assignment. This profile will be immediately listed in the registry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Submission Error Alert */}
            {submitError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold">Unable to register user</p>
                  <p className="mt-0.5 text-red-700">{submitError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-red-500 hover:text-red-800 transition cursor-pointer"
                  aria-label="Dismiss error"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          {/* Full Name & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                placeholder="e.g. Dr. Abebe Tessema"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="clinician@hospital.org"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          {/* Profession & Facility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Profession / Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register("profession")}
                placeholder={role === "mentor" ? "e.g. Chief of Obstetrics" : "e.g. Resident Midwife"}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
              />
              {errors.profession && <p className="text-red-500 text-xs mt-1">{errors.profession.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Affiliated Facility <span className="text-red-500">*</span>
              </label>
              <select
                {...register("facility")}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611] bg-white cursor-pointer"
              >
                {FACILITY_OPTIONS.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} (ID: {fac.id})
                  </option>
                ))}
              </select>
              {errors.facility && <p className="text-red-500 text-xs mt-1">{errors.facility.message}</p>}
            </div>
          </div>

          {/* Phone Number & Thematic Area */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                {...register("phone")}
                type="tel"
                placeholder="+251911234567"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Primary Thematic Area <span className="text-red-500">*</span>
              </label>
              <select
                {...register("thematicArea")}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611] bg-white cursor-pointer"
              >
                {thematicAreasList.map((area: string) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ROLE-CONDITIONAL FIELDS */}
          {role === "mentor" ? (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department / Unit <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("department")}
                  placeholder="e.g. Maternal & Fetal Health"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
                />
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("yearsOfExperience")}
                  type="number"
                  min="1"
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
                />
                {errors.yearsOfExperience && (
                  <p className="text-red-500 text-xs mt-1">{errors.yearsOfExperience.message}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cadre / Cohort Level</label>
              <input
                {...register("cadreLevel")}
                placeholder="e.g. PGY-2 Clinical Midwifery"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#194611] text-white rounded-lg text-sm font-semibold hover:bg-[#14370d] transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Registering..." : `Register ${role === "mentor" ? "Mentor" : "Mentee"}`}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Success Toast Notification */}
    {toastMessage && (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#194611] text-white shadow-2xl border border-emerald-800 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-white">Success</p>
          <p className="text-xs text-emerald-200">{toastMessage}</p>
        </div>
        <button
          type="button"
          onClick={() => setToastMessage(null)}
          className="ml-2 text-emerald-200 hover:text-white transition cursor-pointer"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )}
  </>
  );
}
