"use client";

import React, { useState, useEffect } from "react";
import { ModalWrapper } from "@/components/common/ModalWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { createFacility, updateFacility } from "@/services/facilities.service";
import type { Facility, FacilityStatus } from "@/types/facility";
import { Building2, Check, Loader2, AlertCircle, X } from "lucide-react";

const FACILITY_TYPES = [
  "Specialized Hospital",
  "Referral Hospital",
  "General Hospital",
  "Primary Hospital",
  "Health Center",
];

const ETHIOPIA_REGIONS = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Central Ethiopia",
  "Dire Dawa",
  "Gambela",
  "Harari",
  "Oromia",
  "Sidama",
  "Somali",
  "South Ethiopia",
  "South West Ethiopia",
  "Tigray",
];

interface FacilityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility?: Facility | null;
  existingFacilities?: Facility[];
  onSuccess: (facility: Facility) => void;
}

export function FacilityFormDialog({
  open,
  onOpenChange,
  facility,
  existingFacilities = [],
  onSuccess,
}: FacilityFormDialogProps) {
  const isEditing = Boolean(facility);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("");
  const [region, setRegion] = useState("");
  const [zone, setZone] = useState("");
  const [woreda, setWoreda] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [status, setStatus] = useState<FacilityStatus | "">("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form with facility prop on open
  useEffect(() => {
    if (facility) {
      setName(facility.name || "");
      setCode(facility.code || "");
      setType(facility.type || "");
      setRegion(facility.region || "");
      setZone(facility.zone || "");
      setWoreda(facility.woreda || "");
      setContactPerson(facility.contactPerson || "");
      setContactEmail(facility.contactEmail || "");
      setContactPhone(facility.contactPhone || "");
      setStatus(facility.status || "active");
    } else {
      setName("");
      setCode("");
      setType("");
      setRegion("");
      setZone("");
      setWoreda("");
      setContactPerson("");
      setContactEmail("");
      setContactPhone("");
      setStatus("");
    }
    setError(null);
  }, [facility, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Facility Name is required.");
      return;
    }

    if (!type) {
      setError("Please select a facility type.");
      return;
    }

    if (!region) {
      setError("Please select a region.");
      return;
    }

    if (!status) {
      setError("Please select an operational status.");
      return;
    }

    // Check for duplicate facility name (case-insensitive)
    const duplicate = existingFacilities.find(
      (f) =>
        f.id !== facility?.id &&
        f.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicate) {
      setError(`A facility named "${trimmedName}" already exists. Please enter a unique name.`);
      return;
    }

    // Check for duplicate facility code if provided
    const trimmedCode = code.trim();
    if (trimmedCode) {
      const duplicateCode = existingFacilities.find(
        (f) =>
          f.id !== facility?.id &&
          f.code &&
          f.code.trim().toLowerCase() === trimmedCode.toLowerCase()
      );
      if (duplicateCode) {
        setError(`A facility with code "${trimmedCode}" already exists (${duplicateCode.name}).`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: trimmedName,
        code: trimmedCode || undefined,
        type,
        region,
        zone: zone.trim() || undefined,
        woreda: woreda.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        status,
      };

      let result: Facility;
      if (isEditing && facility) {
        result = await updateFacility(facility.id, payload);
      } else {
        result = await createFacility(payload);
      }

      onSuccess(result);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save facility. Please check your network.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="sm:max-w-[580px]"
      title={
        <div className="flex items-center gap-2 text-[#194611]">
          <Building2 className="h-5 w-5" />
          <span>{isEditing ? "Edit Clinical Facility" : "Add New Clinical Facility"}</span>
        </div>
      }
      description={
        isEditing
          ? "Update the facility profile, location, and operational contact information."
          : "Register a healthcare facility to assign clinical mentors and track adolescent healthcare activities."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold">Unable to save facility</p>
              <p className="mt-0.5 text-red-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-800 transition cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Facility Identity */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Facility Details
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Label className="block text-xs font-semibold text-gray-700 mb-1">
                Facility Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="block text-xs font-semibold text-gray-700 mb-1">
                Code / Abbr.
              </Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="block text-xs font-semibold text-gray-700 mb-1">
                Facility Type <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                options={FACILITY_TYPES}
                value={type}
                onChange={setType}
                placeholder="Select facility type"
                searchPlaceholder="Search type..."
                size="sm"
              />
            </div>

            <div>
              <Label className="block text-xs font-semibold text-gray-700 mb-1">
                Operational Status <span className="text-red-500">*</span>
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FacilityStatus)}
                required
                className="w-full h-8 px-2.5 py-1 border border-input rounded-lg text-sm bg-transparent outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer text-gray-700"
              >
                <option value="">Select operational status...</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending Onboarding</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location & Region */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Location & Administration
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="block text-xs font-semibold text-gray-700 mb-1">
                Region <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                options={ETHIOPIA_REGIONS}
                value={region}
                onChange={setRegion}
                placeholder="Select region"
                searchPlaceholder="Search region..."
                size="sm"
              />
            </div>
            <div>
              <Label className="block text-xs font-semibold text-gray-700 mb-1">
                Zone / Sub-city
              </Label>
              <Input
                value={zone}
                onChange={(e) => setZone(e.target.value)}
              />
            </div>
            <div>
              <Label className="block text-xs font-semibold text-gray-700 mb-1">
                Woreda
              </Label>
              <Input
                value={woreda}
                onChange={(e) => setWoreda(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Focal Person & Contact
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="block text-xs font-semibold text-gray-700 mb-1">
                Focal Person
              </Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>
            <div>
              <Label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </Label>
              <Input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                type="email"
              />
            </div>
            <div>
              <Label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number
              </Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                type="tel"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#194611] hover:bg-[#194611]/90 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>{isEditing ? "Update Facility" : "Add Facility"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
