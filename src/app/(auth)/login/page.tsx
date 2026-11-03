"use client";

import { useState, useEffect, Suspense, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, HelpCircle, UserCheck } from "lucide-react";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear any dead or corrupted session tokens when arriving on the login page
    document.cookie = "next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "__Secure-next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "SessionExpired") {
        setError("Your session has expired. Please sign in again.");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [urlError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please verify your credentials and try again.");
        } else if (result.error === "SessionExpired") {
          setError("Your session has expired. Please sign in again.");
        } else {
          setError(result.error);
        }
      } else {
        // Hard navigation guarantees fresh session cookies are immediately available to Server Components
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("An unexpected system error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (error) setError(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (error) setError(null);
  };

  // Helper for quick filling local test accounts
  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("password");
    if (error) setError(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Main Login Card */}
      <div className="rounded-3xl bg-white p-7 sm:p-9 shadow-xl shadow-slate-900/5 border border-slate-200/90 relative overflow-hidden">
        {/* Top subtle decorative accent bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#194611] via-[#FDD028] to-[#194611]" />

        {/* Center Logo & Title */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-block group mb-3">
            <img
              src="/logo.png"
              alt="Center for Adolescent Girls Health"
              className="h-14 w-auto mx-auto object-contain transition-transform duration-300 group-hover:scale-103"
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#194611]/8 text-[#194611] text-[11px] font-bold uppercase tracking-wider mb-2 border border-[#194611]/15">
            <ShieldCheck className="h-3 w-3 text-[#194611]" />
            <span>CBCM Clinical Platform</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to Your Account
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            Enter your credentials to access your clinical dashboard
          </p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200/80 p-3.5 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in-50 duration-200">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Address */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="clinician@hospital.org"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#194611] focus:bg-white focus:ring-3 focus:ring-[#194611]/15"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#194611] focus:bg-white focus:ring-3 focus:ring-[#194611]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Options: Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#194611] focus:ring-[#194611]"
              />
              <span>Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="font-semibold text-[#194611] hover:text-[#12360d] hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#194611] hover:bg-[#12360d] py-3 px-4 text-sm font-semibold text-white shadow-md shadow-[#194611]/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Verifying credentials...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-4 w-4 text-[#FDD028]" />
              </span>
            )}
          </button>
        </form>

        {/* Quick Fill Test Accounts (for development/demo convenience) */}
        <div className="mt-7 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Demo Accounts</span>
            </span>
            <span className="text-[11px] text-slate-400">1-click fill</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("admin@test.com")}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700 hover:bg-[#194611]/10 hover:border-[#194611]/30 hover:text-[#194611] transition-all cursor-pointer text-center"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("mentor@test.com")}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700 hover:bg-[#194611]/10 hover:border-[#194611]/30 hover:text-[#194611] transition-all cursor-pointer text-center"
            >
              Mentor
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("mentee@test.com")}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700 hover:bg-[#194611]/10 hover:border-[#194611]/30 hover:text-[#194611] transition-all cursor-pointer text-center"
            >
              Mentee
            </button>
          </div>
        </div>
      </div>

      {/* Support & Compliance note */}
      <div className="mt-5 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
        <span>Need account assistance? Contact your facility administrator</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md p-10 bg-white rounded-3xl shadow-sm text-center text-sm text-slate-500 border border-slate-200">
          <div className="h-6 w-6 border-2 border-[#194611] border-t-transparent animate-spin rounded-full mx-auto mb-3" />
          <span>Loading login portal...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
