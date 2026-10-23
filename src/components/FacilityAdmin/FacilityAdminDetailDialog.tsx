"use client";

import React, { useState } from "react";
import { ModalWrapper } from "@/components/common/ModalWrapper";
import { Button } from "@/components/ui/button";
import { updateFacilityAdminStatus } from "@/services/facility-admins.service";
import type { FacilityAdmin, FacilityAdminStatus } from "@/types/facility-admin";
import {
  Building2,
  Mail,
  Phone,
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FacilityAdminDetailDialogProps {
  admin: FacilityAdmin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChanged: (adminId: string, newStatus: FacilityAdminStatus) => void;
}

export function FacilityAdminDetailDialog({
  admin,
  open,
  onOpenChange,
  onStatusChanged,
}: FacilityAdminDetailDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!admin) return null;

  const handleStatusChange = async (targetStatus: FacilityAdminStatus) => {
    try {
      setIsUpdating(true);
      setErrorMsg(null);
      const res = await updateFacilityAdminStatus(admin.id, targetStatus);
      if (res.success) {
        onStatusChanged(admin.id, targetStatus);
        onOpenChange(false);
      } else {
        setErrorMsg(res.message || "Failed to update status.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadgeColor =
    admin.status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : admin.status === "suspended"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <ModalWrapper
      open={open}
      onOpenChange={onOpenChange}
      title="Facility Administrator Profile"
      description={`System ID: #${admin.id} • Registered via Central Ministry Portal`}
      maxWidth="sm:max-w-[520px]"
    >
      <div className="space-y-5">
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* User Card Header */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/75 border border-gray-100">
          <div className="h-12 w-12 rounded-xl bg-[#194611] text-[#FDD028] font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
            {admin.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 truncate">
                {admin.name}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize",
                  statusBadgeColor
                )}
              >
                {admin.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{admin.email}</p>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-gray-100 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Building2 className="h-3.5 w-3.5 text-[#194611]" />
              Assigned Facility
            </div>
            <div className="font-semibold text-gray-900">{admin.facilityName}</div>
          </div>

          <div className="p-3 rounded-lg border border-gray-100 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Briefcase className="h-3.5 w-3.5 text-[#194611]" />
              Qualification / Role
            </div>
            <div className="font-semibold text-gray-900">
              {admin.highestQualification || "Facility Administrator"}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-gray-100 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              Phone Number
            </div>
            <div className="font-semibold text-gray-900">
              {admin.phone || "Not recorded"}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-gray-100 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              Registration Date
            </div>
            <div className="font-semibold text-gray-900">
              {new Date(admin.createdAt || Date.now()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2.5">
          <div className="text-xs font-semibold text-gray-700">Manage Operational Status</div>
          <div className="flex flex-wrap gap-2">
            {admin.status !== "active" && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleStatusChange("active")}
                disabled={isUpdating}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <ShieldCheck className="h-3 w-3 mr-1" />
                )}
                Set as Active
              </Button>
            )}

            {admin.status !== "inactive" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("inactive")}
                disabled={isUpdating}
                className="h-8 text-xs text-gray-700 border-gray-300"
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <ShieldAlert className="h-3 w-3 mr-1" />
                )}
                Set as Inactive
              </Button>
            )}

            {admin.status !== "suspended" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("suspended")}
                disabled={isUpdating}
                className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <ShieldAlert className="h-3 w-3 mr-1" />
                )}
                Suspend Access
              </Button>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
