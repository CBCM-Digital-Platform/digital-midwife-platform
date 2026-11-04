"use client";

import { useState, useEffect, Suspense, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { validateEmail } from "@/lib/validators";

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
    // Clear dead session tokens when arriving on login page
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

    const emailRes = validateEmail(email, true);
    if (!emailRes.valid) {
      setError(emailRes.error || "Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password.");
        } else if (result.error === "SessionExpired") {
          setError("Your session has expired. Please sign in again.");
        } else {
          setError(result.error);
        }
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px]">
      {/* Brand Logo & Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          <img
            src="/logo.png"
            alt="Center for Adolescent Girls Health"
            className="h-14 sm:h-16 w-auto mx-auto object-contain"
          />
        </Link>
        <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Sign in
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-500">
          Enter your credentials to access your account
        </p>
      </div>

      {/* Spacious Clean Form Card */}
      <div className="bg-white px-8 py-9 sm:px-11 sm:py-11 border border-slate-200/90 rounded-3xl shadow-sm">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="name@facility.org"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#194611] focus:ring-2 focus:ring-[#194611]/15"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs sm:text-sm font-medium text-slate-500 hover:text-[#194611] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#194611] focus:ring-2 focus:ring-[#194611]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#194611] focus:ring-[#194611]"
              />
              <span>Remember me for 30 days</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#194611] hover:bg-[#12360d] py-3.5 px-5 text-base font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-3"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      {/* Back to Home Link */}
      <div className="text-center mt-7">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[480px] p-12 bg-white rounded-3xl border border-slate-200 text-center text-sm text-slate-500">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
