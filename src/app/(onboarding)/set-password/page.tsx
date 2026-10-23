"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Lock, Eye, EyeOff, AlertCircle, ShieldCheck, CheckCircle2, LogOut, Loader2 } from "lucide-react";
import { changePassword, resetPassword } from "@/services/auth";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();

  const token = searchParams.get("token"); // Present if this came from an emailed invite or reset link
  const isFirstTimeLogin = !token; // Authenticated session redirected because must_change_password is true

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const meetsRequirements =
    newPassword.length >= 8 &&
    /\d/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isFirstTimeLogin && !currentPassword.trim()) {
      setError("Please enter the temporary password provided by your administrator.");
      return;
    }

    if (!meetsRequirements) {
      setError("New password must be at least 8 characters long and contain at least one number and one symbol.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation password do not match.");
      return;
    }

    if (isFirstTimeLogin && currentPassword === newPassword) {
      setError("Your new password must be different from your temporary password.");
      return;
    }

    setLoading(true);
    try {
      if (token) {
        // Token-based password reset
        await resetPassword(token, newPassword);
        setSuccess("Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login?message=PasswordResetSuccess");
        }, 1500);
      } else {
        // Authenticated first-time password reset using change-password endpoint
        await changePassword(currentPassword, newPassword);
        setSuccess("Password updated successfully! Redirecting to your dashboard...");

        // Update local session to clear the must_change_password flag
        if (update) {
          await update({ must_change_password: false });
        }

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1200);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Could not update password. Please check your temporary password and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg border border-gray-100">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#194611]/10 text-[#194611]">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <h1 className="text-xl font-bold text-gray-900">
          {isFirstTimeLogin ? "First-Time Password Reset" : "Reset Your Password"}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-xs text-gray-500 leading-relaxed">
          {isFirstTimeLogin
            ? "Your account was provisioned with a temporary administrator password. For security compliance, you must set your permanent password before accessing the platform."
            : "Please set a strong, unique password for your account."}
        </p>

        {session?.user?.email && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <span>Account:</span>
            <span className="font-semibold">{session.user.email}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-left text-xs font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-left text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1">{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          {/* Current / Temporary Password (only for logged-in first-time reset) */}
          {isFirstTimeLogin && (
            <div>
              <label
                htmlFor="currentPassword"
                className="mb-1 block text-xs font-semibold text-gray-700"
              >
                Temporary Password Given by Admin <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-3.5 pr-10 text-sm text-gray-900 outline-none focus:border-[#194611] focus:ring-1 focus:ring-[#194611]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="mb-1 block text-xs font-semibold text-gray-700"
            >
              New Permanent Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full rounded-lg border border-gray-300 py-2 pl-3.5 pr-10 text-sm text-gray-900 outline-none focus:border-[#194611] focus:ring-1 focus:ring-[#194611]"
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-xs font-semibold text-gray-700"
            >
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-lg border border-gray-300 py-2 pl-3.5 pr-10 text-sm text-gray-900 outline-none focus:border-[#194611] focus:ring-1 focus:ring-[#194611]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements Checklist */}
          <div className="rounded-lg bg-amber-50/80 border border-amber-200/60 p-3 text-xs text-amber-900 space-y-1">
            <p className="font-semibold">Password requirements:</p>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-amber-800">
              <span className={newPassword.length >= 8 ? "text-emerald-700 font-medium" : ""}>
                • Minimum 8 characters
              </span>
              <span className={/\d/.test(newPassword) ? "text-emerald-700 font-medium" : ""}>
                • At least one number
              </span>
              <span className={/[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-700 font-medium" : ""}>
                • At least one symbol
              </span>
              <span className={newPassword && newPassword === confirmPassword ? "text-emerald-700 font-medium" : ""}>
                • Passwords match
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#194611] hover:bg-[#12330c] py-2.5 text-sm font-semibold text-white transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Set Password & Access Dashboard</span>
            )}
          </button>
        </form>

        {/* Switch account or sign out */}
        {session && (
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out and sign in with a different account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8 text-gray-500">
          Loading password verification...
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
