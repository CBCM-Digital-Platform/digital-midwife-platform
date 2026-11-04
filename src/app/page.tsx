"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  Variants,
  AnimatePresence,
  Transition,
} from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  Award,
  Sparkles,
  Building2,
  BookOpen,
  BarChart3,
  CheckCircle2,
  HeartHandshake,
  Stethoscope,
  Lock,
  ChevronRight,
  GraduationCap,
  Layers,
  FileCheck2,
  Clock,
  Eye,
  Sliders,
  Laptop,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Animated Counter Component for Statistics
function Counter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString()
  );
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (isInView) {
      animate(motionValue, value, {
        duration: 2.2,
        ease: [0.16, 1, 0.3, 1],
      });
    }
  }, [isInView, motionValue, value]);

  useEffect(() => {
    return rounded.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest}${suffix}`;
      }
    });
  }, [rounded, prefix, suffix]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}0{suffix}
    </span>
  );
}

// Framer Motion Animation Variants using smooth spring physics
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

const springTransition: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
};

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState<string>("mentor");

  return (
    <div className="min-h-screen bg-[#FDFDFE] text-slate-900 selection:bg-[#FDD028]/30 selection:text-[#194611] overflow-x-hidden">
      {/* ───────────────────────────────────────────────────────────
          TOP NAVIGATION BAR (OFFICIAL LOGO & CALM ACCENTS)
      ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            {/* Center for Adolescent Girls Health official logo */}
            <img
              src="/logo.png"
              alt="Center for Adolescent Girls Health"
              className="h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
            />
            <div className="h-7 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#194611]">CBCM</span>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FDD028]/15 text-[#194611] border border-[#FDD028]/40">
                  Clinical Mentorship
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-0.5">
                Competency-Based Clinical Mentorship Platform
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
              <a href="#how-it-works" className="hover:text-[#194611] transition-colors">
                How It Works
              </a>
              <a href="#roles" className="hover:text-[#194611] transition-colors">
                Platform Roles
              </a>
              <a href="#impact" className="hover:text-[#194611] transition-colors">
                Clinical Impact
              </a>
              <a href="#security" className="hover:text-[#194611] transition-colors">
                Governance
              </a>
            </div>

            {/* Exclusive Login Action - No Registration */}
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "default" }),
                "bg-[#194611] hover:bg-[#13380d] text-white font-semibold shadow-xs hover:shadow-md transition-all rounded-xl px-5 h-10 text-sm flex items-center gap-2 cursor-pointer"
              )}
            >
              <span>Log In</span>
              <ArrowRight className="h-4 w-4 text-[#FDD028]" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────
          HERO SECTION (CLEAN EDGE-TO-EDGE PHOTO & FLOATING EVALUATION BADGE)
      ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Soft, calm background atmospheric glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[520px] pointer-events-none -z-10 opacity-40">
          <div className="absolute -top-24 left-1/4 w-[420px] h-[420px] bg-[#194611]/8 rounded-full blur-3xl" />
          <div className="absolute top-16 right-1/4 w-[380px] h-[380px] bg-[#FDD028]/12 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Column: Headlines & Main CTA */}
            <motion.div
              className="lg:col-span-7 flex flex-col items-start text-left"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
            >
              {/* Refined eyebrow pill with subtle warm gold spark */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#194611]/5 border border-[#194611]/15 text-[#194611] text-xs font-semibold mb-6 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-[#FDD028] fill-[#FDD028]/70" />
                <span>Center for Adolescent Girls Health • CBCM Clinical Program</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-6">
                Elevating Clinical Skills.{" "}
                <span className="text-[#194611] relative">
                  Saving Mother & Newborn Lives.
                  <span className="block h-1 w-24 bg-[#FDD028] rounded-full mt-2 opacity-90" />
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed mb-8 max-w-2xl">
                The CBCM platform connects senior preceptors with frontline midwives across accredited
                teaching hospitals. Standardize clinical evaluations, oversee competency milestones,
                and transform health outcomes.
              </p>

              {/* Exclusive Login CTA & Badges */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-10">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "bg-[#194611] hover:bg-[#12360d] text-white font-semibold shadow-md shadow-[#194611]/20 hover:shadow-lg transition-all rounded-xl h-13 px-8 text-base flex items-center justify-center gap-2.5 cursor-pointer"
                  )}
                >
                  <span>Log In to Platform</span>
                  <ArrowRight className="h-5 w-5 text-[#FDD028]" />
                </Link>

                <a
                  href="#how-it-works"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-slate-300 text-slate-700 hover:text-[#194611] hover:bg-slate-50 h-13 px-6 rounded-xl font-medium text-base flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  )}
                >
                  <span>Explore System</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </a>
              </div>

              {/* Clinical Verification Badges */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                  <span>Facility-Led Cohorts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                  <span>National Guidelines</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                  <span>Role-Based Access</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Hero Real Midwife Photo & Floating Pass Card */}
            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springTransition, delay: 0.15 }}
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Gentle ambient background glow */}
                <div className="absolute -inset-3 bg-gradient-to-tr from-[#194611]/15 via-[#FDD028]/20 to-[#194611]/10 rounded-3xl blur-2xl opacity-70" />

                {/* Pure edge-to-edge photo with rounded-3xl and soft shadow */}
                <div className="relative w-full h-[480px] sm:h-[530px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 group">
                  <img
                    src="/image.png"
                    alt="Midwife Mentors and Mentees outside Operation Room"
                    className="w-full h-full object-cover object-[50%_18%] group-hover:scale-102 transition-transform duration-700"
                    loading="eager"
                  />

                  {/* Gradient sheen overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating badge top right: Active Hospitals */}
                <motion.div
                  className="absolute -top-3 -right-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-md px-3.5 py-2 flex items-center gap-2.5 hidden sm:flex z-20"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-800">12 Hospitals Connected</span>
                </motion.div>

                {/* Floating Shadcn Card: Theory Score Pass badge overlapping bottom-left */}
                <motion.div
                  className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 z-20"
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...springTransition, delay: 0.55 }}
                >
                  <Card className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 min-w-[240px]">
                    <div className="h-10 w-10 rounded-xl bg-[#194611]/10 text-[#194611] flex items-center justify-center shrink-0 border border-[#194611]/15">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900">Theory Score: 85%</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                          Pass
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Clinical Competency Verified
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          HOW IT WORKS (3 BALANCED ALIGNED CLINICAL CARDS)
      ──────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 sm:py-28 bg-slate-50/70 border-y border-slate-200/80 scroll-mt-20 relative overflow-hidden">
        {/* Soft, calm background atmospheric accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#194611]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#FDD028]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={springTransition}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#194611]/8 text-[#194611] text-xs font-bold uppercase tracking-wider mb-4 border border-[#194611]/15 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-[#FDD028] fill-[#FDD028]" />
                <span>Standardized Clinical Workflow</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
                How CBCM Powers <span className="text-[#194611]">Hospital Mentorship</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                A unified 3-stage clinical progression framework connecting bedside evaluations,
                standardized curriculum authoring, and sequential competency pacing.
              </p>
            </motion.div>
          </div>

          {/* 3 Perfectly Aligned Clinical Cards */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* ── CARD 1: On-The-Floor OSCE Assessments */}
            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  {/* Image container: aspect 4/3 ensures full photo visibility without head-cropping */}
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 mb-6 group-hover:border-slate-300 transition-colors">
                    <img
                      src="/image2.jpg"
                      alt="Midwife mentor conducting clinical skills assessment"
                      className="w-full h-full object-cover object-[50%_18%] group-hover:scale-103 transition-transform duration-500"
                    />
                    {/* Top step badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/80 shadow-xs flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#194611]" />
                      <span className="text-[11px] font-bold text-[#194611] uppercase tracking-wider">Step 01</span>
                    </div>
                    {/* Bottom status badge */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/80 shadow-md flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="text-[11px] font-bold text-slate-900 truncate">
                          Live Station • Bedside Evaluation
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header & title */}
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#194611]/8 text-[#194611] text-[11px] font-bold uppercase tracking-wider border border-[#194611]/12 mb-3 w-fit">
                    <Stethoscope className="h-3.5 w-3.5 text-[#194611]" />
                    <span>Objective Clinical OSCE</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-[#194611] transition-colors mb-3 leading-snug">
                    On-The-Floor OSCE Assessments
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Senior mentors conduct bedside observation using standardized digital OSCE checklists.
                    Score procedural steps live with split-screen rubrics and submit immediate formative feedback.
                  </p>
                </div>

                {/* Features list pinned to bottom for perfect alignment */}
                <div className="mt-auto pt-5 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                    <span>Objective scoring criteria</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                    <span>Split-screen grading rubric</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                    <span>Instant formative debrief</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ── CARD 2: Standardized National Curriculum */}
            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  {/* Image container: aspect 4/3 ensures full photo visibility without cropping */}
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 mb-6 group-hover:border-slate-300 transition-colors">
                    <img
                      src="/image3.jpg"
                      alt="Healthcare mentors and admins aligning on curriculum standards"
                      className="w-full h-full object-cover object-[50%_20%] group-hover:scale-103 transition-transform duration-500"
                    />
                    {/* Top step badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/80 shadow-xs flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#194611]" />
                      <span className="text-[11px] font-bold text-[#194611] uppercase tracking-wider">Step 02</span>
                    </div>
                    {/* Bottom status badge */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/80 shadow-md flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#194611] shrink-0" />
                        <span className="text-[11px] font-bold text-slate-900 truncate">
                          National Healthcare Framework
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header & title */}
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#194611]/8 text-[#194611] text-[11px] font-bold uppercase tracking-wider border border-[#194611]/12 mb-3 w-fit">
                    <BookOpen className="h-3.5 w-3.5 text-[#194611]" />
                    <span>Super Admin Authoring</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-[#194611] transition-colors mb-3 leading-snug">
                    Standardized Curriculum
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Super Admins centralize clinical learning modules across thematic areas, ensuring
                    hospital cohorts adhere to national health ministry directives and accredited protocols.
                  </p>
                </div>

                {/* Features list pinned to bottom for perfect alignment */}
                <div className="mt-auto pt-5 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                    <span>MOH directive alignment</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                    <span>Thematic domain mapping</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                    <span>Centrally approved resources</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ── CARD 3: Drip-Feed Learning & Milestones */}
            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  {/* Image container: aspect 4/3 ensures full photo visibility without cropping */}
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 mb-6 group-hover:border-slate-300 transition-colors">
                    <img
                      src="/image1.jpg"
                      alt="Midwives studying clinical modules in classroom"
                      className="w-full h-full object-cover object-[50%_25%] group-hover:scale-103 transition-transform duration-500"
                    />
                    {/* Top step badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/80 shadow-xs flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#194611]" />
                      <span className="text-[11px] font-bold text-[#194611] uppercase tracking-wider">Step 03</span>
                    </div>
                    {/* Bottom status badge */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/80 shadow-md flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-900 truncate">
                          Milestone-Gated Release
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header & title */}
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#194611]/8 text-[#194611] text-[11px] font-bold uppercase tracking-wider border border-[#194611]/12 mb-3 w-fit">
                    <Layers className="h-3.5 w-3.5 text-[#194611]" />
                    <span>Competency Pacing</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-[#194611] transition-colors mb-3 leading-snug">
                    Drip-Feed Learning
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Modules unlock sequentially as mentees master prerequisite competencies, preventing
                    cognitive overload and ensuring solid foundational clinical skills before advancement.
                  </p>
                </div>

                {/* Features list pinned to bottom for perfect alignment */}
                <div className="mt-auto pt-5 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                    <span>Prerequisite-gated progression</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                    <span>Verified milestone mastery</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-[#194611] shrink-0" />
                    <span>Cognitive skill retention</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          ROLE-BASED ECOSYSTEM (INTERACTIVE SHADCN TABS)
      ──────────────────────────────────────────────────────────── */}
      <section id="roles" className="py-28 bg-white relative overflow-hidden scroll-mt-20 border-b border-slate-200/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(25,70,17,0.06)_0%,_transparent_55%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={springTransition}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#194611]/8 text-[#194611] text-xs font-bold uppercase tracking-widest mb-5 border border-[#194611]/20 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#194611]" />
                Role-Based Ecosystem
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
                A Platform for{" "}
                <span className="text-[#194611]">Every Role</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed">
                Tailored interfaces and strict RBAC privileges designed specifically for each tier of
                clinical mentorship and hospital administration.
              </p>
            </motion.div>
          </div>

          {/* Interactive Role Tabs */}
          <div className="w-full max-w-6xl mx-auto">
            <Tabs
              value={activeRole}
              onValueChange={(val) => setActiveRole(val as string)}
              className="w-full flex flex-col items-center"
            >
              {/* Tab Triggers */}
              <div className="w-full flex justify-center mb-10 overflow-x-auto px-2 py-1">
                <TabsList className="bg-white p-1.5 rounded-2xl border border-slate-200 inline-flex gap-1 shadow-sm">
                  {[
                    { value: "super_admin", label: "Super Admin" },
                    { value: "facility_admin", label: "Facility Admin" },
                    { value: "mentor", label: "Mentor" },
                    { value: "mentee", label: "Mentee" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all data-active:bg-[#194611] data-active:text-[#FDD028] data-active:shadow-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Animated Tab Contents via AnimatePresence */}
              <div className="w-full">
                <AnimatePresence mode="wait">
                  {/* 1. Super Admin View */}
                  {activeRole === "super_admin" && (
                    <motion.div
                      key="super_admin"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={springTransition}
                      className="w-full"
                    >
                      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-lg overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                          {/* Left: text */}
                          <div className="p-8 sm:p-12 flex flex-col justify-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#194611]/10 text-[#194611] text-[11px] font-bold uppercase tracking-wider mb-5 border border-[#194611]/15 w-fit">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              System-Wide Governance
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 leading-snug">
                              National Curriculum &amp; Content Creation
                            </h3>
                            <p className="text-slate-500 text-sm sm:text-[15px] leading-relaxed mb-8">
                              Super Administrators manage the foundation of CBCM. Author learning materials,
                              approve regional medical guidelines, and monitor cross-facility performance
                              dashboards without touching local hospital confidential data.
                            </p>
                            <div className="space-y-4">
                              {[
                                { icon: <BookOpen className="h-3.5 w-3.5" />, label: "Curriculum Authoring", desc: "Create modules, attach clinical guidelines, configure passing thresholds." },
                                { icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Ministry Analytics", desc: "Aggregated metrics tracking midwife competency retention nationwide." },
                                { icon: <Sliders className="h-3.5 w-3.5" />, label: "Facility Oversight", desc: "Provision teaching hospitals and assign authorized Facility Administrators." },
                              ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3.5">
                                  <div className="h-7 w-7 rounded-lg bg-[#194611] text-[#FDD028] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <span className="text-sm font-bold text-slate-800">{item.label}: </span>
                                    <span className="text-sm text-slate-500">{item.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Right: feature icon grid */}
                          <div className="bg-slate-50/80 border-l border-slate-200/70 p-8 sm:p-10 grid grid-cols-2 gap-4 content-center">
                            {[
                              { icon: <Sparkles className="h-5 w-5" />, color: "emerald", label: "Content Creation", desc: "Rich media, videos & objective rubrics." },
                              { icon: <Building2 className="h-5 w-5" />, color: "amber", label: "Hospital Directory", desc: "12+ teaching hospital networks." },
                              { icon: <FileCheck2 className="h-5 w-5" />, color: "blue", label: "OSCE Standards", desc: "Calibrated checklists aligned nationally." },
                              { icon: <ShieldCheck className="h-5 w-5" />, color: "purple", label: "Role RBAC", desc: "Strict boundary enforcement." },
                            ].map((card, i) => (
                              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                                <div className={`h-10 w-10 rounded-xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center`}>
                                  {card.icon}
                                </div>
                                <span className="font-bold text-slate-900 text-sm leading-tight">{card.label}</span>
                                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 2. Facility Admin View */}
                  {activeRole === "facility_admin" && (
                    <motion.div
                      key="facility_admin"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={springTransition}
                      className="w-full"
                    >
                      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-lg overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                          {/* Left: text */}
                          <div className="p-8 sm:p-12 flex flex-col justify-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#194611]/10 text-[#194611] text-[11px] font-bold uppercase tracking-wider mb-5 border border-[#194611]/15 w-fit">
                              <Building2 className="h-3.5 w-3.5" />
                              Hospital Command Centre
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 leading-snug">
                              Mentor-Mentee Pairing &amp; Content Distribution
                            </h3>
                            <p className="text-slate-500 text-sm sm:text-[15px] leading-relaxed mb-8">
                              Facility Admins manage local hospital operations — mapping senior preceptors to
                              junior midwives, dispatching learning modules, and monitoring compliance without
                              curriculum interference.
                            </p>
                            <div className="space-y-4">
                              {[
                                { label: "Preceptor Pairing", desc: "Assign 1-on-1 pairs based on clinical specialty and ward rotations." },
                                { label: "Module Dispatch", desc: "Grant mentors and cohorts access to required clinical thematic areas." },
                                { label: "Cohort Rosters", desc: "Onboard hospital personnel and maintain active staff rosters." },
                              ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3.5">
                                  <CheckCircle2 className="h-5 w-5 text-[#194611] shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-sm font-bold text-slate-800">{item.label}: </span>
                                    <span className="text-sm text-slate-500">{item.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Right: full-height image */}
                          <div className="relative min-h-[380px] lg:min-h-0">
                            <img
                              src="/image3.jpg"
                              alt="Facility administrator and hospital mentors coordinating mentorship pairs"
                              className="absolute inset-0 w-full h-full object-cover object-[50%_20%]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                              <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/70">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-lg bg-[#194611]/10 text-[#194611] flex items-center justify-center shrink-0">
                                    <Building2 className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">Facility Oversight • Referral Hospital</p>
                                    <p className="text-[11px] text-slate-500">100% Mentee-Preceptor Pairing Compliance</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 3. Mentor (Preceptor) View */}
                  {activeRole === "mentor" && (
                    <motion.div
                      key="mentor"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={springTransition}
                      className="w-full"
                    >
                      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-lg overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                          {/* Left: text */}
                          <div className="p-8 sm:p-12 flex flex-col justify-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#194611]/10 text-[#194611] text-[11px] font-bold uppercase tracking-wider mb-5 border border-[#194611]/15 w-fit">
                              <Stethoscope className="h-3.5 w-3.5" />
                              Senior Clinical Preceptor
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 leading-snug">
                              Bedside Coaching &amp; OSCE Assessment
                            </h3>
                            <p className="text-slate-500 text-sm sm:text-[15px] leading-relaxed mb-8">
                              Senior preceptors oversee assigned mentees directly on the hospital floor —
                              conducting bedside mentorship sessions, grading clinical skills with digital OSCE
                              criteria, and assigning targeted learning interventions.
                            </p>
                            <div className="space-y-4">
                              {[
                                { label: "Live Digital OSCE", desc: "Grading checklist for resuscitation, active labor, and postpartum care." },
                                { label: "Action Plans", desc: "Identify gaps and set concrete remedial action plans for subsequent rounds." },
                                { label: "Progress Tracking", desc: "Monitor mentee score trajectories across quarterly mentoring rounds." },
                              ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3.5">
                                  <CheckCircle2 className="h-5 w-5 text-[#194611] shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-sm font-bold text-slate-800">{item.label}: </span>
                                    <span className="text-sm text-slate-500">{item.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Right: full-height image — mentor uses image1.jpg */}
                          <div className="relative min-h-[380px] lg:min-h-0">
                            <img
                              src="/image1.jpg"
                              alt="Senior preceptors reviewing clinical mentorship protocols"
                              className="absolute inset-0 w-full h-full object-cover object-[50%_20%]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                              <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/70">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-lg bg-[#194611]/10 text-[#194611] flex items-center justify-center shrink-0">
                                    <Stethoscope className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">Senior Midwife Preceptors • Bedside Observation</p>
                                    <p className="text-[11px] text-slate-500">Real-time scoring with instant debrief</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 4. Mentee (Junior Midwife) View */}
                  {activeRole === "mentee" && (
                    <motion.div
                      key="mentee"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={springTransition}
                      className="w-full"
                    >
                      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-lg overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                          {/* Left: text */}
                          <div className="p-8 sm:p-12 flex flex-col justify-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#194611]/10 text-[#194611] text-[11px] font-bold uppercase tracking-wider mb-5 border border-[#194611]/15 w-fit">
                              <GraduationCap className="h-3.5 w-3.5" />
                              Frontline Midwife Mentee
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 leading-snug">
                              Distraction-Free Exam Mode &amp; Competency Mastery
                            </h3>
                            <p className="text-slate-500 text-sm sm:text-[15px] leading-relaxed mb-8">
                              Mentees learn at their own pace with distraction-free theoretical examinations,
                              interactive case studies, and clear visibility into preceptor evaluations and
                              upcoming competency milestones.
                            </p>
                            <div className="space-y-4">
                              {[
                                { label: "Distraction-Free Exam", desc: "Focus-first test environment with timed questions and instant review." },
                                { label: "Clinical Feedback", desc: "Read comprehensive preceptor notes and targeted improvement steps." },
                                { label: "Certificate Pathway", desc: "Track progress toward accredited clinical certification and graduation." },
                              ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3.5">
                                  <CheckCircle2 className="h-5 w-5 text-[#194611] shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-sm font-bold text-slate-800">{item.label}: </span>
                                    <span className="text-sm text-slate-500">{item.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Right: full-height image */}
                          <div className="relative min-h-[380px] lg:min-h-0">
                            <img
                              src="/image4.jpg"
                              alt="Junior midwife engaged in clinical study and digital learning"
                              className="absolute inset-0 w-full h-full object-cover object-[50%_15%]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                              <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/70">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-lg bg-[#194611]/10 text-[#194611] flex items-center justify-center shrink-0">
                                    <GraduationCap className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">Mentee Study Center • Exam Mode Active</p>
                                    <p className="text-[11px] text-slate-500">Focus UI • No Popups • Instant Verification</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Tabs>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          IMPACT / RECOMMENDED SECTION (ANIMATED COUNT-UP STATS)
      ──────────────────────────────────────────────────────────── */}
      <section id="impact" className="py-20 sm:py-28 bg-slate-50/70 border-t border-slate-200/80 relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={springTransition}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#194611]/8 text-[#194611] text-xs font-bold uppercase tracking-wider mb-4 border border-[#194611]/15">
                Measurable Healthcare Impact
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#194611] tracking-tight mb-4">
                Strengthening Frontline Healthcare Capacity
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                Standardized clinical mentorship drives measurable improvements in neonatal
                resuscitation, obstetric emergency management, and respectful maternity care.
              </p>
            </motion.div>
          </div>

          {/* 4 Animated Counter Statistics Cards with Spring Reveal */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center hover:shadow-md transition-all hover:border-[#194611]/20 hover:-translate-y-1"
            >
              <div className="h-11 w-11 mx-auto rounded-xl bg-[#194611]/10 text-[#194611] flex items-center justify-center mb-3">
                <Building2 className="h-5 w-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#194611] mb-1">
                <Counter value={12} suffix="+" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Accredited Hospitals</p>
              <p className="text-[11px] text-slate-500 mt-1">Teaching & Referral Facilities</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center hover:shadow-md transition-all hover:border-[#194611]/20 hover:-translate-y-1"
            >
              <div className="h-11 w-11 mx-auto rounded-xl bg-[#194611]/10 text-[#194611] flex items-center justify-center mb-3">
                <Award className="h-5 w-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#194611] mb-1">
                <Counter value={450} suffix="+" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Certified Preceptors</p>
              <p className="text-[11px] text-slate-500 mt-1">Senior Midwife Mentors</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center hover:shadow-md transition-all hover:border-[#194611]/20 hover:-translate-y-1"
            >
              <div className="h-11 w-11 mx-auto rounded-xl bg-[#194611]/10 text-[#194611] flex items-center justify-center mb-3">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#194611] mb-1">
                <Counter value={1850} suffix="+" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Midwives Empowered</p>
              <p className="text-[11px] text-slate-500 mt-1">Frontline Clinical Mentees</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center hover:shadow-md transition-all hover:border-[#194611]/20 hover:-translate-y-1"
            >
              <div className="h-11 w-11 mx-auto rounded-xl bg-[#194611]/10 text-[#194611] flex items-center justify-center mb-3">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#194611] mb-1">
                <Counter value={98} suffix="%" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Competency Retention</p>
              <p className="text-[11px] text-slate-500 mt-1">Verified Clinical Pass Rate</p>
            </motion.div>
          </motion.div>

          {/* ───────────────────────────────────────────────────────────
              FINAL HIGH-IMPACT LOGIN CTA BANNER (SPRING SCALE-UP REVEAL)
          ──────────────────────────────────────────────────────────── */}
          <motion.div
            className="relative rounded-3xl bg-gradient-to-br from-[#194611] via-[#143d0d] to-[#0c2408] p-8 sm:p-14 text-white shadow-2xl shadow-[#194611]/25 overflow-hidden"
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={springTransition}
          >
            {/* Subtle warm ambient shapes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FDD028]/12 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#FDD028] text-xs font-semibold mb-6 border border-white/10">
                <Lock className="h-3.5 w-3.5" />
                <span>Restricted Health Facility Portal</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
                Ready to Access Your Clinical Mentorship Dashboard?
              </h2>

              <p className="text-base sm:text-lg text-white/80 max-w-2xl mb-8 leading-relaxed font-normal">
                Log in to review assigned cohorts, conduct competency evaluations, or analyze
                cross-hospital clinical indicators.
              </p>

              {/* Exclusive Login Button */}
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-[#FDD028] hover:bg-[#eabf20] text-[#194611] font-bold shadow-lg shadow-black/20 hover:shadow-xl transition-all rounded-xl h-14 px-9 text-base flex items-center gap-3 cursor-pointer"
                )}
              >
                <span>Log In to CBCM Platform</span>
                <ArrowRight className="h-5 w-5 text-[#194611]" />
              </Link>

              <p className="text-xs text-white/60 mt-5">
                Authorized access only. Accounts are issued by designated facility administrators.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          FOOTER
      ──────────────────────────────────────────────────────────── */}
      <footer id="security" className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-800">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.png"
                alt="Center for Adolescent Girls Health"
                className="h-10 w-auto object-contain brightness-110"
              />
              <div className="h-6 w-px bg-gray-700 hidden sm:block" />
              <div>
                <span className="font-bold text-white text-base">CBCM Platform</span>
                <p className="text-xs text-gray-400">
                  Competency-Based Clinical Mentorship for Midwives
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="/login" className="hover:text-white transition-colors font-medium">
                Platform Login
              </Link>
              <a href="#how-it-works" className="hover:text-white transition-colors font-medium">
                How It Works
              </a>
              <a href="#roles" className="hover:text-white transition-colors font-medium">
                Roles
              </a>
              <a href="#impact" className="hover:text-white transition-colors font-medium">
                Performance Metrics
              </a>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} CBCM Digital Platform • Center for Adolescent Girls Health. All rights reserved.</p>
            <p className="text-center sm:text-right">
              Confidential Clinical Operations • Facility-Scoped Role-Based Access
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
