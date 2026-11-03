"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function SignOutPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    // Clear cookies explicitly as safeguard
    document.cookie = "next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "__Secure-next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    await signOut({ callbackUrl: "/login", redirect: true });
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
          Sign out
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-500">
          Are you sure you want to sign out of your account?
        </p>
      </div>

      {/* Clean Spacious Card matching Login */}
      <div className="bg-white px-8 py-9 sm:px-11 sm:py-11 border border-slate-200/90 rounded-3xl shadow-sm text-center">
        {/* Sign Out Icon */}
        <div className="h-14 w-14 rounded-2xl bg-[#194611]/10 text-[#194611] flex items-center justify-center mx-auto mb-6">
          <LogOut className="h-6 w-6 text-[#194611]" />
        </div>

        {/* User identification info */}
        {session?.user?.email ? (
          <p className="text-sm text-slate-600 mb-6">
            You are currently signed in as{" "}
            <span className="font-semibold text-slate-900">{session.user.email}</span>.
          </p>
        ) : (
          <p className="text-sm text-slate-600 mb-6">
            You will need to re-enter your credentials to access clinical mentorship data.
          </p>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="w-full rounded-xl bg-[#194611] hover:bg-[#12360d] py-3.5 px-5 text-base font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing out..." : "Sign out"}
          </button>

          <Link
            href="/dashboard"
            className="block w-full rounded-xl border border-slate-300 hover:bg-slate-50 py-3 px-5 text-sm font-semibold text-slate-700 transition-colors"
          >
            Cancel and stay signed in
          </Link>
        </div>
      </div>

      {/* Return link */}
      <div className="text-center mt-7">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Return to dashboard
        </Link>
      </div>
    </div>
  );
}
