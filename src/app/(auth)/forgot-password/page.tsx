"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";
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
import { requestPasswordReset } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Password reset request failed:", err);
      // For security and per specification, if the endpoint responds or fails with typical auth responses
      const message =
        err?.message ||
        err?.data?.message ||
        err?.data?.error?.message ||
        "Failed to submit password reset request. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
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
            Forgot Password
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-gray-500">
            {submitted
              ? "Check your inbox for further instructions"
              : "Enter your registered email address and we will send you a reset link"}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-0">
          {submitted ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 border border-emerald-100 text-[#194611]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-900">Reset Link Sent</p>
                  <p className="mt-1 text-emerald-700 leading-relaxed">
                    If an account exists, a reset link has been sent to your email.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <p className="text-xs text-gray-500">
                  Didn&apos;t receive an email? Be sure to check your spam or spam filters, or{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                    }}
                    className="font-medium text-[#194611] hover:underline cursor-pointer"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="practitioner@hospital.org"
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[#194611] text-white hover:bg-[#14370d] font-semibold transition cursor-pointer"
              >
                {loading ? "Sending reset link..." : "Send Reset Link"}
              </Button>
            </form>
          )}
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
    </div>
  );
}
