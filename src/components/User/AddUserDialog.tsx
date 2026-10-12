"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UserPlus } from "lucide-react";
import { userFormSchema, UserFormData, thematicAreasList } from "@/schemas/user-schema";
import { ClinicalUser, MentorUser, MenteeUser } from "@/types/user";
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
  onUserCreated: (user: ClinicalUser) => void;
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

export function AddUserDialog({ role, onUserCreated, triggerButton }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      role: role,
      thematicArea: "Maternal & Child",
      yearsOfExperience: role === "mentor" ? 5 : undefined,
    },
  });

  const onSubmit = (formData: UserFormData) => {
    const newUser = createNewUserFromForm(formData, role);
    onUserCreated(newUser);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              <input
                {...register("facility")}
                placeholder="e.g. St. Paul Hospital"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#194611]/20 focus:border-[#194611]"
              />
              {errors.facility && <p className="text-red-500 text-xs mt-1">{errors.facility.message}</p>}
            </div>
          </div>

          {/* Thematic Area */}
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
  );
}
