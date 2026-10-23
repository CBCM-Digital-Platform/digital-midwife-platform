"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  MoreVertical,
  XCircle,
} from "lucide-react";
import { ClinicalUser } from "@/types/user";

interface UserActionMenuProps {
  user: ClinicalUser;
  isOpen: boolean;
  isUpdating: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpenDetail: (user: ClinicalUser) => void;
  onUpdateStatus: (user: ClinicalUser, newStatus: string) => void;
  onConfirmStatusAction: (user: ClinicalUser, targetStatus: "inactive" | "suspended") => void;
}

export function UserActionMenu({
  user,
  isOpen,
  isUpdating,
  onToggle,
  onClose,
  onOpenDetail,
  onUpdateStatus,
  onConfirmStatusAction,
}: UserActionMenuProps) {
  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onToggle}
        disabled={isUpdating}
        className={`p-1.5 rounded-lg border transition cursor-pointer ${
          isOpen
            ? "bg-gray-100 border-gray-300 text-gray-800"
            : "border-transparent hover:bg-gray-100 text-gray-400 hover:text-gray-700"
        }`}
        aria-label="Row options"
        title="Actions"
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#194611]" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-xl border border-gray-200 z-50 py-1 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDetail(user);
              }}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-gray-500" />
              <span>View Profile</span>
            </button>
          </div>

          <div className="py-1">
            <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Change Status
            </div>
            <button
              type="button"
              disabled={user.status === "active"}
              onClick={() => onUpdateStatus(user, "active")}
              className={`w-full text-left px-3.5 py-1.5 text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                user.status === "active"
                  ? "text-emerald-700 bg-emerald-50 font-semibold"
                  : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Set Active</span>
            </button>

            <button
              type="button"
              disabled={user.status === "inactive"}
              onClick={() => {
                onClose();
                onConfirmStatusAction(user, "inactive");
              }}
              className={`w-full text-left px-3.5 py-1.5 text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                user.status === "inactive"
                  ? "text-gray-700 bg-gray-100 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <XCircle className="h-3.5 w-3.5 text-gray-500" />
              <span>Set Inactive</span>
            </button>

            <button
              type="button"
              disabled={(user.status as string) === "suspended"}
              onClick={() => {
                onClose();
                onConfirmStatusAction(user, "suspended");
              }}
              className={`w-full text-left px-3.5 py-1.5 text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                (user.status as string) === "suspended"
                  ? "text-red-700 bg-red-50 font-semibold"
                  : "text-gray-700 hover:bg-red-50 hover:text-red-700"
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              <span>Set Suspended</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
