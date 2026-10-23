"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  UserPlus,
  X,
  Key,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import {
  userFormSchema,
  UserFormData,
  genderOptions,
  highestQualificationsList,
  thematicAreasList,
} from "@/schemas/user-schema";
import { ClinicalUser, MentorUser, MenteeUser } from "@/types/user";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { FACILITY_ID_MAP } from "@/services/users.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface AddUserDialogProps {
  role: "mentor" | "mentee";
  facilityId?: number | string;
  facilityName?: string;
  onUserCreated?: (user: ClinicalUser) => void;
  triggerButton?: React.ReactNode;
}

/**
 * Generates a secure random temporary password (12 characters, mixed case, numbers, symbol).
 */
export function generateSecurePassword(length = 12): string {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowers = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*";

  const guaranteed = [
    uppers[Math.floor(Math.random() * uppers.length)],
    lowers[Math.floor(Math.random() * lowers.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const allChars = uppers + lowers + numbers + symbols;
  const remaining: string[] = [];
  for (let i = 0; i < length - 4; i++) {
    remaining.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  return [...guaranteed, ...remaining]
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Auto-generates a clean username based on first name, last name, and role (e.g., "John", "Doe" -> "mentor.jdoe").
 */
export function generateUsername(
  firstNameOrFullName: string,
  lastNameOrRole: string,
  optionalRole?: "mentor" | "mentee"
): string {
  if (optionalRole) {
    const cleanFirst = (firstNameOrFullName || "")
      .replace(/^(dr|dr\.|sister|brother|prof|prof\.|mr|mr\.|mrs|mrs\.|ms|ms\.)\s+/i, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const cleanLast = (lastNameOrRole || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const role = optionalRole;
    if (!cleanFirst && !cleanLast) return "";
    if (!cleanLast) return `${role}.${cleanFirst}`;
    if (!cleanFirst) return `${role}.${cleanLast}`;
    return `${role}.${cleanFirst[0]}${cleanLast}`;
  }

  const fullName = firstNameOrFullName;
  const role = lastNameOrRole as "mentor" | "mentee";
  if (!fullName || !fullName.trim()) return "";

  // Strip honorary prefixes like Dr., Sister, Brother, Prof., Mr., etc.
  const cleanName = fullName
    .replace(/^(dr|dr\.|sister|brother|prof|prof\.|mr|mr\.|mrs|mrs\.|ms|ms\.)\s+/i, "")
    .trim();

  const parts = cleanName
    .toLowerCase()
    .split(/\s+/)
    .map((p) => p.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

  if (parts.length === 0) return `${role}.user`;
  if (parts.length === 1) return `${role}.${parts[0]}`;

  const firstInitial = parts[0][0];
  const lastName = parts[parts.length - 1];
  return `${role}.${firstInitial}${lastName}`;
}

// Helper outside the component to create a local optimistic ClinicalUser model
function createNewUserFromForm(
  formData: UserFormData,
  role: "mentor" | "mentee",
  activeFacilityId?: number | string
): ClinicalUser {
  const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();
  const initials =
    `${formData.first_name?.[0] || ""}${formData.last_name?.[0] || ""}`.toUpperCase() ||
    fullName.substring(0, 2).toUpperCase() ||
    "CU";

  const timestamp = Date.now();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const systemId = role === "mentor" ? `MEN-2024-${randomSuffix}` : `MNT-2024-${randomSuffix}`;
  const facilityName =
    (activeFacilityId !== undefined && FACILITY_ID_MAP[Number(activeFacilityId)]) ||
    formData.primary_facility ||
    "Regional Health Facility";

  if (role === "mentor") {
    const newMentor: MentorUser = {
      id: `mentor-${timestamp}`,
      systemId,
      name: fullName,
      email: formData.email,
      phone: formData.phone,
      role: "mentor",
      avatarInitials: initials,
      avatarBgColor: "bg-emerald-100 text-emerald-800",
      profession: formData.profession,
      department: formData.thematic_area,
      facility: facilityName,
      facilityId: activeFacilityId !== undefined ? Number(activeFacilityId) : undefined,
      thematicArea: formData.thematic_area,
      yearsOfExperience: Number(formData.years_of_experience) || 0,
      assignedMenteesCount: 0,
      status: "active",
    };
    return newMentor;
  } else {
    const newMentee: MenteeUser = {
      id: `mentee-${timestamp}`,
      systemId,
      name: fullName,
      email: formData.email,
      phone: formData.phone,
      role: "mentee",
      avatarInitials: initials,
      avatarBgColor: "bg-blue-100 text-blue-800",
      profession: formData.profession,
      cadreLevel: formData.highest_qualification,
      facility: facilityName,
      facilityId: activeFacilityId !== undefined ? Number(activeFacilityId) : undefined,
      thematicArea: formData.thematic_area,
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

export function AddUserDialog({ role, facilityId, facilityName, onUserCreated, triggerButton }: AddUserDialogProps) {
  const router = useRouter();
  const effectiveFacilityId =
    facilityId !== undefined && facilityId !== null && String(facilityId).trim() !== ""
      ? Number(facilityId)
      : undefined;

  const defaultFacilityName =
    facilityName ||
    (effectiveFacilityId !== undefined && FACILITY_ID_MAP[effectiveFacilityId]) ||
    (effectiveFacilityId !== undefined ? `Facility #${effectiveFacilityId}` : "");

  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      gender: "" as any,
      phone: "",
      email: "",
      profession: "",
      highest_qualification: "",
      years_of_experience: "" as any,
      thematic_area: "",
      primary_facility: defaultFacilityName,
      username: "",
      password: "",
      force_password_change: true,
    },
  });

  // Keep facility name synchronized
  useEffect(() => {
    if (defaultFacilityName) {
      setValue("primary_facility", defaultFacilityName);
    }
  }, [defaultFacilityName, setValue]);

  // Generate initial credentials on mount / open
  useEffect(() => {
    if (open) {
      const initialPassword = generateSecurePassword();
      setValue("password", initialPassword, { shouldValidate: true });
      const currentFirst = getValues("first_name");
      const currentLast = getValues("last_name");
      if (currentFirst || currentLast) {
        setValue("username", generateUsername(currentFirst || "", currentLast || "", role), {
          shouldValidate: true,
        });
      }
    }
  }, [open, role, setValue, getValues]);

  // Auto-generate username from first_name and last_name
  const watchedFirstName = watch("first_name");
  const watchedLastName = watch("last_name");
  const watchedHighestQualification = watch("highest_qualification");
  const watchedThematicArea = watch("thematic_area");

  useEffect(() => {
    register("highest_qualification");
    register("thematic_area");
  }, [register]);
  useEffect(() => {
    if (watchedFirstName || watchedLastName) {
      setValue(
        "username",
        generateUsername(watchedFirstName || "", watchedLastName || "", role),
        { shouldValidate: true }
      );
    } else {
      setValue("username", "");
    }
  }, [watchedFirstName, watchedLastName, role, setValue]);

  // Auto-dismiss toast
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

  const handleRegeneratePassword = (e: React.MouseEvent) => {
    e.preventDefault();
    const newPass = generateSecurePassword();
    setValue("password", newPass, { shouldValidate: true, shouldDirty: true });
  };

  const handleCopyPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    const currentPassword = getValues("password");
    if (currentPassword) {
      try {
        await navigator.clipboard.writeText(currentPassword);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      } catch {
        // Fallback if clipboard API is restricted
      }
    }
  };

  const forcePasswordChange = watch("force_password_change");

  const onSubmit = async (formData: UserFormData) => {
    setSubmitError(null);
    try {
      const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();
      const assignedFacilityId = effectiveFacilityId;

      // Construct clean payload strictly adhering to the backend's allowed fields
      const payload: Record<string, any> = {
        full_name: fullName,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: role,
        highest_qualification: formData.highest_qualification || formData.profession.trim(),
        password: formData.password,
        must_change_password: Boolean(formData.force_password_change),
        training_status: "in_training",
      };

      if (assignedFacilityId !== undefined) {
        payload.facility_id = assignedFacilityId;
      }

      await apiClient.post<any>("/api/v1/users", payload);
      const newUser = createNewUserFromForm(formData, role, assignedFacilityId);

      onUserCreated?.(newUser);
      reset();
      setOpen(false);
      setToastMessage(
        `${fullName} was successfully registered as a ${role === "mentor" ? "Mentor" : "Mentee"}.`
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
        <DialogTrigger className="flex items-center gap-2 bg-[#194611] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#14370d] transition shadow-xs cursor-pointer">
          {triggerButton ? (
            triggerButton
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Add New {role === "mentor" ? "Mentor" : "Mentee"}</span>
            </>
          )}
        </DialogTrigger>

        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[620px] max-h-[90dvh] overflow-y-auto p-0 bg-white border border-gray-100 shadow-2xl rounded-2xl">
          <DialogHeader className="p-4 sm:p-6 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-[#194611] mb-1">
              <UserPlus className="h-5 w-5" />
              <DialogTitle className="text-xl font-bold text-gray-900">
                Register New {role === "mentor" ? "Clinical Mentor" : "Mentee"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-gray-500">
              Provide clinical credentials and auto-generated system credentials. The account will be immediately provisioned.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
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

            {/* 1. PERSONAL INFORMATION */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Personal Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* First Name */}
                <div>
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("first_name")}
                    placeholder="e.g. Abebe"
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("last_name")}
                    placeholder="e.g. Tessema"
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <select
                    {...register("gender")}
                    defaultValue=""
                    className="w-full h-8 px-2.5 py-1 border border-input rounded-lg text-sm bg-transparent outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer text-gray-700"
                  >
                    <option value="" disabled>
                      Select gender
                    </option>
                    {genderOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("phone")}
                    type="tel"
                    placeholder="e.g. +251911234567"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="e.g. clinician@hospital.org"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. PROFESSIONAL INFORMATION */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Professional Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Profession */}
                <div>
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    Profession <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("profession")}
                    placeholder={role === "mentor" ? "e.g. Lead Midwifery Preceptor" : "e.g. Resident Midwife"}
                  />
                  {errors.profession && (
                    <p className="text-red-500 text-xs mt-1">{errors.profession.message}</p>
                  )}
                </div>

                {/* Highest Qualification */}
                <div>
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    Highest Qualification <span className="text-red-500">*</span>
                  </Label>
                  <SearchableSelect
                    options={highestQualificationsList}
                    value={watchedHighestQualification}
                    onChange={(val) =>
                      setValue("highest_qualification", val, { shouldValidate: true })
                    }
                    placeholder="Select highest qualification"
                    searchPlaceholder="Search qualification..."
                    size="sm"
                    error={errors.highest_qualification?.message}
                  />
                  {errors.highest_qualification && (
                    <p className="text-red-500 text-xs mt-1">{errors.highest_qualification.message}</p>
                  )}
                </div>

                {/* Years of Experience */}
                <div>
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    Years of Experience <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("years_of_experience")}
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                  />
                  {errors.years_of_experience && (
                    <p className="text-red-500 text-xs mt-1">{errors.years_of_experience.message}</p>
                  )}
                </div>

                {/* Thematic Area */}
                <div>
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    Primary Thematic Area <span className="text-red-500">*</span>
                  </Label>
                  <SearchableSelect
                    options={thematicAreasList}
                    value={watchedThematicArea}
                    onChange={(val) =>
                      setValue("thematic_area", val, { shouldValidate: true })
                    }
                    placeholder="Select primary thematic area"
                    searchPlaceholder="Search thematic area..."
                    size="sm"
                    error={errors.thematic_area?.message}
                  />
                  {errors.thematic_area && (
                    <p className="text-red-500 text-xs mt-1">{errors.thematic_area.message}</p>
                  )}
                </div>

                {/* Primary Facility (Autofill, read-only) */}
                <div className="sm:col-span-2">
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    Primary Facility
                  </Label>
                  <Input
                    {...register("primary_facility")}
                    readOnly
                    disabled
                    className="w-full bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Autofilled with your assigned administrative facility
                  </p>
                </div>
              </div>
            </div>

            {/* 3. ACCOUNT CREATION (DYNAMIC CREDENTIALS) */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                <Key className="h-4 w-4 text-[#194611]" />
                <span>Account Creation & Credentials</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Username (Disabled / Read-only) */}
                <div>
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    Generated Username
                  </Label>
                  <Input
                    {...register("username")}
                    readOnly
                    disabled
                    className="w-full bg-gray-100 text-gray-700 font-mono text-xs cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Auto-derived from name</p>
                </div>

                {/* Password with Regenerate & Copy */}
                <div>
                  <Label className="block text-xs font-semibold text-gray-700 mb-1">
                    Temporary Password
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      {...register("password")}
                      type="text"
                      className="flex-1 font-mono text-xs font-medium text-gray-800 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleRegeneratePassword}
                      title="Regenerate secure password"
                      className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      title="Copy password to clipboard"
                      className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-[#194611] transition cursor-pointer"
                    >
                      {copiedPassword ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Force Password Change Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200">
                <div className="space-y-0.5">
                  <Label htmlFor="force-password-change" className="text-xs font-semibold text-gray-800 cursor-pointer">
                    Force Password Change
                  </Label>
                  <p className="text-[11px] text-gray-500">
                    Require clinician to set a new password on their first sign-in
                  </p>
                </div>
                <Switch
                  id="force-password-change"
                  checked={forcePasswordChange}
                  onCheckedChange={(checked) => setValue("force_password_change", Boolean(checked))}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#194611] text-white rounded-lg text-sm font-semibold hover:bg-[#14370d] transition shadow-xs disabled:opacity-50 cursor-pointer"
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
