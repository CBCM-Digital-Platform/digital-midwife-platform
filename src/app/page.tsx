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
  CheckCircle2,
  HeartHandshake,
  Stethoscope,
  Lock,
  ChevronRight,
  Layers,
  Newspaper,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getPublicNews, type PublicNewsArticle } from "@/services/news.service";
import { getPublicLandingPageContent } from "@/services/landing-page.service";
import type { LandingPageContent } from "@/types/landing-page";

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
  const [landingPageContent, setLandingPageContent] = useState<LandingPageContent | null>(null);
  const [landingPageLoading, setLandingPageLoading] = useState(true);
  const [landingPageError, setLandingPageError] = useState<string | null>(null);
  const [landingPageRetry, setLandingPageRetry] = useState(0);
  const [news, setNews] = useState<PublicNewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsRetry, setNewsRetry] = useState(0);

  useEffect(() => {
    let active = true;

    getPublicLandingPageContent()
      .then((result) => {
        if (active) setLandingPageContent(result);
      })
      .catch((error: unknown) => {
        if (active) {
          setLandingPageError(error instanceof Error ? error.message : "Unable to load landing page content.");
        }
      })
      .finally(() => {
        if (active) setLandingPageLoading(false);
      });

    return () => {
      active = false;
    };
  }, [landingPageRetry]);

  useEffect(() => {
    let active = true;

    getPublicNews()
      .then((result) => {
        if (active) setNews(result.items);
      })
      .catch((error: unknown) => {
        if (active) {
          setNewsError(error instanceof Error ? error.message : "Unable to load news.");
        }
      })
      .finally(() => {
        if (active) setNewsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [newsRetry]);

  if (landingPageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFDFE] text-sm text-slate-600" role="status">
        Loading CBCM...
      </div>
    );
  }

  if (!landingPageContent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FDFDFE] px-4 text-center">
        <p className="text-sm text-red-800" role="alert">
          {landingPageError || "Landing page content is unavailable."}
        </p>
        <button
          type="button"
          onClick={() => {
            setLandingPageLoading(true);
            setLandingPageError(null);
            setLandingPageRetry((current) => current + 1);
          }}
          className="rounded-lg bg-[#194611] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13380d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#194611]"
        >
          Try again
        </button>
      </div>
    );
  }

  const content = landingPageContent;
  const activeRoleContent = content.roles.cards.find((role) => role.id === activeRole)
    || content.roles.cards[0];

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
              <a href="#news" className="hover:text-[#194611] transition-colors">
                News
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
                <span>{content.hero.eyebrow}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-6">
                {content.hero.title}{" "}
                <span className="text-[#194611] relative">
                  {content.hero.highlight}
                  <span className="block h-1 w-24 bg-[#FDD028] rounded-full mt-2 opacity-90" />
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed mb-8 max-w-2xl">
                {content.hero.description}
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
                {content.hero.proof_points.map((point, index) => (
                  <div key={`${point}-${index}`} className={`flex items-center gap-2 ${index === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#194611]" />
                    <span>{point}</span>
                  </div>
                ))}
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
                    src={content.hero.image_url}
                    alt={content.hero.image_alt}
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
                  <span className="text-xs font-semibold text-slate-800">{content.hero.connected_badge}</span>
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
                        <span className="text-sm font-bold text-slate-900">{content.hero.verification_title}</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                          {content.hero.verification_label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {content.hero.verification_description}
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
                <span>{content.how_it_works.eyebrow}</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
                {content.how_it_works.title}{" "}
                <span className="text-[#194611]">{content.how_it_works.highlight}</span>
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                {content.how_it_works.description}
              </p>
            </motion.div>
          </div>

          <motion.div
            className="grid grid-cols-1 gap-8 items-stretch lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {content.how_it_works.cards.map((card, index) => {
              const FeatureIcon = [Stethoscope, BookOpen, Layers, Sparkles][index % 4];
              return (
                <motion.div key={`${card.id}-${index}`} variants={itemVariants} className="h-full">
                  <Card className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-7">
                    <div>
                      <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100">
                        {card.image_url && (
                          <img
                            src={card.image_url}
                            alt={card.image_alt}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                          />
                        )}
                        {card.step && (
                          <div className="absolute left-3 top-3 rounded-lg border border-white/80 bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#194611] shadow-xs">
                            {card.step}
                          </div>
                        )}
                        {card.status && (
                          <div className="absolute bottom-3 left-3 right-3 truncate rounded-xl border border-white/80 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-slate-900 shadow-md">
                            {card.status}
                          </div>
                        )}
                      </div>
                      {card.category && (
                        <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#194611]/12 bg-[#194611]/8 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#194611]">
                          <FeatureIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          {card.category}
                        </div>
                      )}
                      <h3 className="mb-3 text-xl font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#194611] sm:text-2xl">
                        {card.title}
                      </h3>
                      <p className="mb-6 text-sm leading-relaxed text-slate-600">{card.description}</p>
                    </div>
                    {card.features.length > 0 && (
                      <ul className="mt-auto space-y-2.5 border-t border-slate-100 pt-5">
                        {card.features.map((feature, featureIndex) => (
                          <li key={`${feature}-${featureIndex}`} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#194611]" aria-hidden="true" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          ROLE-BASED ECOSYSTEM (INTERACTIVE SHADCN TABS)
      ──────────────────────────────────────────────────────────── */}
      <section id="roles" className="scroll-mt-20 border-b border-slate-200/80 bg-white py-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#194611]/20 bg-[#194611]/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#194611] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#194611]" />
              {content.roles.eyebrow}
            </div>
            <h2 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              {content.roles.title}{" "}
              <span className="text-[#194611]">{content.roles.highlight}</span>
            </h2>
            <p className="text-base leading-relaxed text-slate-500 sm:text-lg">{content.roles.description}</p>
          </div>

          {content.roles.cards.length > 0 && activeRoleContent ? (
            <div className="mx-auto w-full max-w-6xl">
              <Tabs
                value={activeRoleContent.id}
                onValueChange={setActiveRole}
                className="flex w-full flex-col items-center"
              >
                <div className="mb-10 w-full overflow-x-auto px-2 py-1">
                  <TabsList className="inline-flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
                    {content.roles.cards.map((role, index) => (
                      <TabsTrigger
                        key={`${role.id}-${index}`}
                        value={role.id}
                        className="cursor-pointer whitespace-nowrap rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800 data-active:bg-[#194611] data-active:text-[#FDD028] data-active:shadow-md sm:text-sm"
                      >
                        {role.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    <motion.article
                      key={activeRoleContent.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={springTransition}
                      className="grid overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg lg:grid-cols-2"
                    >

                      <div className="flex flex-col justify-center p-8 sm:p-12">
                        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#194611]/15 bg-[#194611]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#194611]">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          {activeRoleContent.eyebrow}
                        </div>
                        <h3 className="mb-4 text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl">
                          {activeRoleContent.title}
                        </h3>
                        <p className="mb-8 text-sm leading-relaxed text-slate-500 sm:text-[15px]">
                          {activeRoleContent.description}
                        </p>
                        {activeRoleContent.highlights.length > 0 && (
                          <ul className="space-y-4">
                            {activeRoleContent.highlights.map((item, index) => (
                              <li key={`${item.title}-${index}`} className="flex items-start gap-3.5">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#194611]" aria-hidden="true" />
                                <div>
                                  <span className="text-sm font-bold text-slate-800">{item.title}: </span>
                                  <span className="text-sm text-slate-500">{item.description}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="relative min-h-[380px] bg-slate-50/80">
                        {activeRoleContent.image_url && (
                          <img
                            src={activeRoleContent.image_url}
                            alt={activeRoleContent.image_alt}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 space-y-3">
                          {(activeRoleContent.caption || activeRoleContent.subcaption) && (
                            <div className="rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
                              {activeRoleContent.caption && (
                                <p className="text-xs font-bold text-slate-900">{activeRoleContent.caption}</p>
                              )}
                              {activeRoleContent.subcaption && (
                                <p className="mt-1 text-[11px] text-slate-500">{activeRoleContent.subcaption}</p>
                              )}
                            </div>
                          )}
                          {activeRoleContent.feature_cards.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                              {activeRoleContent.feature_cards.map((feature, index) => (
                                <div key={`${feature.title}-${index}`} className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-sm">
                                  <p className="text-xs font-bold text-slate-900">{feature.title}</p>
                                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{feature.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  </AnimatePresence>
                </div>
              </Tabs>
            </div>
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
              Role information is not available at this time.
            </p>
          )}
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
                {content.impact.eyebrow}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#194611] tracking-tight mb-4">
                {content.impact.title}
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                {content.impact.description}
              </p>
            </motion.div>
          </div>

          <motion.div
            className="mb-20 grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {content.impact.stats.map((stat, index) => {
              const StatIcon = [Building2, Award, Users, HeartHandshake][index % 4];
              return (
                <motion.div
                  key={`${stat.id}-${index}`}
                  variants={itemVariants}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-[#194611]/20 hover:shadow-md"
                >
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#194611]/10 text-[#194611]">
                    <StatIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mb-1 text-3xl font-extrabold text-[#194611] sm:text-4xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs font-semibold text-slate-700 sm:text-sm">{stat.label}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{stat.description}</p>
                </motion.div>
              );
            })}
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
                <span>{content.impact.cta.eyebrow}</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
                {content.impact.cta.title}
              </h2>

              <p className="text-base sm:text-lg text-white/80 max-w-2xl mb-8 leading-relaxed font-normal">
                {content.impact.cta.description}
              </p>

              {/* Exclusive Login Button */}
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-[#FDD028] hover:bg-[#eabf20] text-[#194611] font-bold shadow-lg shadow-black/20 hover:shadow-xl transition-all rounded-xl h-14 px-9 text-base flex items-center gap-3 cursor-pointer"
                )}
              >
                <span>{content.impact.cta.button_label}</span>
                <ArrowRight className="h-5 w-5 text-[#194611]" />
              </Link>

              <p className="text-xs text-white/60 mt-5">
                Authorized access only. Accounts are issued by designated facility administrators.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="news" className="scroll-mt-20 border-t border-slate-200/80 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#194611]/15 bg-[#194611]/5 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#194611]">
                <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
                Updates from CBCM
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#194611] sm:text-4xl">
                News
              </h2>
              <p className="mt-3 text-base text-slate-600 sm:text-lg">
                The latest announcements and updates from our clinical mentorship program.
              </p>
            </div>
          </div>

          {newsLoading ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600" role="status">
              Loading news...
            </p>
          ) : newsError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-sm text-red-800" role="alert">{newsError}</p>
              <button
                type="button"
                onClick={() => {
                  setNewsLoading(true);
                  setNewsError(null);
                  setNewsRetry((current) => current + 1);
                }}
                className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
              >
                Try again
              </button>
            </div>
          ) : news.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
              There are no news articles to share right now. Please check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {news.map((article) => {
                const publishedDate = new Date(article.published_at);
                const formattedDate = Number.isNaN(publishedDate.getTime())
                  ? null
                  : new Intl.DateTimeFormat(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(publishedDate);

                return (
                  <article
                    key={article.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg"
                  >
                    {article.cover_image_url ? (
                      <img
                        src={article.cover_image_url}
                        alt=""
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center bg-[#194611]/5 text-[#194611]" aria-hidden="true">
                        <Newspaper className="h-12 w-12 opacity-60" />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-slate-500">
                        {article.category && (
                          <span className="rounded-full bg-[#194611]/8 px-3 py-1 text-[#194611]">
                            {article.category}
                          </span>
                        )}
                        {formattedDate && <time dateTime={article.published_at}>{formattedDate}</time>}
                      </div>
                      <h3 className="text-xl font-bold leading-snug text-slate-900">
                        {article.title}
                      </h3>
                      {article.summary && (
                        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-600">
                          {article.summary}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
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
