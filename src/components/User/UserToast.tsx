"use client";

import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface UserToastProps {
  toast: { type: "success" | "error"; text: string } | null;
  onClose: () => void;
}

export function UserToast({ toast, onClose }: UserToastProps) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-2xl border transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 ${
        toast.type === "success"
          ? "bg-[#194611] border-emerald-800"
          : "bg-red-800 border-red-900"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-300 shrink-0" />
      )}
      <div className="text-sm">
        <p className="font-semibold text-white">
          {toast.type === "success" ? "Success" : "Error"}
        </p>
        <p className="text-xs text-emerald-100">{toast.text}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white transition cursor-pointer"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
