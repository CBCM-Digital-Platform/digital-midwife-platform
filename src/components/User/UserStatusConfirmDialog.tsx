"use client";

import React from "react";
import { AlertCircle, Loader2, XCircle } from "lucide-react";
import { ClinicalUser } from "@/types/user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserStatusConfirmDialogProps {
  confirmAction: {
    user: ClinicalUser;
    targetStatus: "inactive" | "suspended";
  } | null;
  onClose: () => void;
  onConfirm: (user: ClinicalUser, targetStatus: "inactive" | "suspended") => Promise<void>;
  isUpdating: boolean;
}

export function UserStatusConfirmDialog({
  confirmAction,
  onClose,
  onConfirm,
  isUpdating,
}: UserStatusConfirmDialogProps) {
  return (
    <AlertDialog
      open={Boolean(confirmAction)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                confirmAction?.targetStatus === "suspended"
                  ? "bg-red-100 text-red-600"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {confirmAction?.targetStatus === "suspended" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>
            <AlertDialogTitle>
              {confirmAction?.targetStatus === "suspended"
                ? `Suspend ${confirmAction?.user.name}?`
                : `Deactivate ${confirmAction?.user.name}?`}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {confirmAction?.targetStatus === "suspended"
              ? `Are you sure you want to suspend ${confirmAction?.user.name} (${confirmAction?.user.systemId})? This will immediately suspend account access and active clinical duties.`
              : `Are you sure you want to set ${confirmAction?.user.name} (${confirmAction?.user.systemId}) to inactive? The user will be marked inactive across active facility rosters.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isUpdating}
            onClick={onClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isUpdating}
            onClick={async () => {
              if (!confirmAction) return;
              await onConfirm(confirmAction.user, confirmAction.targetStatus);
              onClose();
            }}
            className={
              confirmAction?.targetStatus === "suspended"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-800 hover:bg-gray-900"
            }
          >
            {isUpdating ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Updating...</span>
              </div>
            ) : confirmAction?.targetStatus === "suspended" ? (
              "Yes, Suspend User"
            ) : (
              "Yes, Set Inactive"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
