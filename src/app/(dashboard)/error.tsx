"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, LogIn } from "lucide-react";
import { signOut } from "next-auth/react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught error:", error);
  }, [error]);

  const isAuthError =
    error?.message?.toLowerCase().includes("unauthorized") ||
    error?.message?.toLowerCase().includes("token") ||
    error?.message?.toLowerCase().includes("forbidden") ||
    error?.status === 401;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-2">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-semibold text-gray-900">
          {isAuthError ? "Session Expired or Unauthorized" : "Failed to Load Data"}
        </h2>

        <p className="text-sm text-gray-600">
          {error?.message || "An unexpected error occurred while communicating with the server."}
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-4 py-2 bg-[#194611] text-white text-sm font-medium rounded-lg hover:bg-[#14380e] transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          {isAuthError && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
