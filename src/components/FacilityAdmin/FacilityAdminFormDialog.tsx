"use client";

import React, { useState, useEffect } from "react";
import { ModalWrapper } from "@/components/common/ModalWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  validateEmail,
  validatePhone,
  validateName,
  validatePassword,
} from "@/lib/validators";
import { createFacilityAdmin } from "@/services/facility-admins.service";
import type { FacilityAdmin } from "@/types/facility-admin";
import type { Facility } from "@/types/facility";
import {
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

interface FacilityAdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilities: Facility[];
  onSuccess: (admin: FacilityAdmin) => void;
}

export const validateEmailAddress = (val: string) => validateEmail(val, true);

/**
 * Generates a secure random temporary password (12 characters, mixed case, numbers, symbol).
 */
function generateSecurePassword(length = 12): string {
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

export function FacilityAdminFormDialog({
  open,
  onOpenChange,
  facilities,
  onSuccess,
}: FacilityAdminFormDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastName, setLastName] = useState("");
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [facilityId, setFacilityId] = useState<string>("");
  const [facilityError, setFacilityError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [qualification, setQualification] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFirstName("");
    setFirstNameError(null);
    setLastName("");
    setLastNameError(null);
    setEmail("");
    setEmailError(null);
    setEmailTouched(false);
    setPassword(generateSecurePassword());
    setPasswordError(null);
    setShowPassword(false);
    setCopiedPassword(false);
    setFacilityId("");
    setFacilityError(null);
    setPhone("");
    setPhoneError(null);
    setQualification("");
    setErrorMessage(null);
  };

  // Generate fresh clean state every time dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleRegeneratePassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setPassword(generateSecurePassword());
    setCopiedPassword(false);
  };

  const handleCopyPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (password) {
      try {
        await navigator.clipboard.writeText(password);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      } catch {
        // Clipboard access fallback
      }
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (emailTouched) {
      const result = validateEmailAddress(val);
      setEmailError(result.error || null);
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    const result = validateEmailAddress(email);
    setEmailError(result.error || null);
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFirstName(val);
    if (firstNameError) {
      const res = validateName(val, "First name", 2);
      setFirstNameError(res.error || null);
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLastName(val);
    if (lastNameError) {
      const res = validateName(val, "Last name", 2);
      setLastNameError(res.error || null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (phoneError) {
      const res = validatePhone(val, false);
      setPhoneError(res.error || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const firstRes = validateName(firstName, "First name", 2);
    setFirstNameError(firstRes.error || null);

    const lastRes = validateName(lastName, "Last name", 2);
    setLastNameError(lastRes.error || null);

    const emailValidation = validateEmailAddress(email);
    setEmailTouched(true);
    setEmailError(emailValidation.error || null);

    const phoneRes = validatePhone(phone, false);
    setPhoneError(phoneRes.error || null);

    const facError = !facilityId ? "Please select an accredited facility to assign." : null;
    setFacilityError(facError);

    const passRes = validatePassword(password, { minLength: 8 });
    setPasswordError(passRes.error || null);

    // Fail if any validation error
    if (
      !firstRes.valid ||
      !lastRes.valid ||
      !emailValidation.valid ||
      !phoneRes.valid ||
      facError ||
      !passRes.valid
    ) {
      const firstError =
        firstRes.error ||
        lastRes.error ||
        emailValidation.error ||
        phoneRes.error ||
        facError ||
        passRes.error;
      setErrorMessage(firstError || "Please correct all highlighted fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const created = await createFacilityAdmin({
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        facilityId: Number(facilityId),
        phone: phone.trim() || undefined,
        highestQualification: qualification.trim() || undefined,
      });

      resetForm();
      onOpenChange(false);
      onSuccess(created);
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Failed to create facility administrator. Please check inputs and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      open={open}
      onOpenChange={handleOpenChange}
      title="Add Facility Administrator"
      description="Create an administrator profile to manage mentorship operations and midwives at a healthcare facility."
      maxWidth="sm:max-w-[560px]"
    >
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* First & Last Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="admin-first-name" className="text-xs font-semibold text-gray-700">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="admin-first-name"
              value={firstName}
              onChange={handleFirstNameChange}
              required
              autoComplete="off"
              className={cn("h-9 text-sm", firstNameError && "border-red-500 focus-visible:ring-red-500")}
              aria-invalid={!!firstNameError}
            />
            {firstNameError && (
              <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>{firstNameError}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-last-name" className="text-xs font-semibold text-gray-700">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="admin-last-name"
              value={lastName}
              onChange={handleLastNameChange}
              required
              autoComplete="off"
              className={cn("h-9 text-sm", lastNameError && "border-red-500 focus-visible:ring-red-500")}
              aria-invalid={!!lastNameError}
            />
            {lastNameError && (
              <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>{lastNameError}</span>
              </p>
            )}
          </div>
        </div>

        {/* Email & Phone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email" className="text-xs font-semibold text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              required
              autoComplete="off"
              placeholder="admin@facility.org"
              className={cn(
                "h-9 text-sm",
                emailError && "border-red-500 focus-visible:ring-red-500"
              )}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "admin-email-error" : undefined}
            />
            {emailError && (
              <p
                id="admin-email-error"
                className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>{emailError}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-phone" className="text-xs font-semibold text-gray-700">
              Phone Number
            </Label>
            <Input
              id="admin-phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              autoComplete="off"
              placeholder="e.g. +251911234567 or 0911234567"
              className={cn("h-9 text-sm", phoneError && "border-red-500 focus-visible:ring-red-500")}
              aria-invalid={!!phoneError}
            />
            {phoneError && (
              <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>{phoneError}</span>
              </p>
            )}
          </div>
        </div>

        {/* Assigned Facility */}
        <div className="space-y-1.5">
          <Label htmlFor="admin-facility" className="text-xs font-semibold text-gray-700">
            Assigned Facility <span className="text-red-500">*</span>
          </Label>
          <select
            id="admin-facility"
            value={facilityId}
            onChange={(e) => {
              setFacilityId(e.target.value);
              if (facilityError) setFacilityError(null);
            }}
            required
            className={cn(
              "w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#194611] focus:border-transparent cursor-pointer",
              facilityError && "border-red-500 focus:ring-red-500"
            )}
          >
            <option value="">Select a healthcare facility...</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} {f.region ? `(${f.region})` : ""}
              </option>
            ))}
          </select>
          {facilityError && (
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{facilityError}</span>
            </p>
          )}
        </div>

        {/* Professional Qualification */}
        <div className="space-y-1.5">
          <Label htmlFor="admin-qualification" className="text-xs font-semibold text-gray-700">
            Professional Title / Qualification
          </Label>
          <Input
            id="admin-qualification"
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            autoComplete="off"
            className="h-9 text-sm"
          />
        </div>

        {/* Generated Temporary Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="admin-password" className="text-xs font-semibold text-gray-700">
              Temporary Password <span className="text-red-500">*</span>
            </Label>
            <span className="text-[11px] text-emerald-700 font-medium">Auto-generated</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                required
                autoComplete="new-password"
                className={cn(
                  "h-9 font-mono text-xs font-medium text-gray-800 pr-9 bg-gray-50/50",
                  passwordError && "border-red-500 focus-visible:ring-red-500"
                )}
                aria-invalid={!!passwordError}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleRegeneratePassword}
              title="Regenerate secure password"
              className="h-9 px-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition cursor-pointer flex items-center justify-center shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleCopyPassword}
              title="Copy password to clipboard"
              className="h-9 px-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-[#194611] transition cursor-pointer flex items-center justify-center shrink-0"
            >
              {copiedPassword ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {passwordError && (
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{passwordError}</span>
            </p>
          )}

          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
            <p className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
              The administrator will be prompted to reset their password upon initial login.
            </p>
            {copiedPassword && (
              <span className="text-emerald-700 font-semibold">Copied to clipboard!</span>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-9 text-xs bg-[#194611] hover:bg-[#12330c] text-white font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Registering Admin...
              </>
            ) : (
              "Create Facility Admin"
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
}
