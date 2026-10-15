"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Shield,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { ClinicalUser, MentorUser, MenteeUser } from "@/types/user";
import { getUserById, changeUserStatus } from "@/services/users.service";

interface UserDetailDialogProps {
  user: ClinicalUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated?: (userId: string, newStatus: string) => void;
}

export function UserDetailDialog({
  user,
  open,
  onOpenChange,
  onStatusUpdated,
}: UserDetailDialogProps) {
  const [currentUser, setCurrentUser] = useState<ClinicalUser | null>(user);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>(user?.status || "active");

  // Fetch fresh user data via getUserById whenever the dialog is opened
  useEffect(() => {
    if (!open || !user?.id) {
      setCurrentUser(user);
      setStatusMessage(null);
      return;
    }

    setCurrentUser(user);
    setTargetStatus(user.status || "active");
    setStatusMessage(null);

    let isMounted = true;
    setIsLoading(true);

    getUserById(String(user.id))
      .then((freshUser) => {
        if (isMounted && freshUser && freshUser.id) {
          setCurrentUser(freshUser);
          setTargetStatus(freshUser.status || "active");
        }
      })
      .catch((err) => {
        console.warn("Could not fetch detailed user by ID, using local cached data:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, user]);

  if (!currentUser) return null;

  const role = currentUser.role || (user?.role ?? "mentee");
  const isMentor = role === "mentor";
  const name = currentUser.name || "Clinician";
  const systemId = currentUser.systemId || `ID-${currentUser.id}`;

  const handleStatusChange = async (newStatus: string) => {
    if (!currentUser.id || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const res = await changeUserStatus(String(currentUser.id), newStatus);

      if (res.success) {
        setTargetStatus(newStatus);
        setCurrentUser((prev) => (prev ? ({ ...prev, status: newStatus as any } as ClinicalUser) : null));
        setStatusMessage({
          type: "success",
          text: `Status successfully updated to "${newStatus}".`,
        });
        onStatusUpdated?.(String(currentUser.id), newStatus);
      } else {
        setStatusMessage({
          type: "error",
          text: res.message || "Failed to update status on server.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "An unexpected error occurred while updating status.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    }
    if (s === "pending" || s === "pending_start") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="h-3 w-3 text-amber-600" />
          Pending
        </span>
      );
    }
    if (s === "on_leave") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Calendar className="h-3 w-3 text-blue-600" />
          On Leave
        </span>
      );
    }
    if (s === "suspended") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="h-3 w-3 text-red-600" />
          Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
        <span className="h-2 w-2 rounded-full bg-gray-400" />
        Inactive
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden bg-white border border-gray-100 shadow-2xl rounded-2xl">
        {/* HEADER */}
        <DialogHeader className="p-6 bg-gray-50/80 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-gray-200 shadow-xs ${
                  currentUser.avatarBgColor || (isMentor ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800")
                }`}
              >
                {currentUser.avatarInitials || "CP"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-gray-900 leading-tight">
                    {name}
                  </DialogTitle>
                  {isLoading && (
                    <span title="Syncing fresh data...">
                      <RefreshCw className="h-3.5 w-3.5 text-gray-400 animate-spin" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 font-mono tracking-wider font-semibold">{systemId}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                    {role}
                  </span>
                </div>
              </div>
            </div>

            <div>{getStatusBadge(currentUser.status)}</div>
          </div>
          <DialogDescription className="sr-only">
            Detailed clinical profile and administrative status controls for {name}.
          </DialogDescription>
        </DialogHeader>

        {/* STATUS ACTION BAR (Backend valid statuses: active, inactive, suspended) */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-700">Account Access Status:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isUpdatingStatus || currentUser.status === "active"}
              onClick={() => handleStatusChange("active")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition cursor-pointer flex items-center gap-1 ${
                currentUser.status === "active"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              Active
            </button>

            <button
              type="button"
              disabled={isUpdatingStatus || currentUser.status === "inactive"}
              onClick={() => handleStatusChange("inactive")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition cursor-pointer flex items-center gap-1 ${
                currentUser.status === "inactive"
                  ? "bg-gray-700 text-white border-gray-700 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <XCircle className="h-3 w-3" />
              Inactive
            </button>

            <button
              type="button"
              disabled={isUpdatingStatus || (currentUser.status as string) === "suspended"}
              onClick={() => handleStatusChange("suspended")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition cursor-pointer flex items-center gap-1 ${
                (currentUser.status as string) === "suspended"
                  ? "bg-red-600 text-white border-red-600 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              }`}
            >
              <AlertCircle className="h-3 w-3" />
              Suspended
            </button>

            {isUpdatingStatus && (
              <Loader2 className="h-4 w-4 animate-spin text-[#194611] ml-1" />
            )}
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-xs flex items-center gap-2 border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span className="flex-1 font-medium">{statusMessage.text}</span>
          </div>
        )}

        {/* BODY DETAILS */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Contact & Facility Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                Contact Information
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{currentUser.email || "No email registered"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span>{currentUser.phone || "+251 91 123 4567"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                Clinical Facility
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-900 truncate">
                  {currentUser.facility || "Tikur Anbessa Hospital"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span>Regional Medical Center</span>
              </div>
            </div>
          </div>

          {/* Clinical & Academic Details */}
          <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-xs space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Professional & Cadre Details
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px]">Profession / Qualification</span>
                <span className="font-bold text-gray-900">
                  {currentUser.profession || (currentUser as any).highest_qualification || "Midwife Practitioner"}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block text-[11px]">Primary Thematic Area</span>
                <span className="font-bold text-gray-900">{currentUser.thematicArea || "Maternal & Child"}</span>
              </div>

              {isMentor ? (
                <>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Clinical Department</span>
                    <span className="font-bold text-gray-900">
                      {(currentUser as MentorUser).department || "Maternal & Fetal Unit"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Years of Experience</span>
                    <span className="font-bold text-gray-900">
                      {(currentUser as MentorUser).yearsOfExperience ?? 5} Years
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Cadre Level</span>
                    <span className="font-bold text-gray-900">
                      {(currentUser as MenteeUser).cadreLevel || "Junior Midwife Resident"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Knowledge Score Tier</span>
                    <span className="font-bold text-gray-900">
                      {(currentUser as MenteeUser).scoreTier || "Tier 1"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Role-Specific Metric Card */}
          {isMentor ? (
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Active Mentorship Load</p>
                  <p className="text-[11px] text-gray-500">Currently supervised residents</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-blue-700">
                {(currentUser as MentorUser).assignedMenteesCount ?? 0} Mentees
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-bold text-gray-900">Knowledge Mastery Score</span>
                </div>
                <span className="text-xs font-extrabold text-emerald-800">
                  {(currentUser as MenteeUser).knowledgeScore ?? 84}%
                </span>
              </div>
              <div className="w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#194611] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentUser as MenteeUser).knowledgeScore ?? 84}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
