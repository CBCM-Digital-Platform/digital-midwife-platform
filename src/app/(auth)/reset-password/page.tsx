"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  KeyRound,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/services/auth.service";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special symbol"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || searchParams.get("resetToken") || "";

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setApiError(null);

    if (!token) {
      setApiError("Reset token is missing or invalid. Please request a new password reset link.");
      return;
    }

    try {
      await resetPassword(token, data.newPassword);
      setToastMessage("Password reset successfully! Redirecting to login...");

      // Short delay so the user clearly sees the confirmation toast before navigation
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      console.error("Failed to reset password:", err);
      const msg =
        err?.message ||
        err?.data?.message ||
        err?.data?.error?.message ||
        "Failed to reset password. The reset link may be invalid or expired.";
      setApiError(msg);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <CardHeader className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#194611]">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Reset Your Password
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-gray-500">
            Choose a strong, secure new password for your practitioner account
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-0">
          {!token && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Missing Reset Token</p>
                <p className="mt-0.5">
                  No reset token was found in the URL. If you followed a link from your email, please ensure the entire link was copied.
                </p>
              </div>
            </div>
          )}

          {apiError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <p>{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-semibold text-gray-700">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...register("newPassword")}
                  placeholder="••••••••••••"
                  className="pl-9 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-700">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="••••••••••••"
                  className="pl-9 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Password requirements hint */}
            <div className="rounded-lg bg-gray-50 p-3 text-[11px] text-gray-500 border border-gray-100 space-y-0.5">
              <p className="font-semibold text-gray-700">Password requirements:</p>
              <p>• At least 8 characters</p>
              <p>• Contains at least one number and one symbol</p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full h-10 bg-[#194611] text-white hover:bg-[#14370d] font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Resetting password..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-gray-100 p-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-[#194611] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>

      {/* Success Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#194611] text-white shadow-2xl border border-emerald-800 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-white">Password Updated</p>
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
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8 text-gray-500">
          Loading password reset...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
