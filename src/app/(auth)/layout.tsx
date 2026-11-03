import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FDFDFE] relative flex flex-col justify-between overflow-x-hidden selection:bg-[#FDD028]/30 selection:text-[#194611]">
      {/* Soft background atmospheric glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[450px] pointer-events-none -z-10 opacity-50">
        <div className="absolute -top-24 left-1/4 w-[400px] h-[400px] bg-[#194611]/8 rounded-full blur-3xl" />
        <div className="absolute top-12 right-1/4 w-[360px] h-[360px] bg-[#FDD028]/12 rounded-full blur-3xl" />
      </div>

      {/* Top navigation header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#194611] transition-colors py-2 px-3 rounded-xl hover:bg-slate-100/80 border border-transparent hover:border-slate-200/60"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ShieldCheck className="h-4 w-4 text-[#194611]" />
          <span>CBCM Facility Portal</span>
        </div>
      </header>

      {/* Centered form viewport */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 z-10">
        {children}
      </main>

      {/* Footer note */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-400 z-10 border-t border-slate-200/60">
        <p>© {new Date().getFullYear()} CBCM Platform • Center for Adolescent Girls Health. Authorized Access Only.</p>
      </footer>
    </div>
  );
}
