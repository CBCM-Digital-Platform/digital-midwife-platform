"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  Variants,
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
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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

// Framer Motion Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function LandingPage() {
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
              <a href="#features" className="hover:text-[#194611] transition-colors">
                Program Benefits
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
          HERO SECTION (CLEAN EDGE-TO-EDGE PHOTO & CALM HARMONIZED ACCENTS)
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
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Calm, refined eyebrow pill with subtle warm gold spark */}
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
                  href="#features"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-slate-300 text-slate-700 hover:text-[#194611] hover:bg-slate-50 h-13 px-6 rounded-xl font-medium text-base flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  )}
                >
                  <span>Explore Features</span>
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

            {/* Right Column: Hero Real Midwife Photo (NO WHITE FRAME) */}
            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Gentle ambient background glow */}
                <div className="absolute -inset-3 bg-gradient-to-tr from-[#194611]/12 via-[#FDD028]/15 to-[#194611]/10 rounded-3xl blur-2xl opacity-60" />

                {/* Pure edge-to-edge photo with rounded-3xl and soft shadow — zero white frame */}
                <div className="relative w-full h-[480px] sm:h-[530px] rounded-3xl overflow-hidden shadow-xl border border-slate-200/70">
                  <img
                    src="/image.png"
                    alt="Midwife Mentors and Mentees outside Operation Room"
                    className="w-full h-full object-cover object-[50%_18%] hover:scale-102 transition-transform duration-700"
                    loading="eager"
                  />
                </div>

                {/* Floating badge top right with calm, refined indicator */}
                <motion.div
                  className="absolute -top-3 -right-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-md px-3.5 py-2 flex items-center gap-2.5 hidden sm:flex"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-800">12 Hospitals Connected</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          FEATURES GRID (3-COLUMN ANIMATED BENEFIT CARDS)
      ──────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-slate-50/70 border-y border-slate-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#194611]/8 text-[#194611] text-xs font-bold uppercase tracking-wider mb-4 border border-[#194611]/15">
                Structured Clinical Architecture
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#194611] tracking-tight mb-4">
                Purpose-Built for Midwifery Clinical Mentorship
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                A unified framework designed for healthcare administrators, senior preceptors, and
                midwives to continuously reinforce vital clinical competencies.
              </p>
            </motion.div>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Feature 1 */}
            <motion.div variants={itemVariants}>
              <Card className="h-full bg-white border border-slate-200/90 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 group">
                <CardHeader className="p-0 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-[#194611]/10 text-[#194611] group-hover:bg-[#194611] group-hover:text-[#FDD028] flex items-center justify-center transition-colors duration-300 mb-4 shadow-2xs">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-[#194611] transition-colors">
                    Competency Assessments
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-sm text-slate-600 leading-relaxed font-normal">
                    Standardized clinical observation checklists and objective scoring for neonatal
                    resuscitation, active labor management, and postpartum hemorrhage control.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={itemVariants}>
              <Card className="h-full bg-white border border-slate-200/90 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 group">
                <CardHeader className="p-0 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-[#194611]/10 text-[#194611] group-hover:bg-[#194611] group-hover:text-[#FDD028] flex items-center justify-center transition-colors duration-300 mb-4 shadow-2xs">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-[#194611] transition-colors">
                    1-on-1 Preceptor Pairing
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-sm text-slate-600 leading-relaxed font-normal">
                    Seamless assignment of frontline junior midwives to experienced hospital mentors.
                    Schedule bedside clinical sessions and track real-time feedback.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={itemVariants}>
              <Card className="h-full bg-white border border-slate-200/90 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 group">
                <CardHeader className="p-0 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-[#194611]/10 text-[#194611] group-hover:bg-[#194611] group-hover:text-[#FDD028] flex items-center justify-center transition-colors duration-300 mb-4 shadow-2xs">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-[#194611] transition-colors">
                    Facility-Led Governance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-sm text-slate-600 leading-relaxed font-normal">
                    Hospital administrators oversee local clinical cycles, manage preceptor rosters,
                    and ensure facility reporting meets national healthcare compliance standards.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={itemVariants}>
              <Card className="h-full bg-white border border-slate-200/90 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 group">
                <CardHeader className="p-0 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-[#194611]/10 text-[#194611] group-hover:bg-[#194611] group-hover:text-[#FDD028] flex items-center justify-center transition-colors duration-300 mb-4 shadow-2xs">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-[#194611] transition-colors">
                    Thematic Learning Modules
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-sm text-slate-600 leading-relaxed font-normal">
                    Curriculum-aligned thematic domains covering maternal triage, respectful maternity
                    care, neonatal emergencies, and adolescent reproductive health education.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 5 */}
            <motion.div variants={itemVariants}>
              <Card className="h-full bg-white border border-slate-200/90 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 group">
                <CardHeader className="p-0 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-[#194611]/10 text-[#194611] group-hover:bg-[#194611] group-hover:text-[#FDD028] flex items-center justify-center transition-colors duration-300 mb-4 shadow-2xs">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-[#194611] transition-colors">
                    Cross-Facility Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-sm text-slate-600 leading-relaxed font-normal">
                    Super administrators and health ministry leadership monitor national rollouts,
                    competency retention rates, and quarterly progress across teaching hospitals.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 6 */}
            <motion.div variants={itemVariants}>
              <Card className="h-full bg-white border border-slate-200/90 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 group">
                <CardHeader className="p-0 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-[#194611]/10 text-[#194611] group-hover:bg-[#194611] group-hover:text-[#FDD028] flex items-center justify-center transition-colors duration-300 mb-4 shadow-2xs">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-[#194611] transition-colors">
                    Role-Based Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-sm text-slate-600 leading-relaxed font-normal">
                    Strict RBAC infrastructure ensuring clinical evaluations, user identities, and
                    hospital records remain confidential and compliant with health regulations.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          IMPACT / RECOMMENDED SECTION (ANIMATED COUNT-UP STATS)
      ──────────────────────────────────────────────────────────── */}
      <section id="impact" className="py-20 sm:py-28 bg-white relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
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

          {/* 4 Animated Counter Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-16">
            <motion.div
              className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 text-center hover:bg-white hover:shadow-md transition-all hover:border-[#194611]/20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-[#194611]/10 text-[#194611] flex items-center justify-center mb-3">
                <Building2 className="h-5 w-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#194611] mb-1">
                <Counter value={12} suffix="+" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Accredited Hospitals</p>
              <p className="text-[11px] text-slate-500 mt-1">Teaching & Referral Facilities</p>
            </motion.div>

            <motion.div
              className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 text-center hover:bg-white hover:shadow-md transition-all hover:border-[#194611]/20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-[#194611]/10 text-[#194611] flex items-center justify-center mb-3">
                <Award className="h-5 w-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#194611] mb-1">
                <Counter value={450} suffix="+" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Certified Preceptors</p>
              <p className="text-[11px] text-slate-500 mt-1">Senior Midwife Mentors</p>
            </motion.div>

            <motion.div
              className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 text-center hover:bg-white hover:shadow-md transition-all hover:border-[#194611]/20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-[#194611]/10 text-[#194611] flex items-center justify-center mb-3">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#194611] mb-1">
                <Counter value={1850} suffix="+" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Midwives Empowered</p>
              <p className="text-[11px] text-slate-500 mt-1">Frontline Clinical Mentees</p>
            </motion.div>

            <motion.div
              className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 text-center hover:bg-white hover:shadow-md transition-all hover:border-[#194611]/20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="h-10 w-10 mx-auto rounded-xl bg-[#194611]/10 text-[#194611] flex items-center justify-center mb-3">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#194611] mb-1">
                <Counter value={98} suffix="%" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Competency Retention</p>
              <p className="text-[11px] text-slate-500 mt-1">Verified Clinical Pass Rate</p>
            </motion.div>
          </div>

          {/* ───────────────────────────────────────────────────────────
              FINAL HIGH-IMPACT LOGIN CTA BANNER (WITH REFINED YELLOW CTA)
          ──────────────────────────────────────────────────────────── */}
          <motion.div
            className="relative rounded-3xl bg-gradient-to-br from-[#194611] via-[#143d0d] to-[#0c2408] p-8 sm:p-14 text-white shadow-2xl shadow-[#194611]/25 overflow-hidden"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
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

              {/* Exclusive Login Button - No Sign-up links */}
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
              <a href="#features" className="hover:text-white transition-colors font-medium">
                Clinical Modules
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
