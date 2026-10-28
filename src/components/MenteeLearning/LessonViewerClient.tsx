"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Maximize2,
  FileText,
  Download,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Award,
  Video,
  Clock,
  ChevronRight,
  MessageSquare,
  HelpCircle,
  Share2,
  Check,
  X,
  Radio,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function LessonViewerClient() {
  // Video player simulation state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(78);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Assessment Quiz Dialog State
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next && videoProgress < 100) {
        // Increment progress slightly on play
        setVideoProgress((p) => Math.min(100, p + 5));
      }
      return next;
    });
  };

  // Mock Assessment Questions
  const quizQuestions = [
    {
      question:
        "According to the WHO AMTSL protocol, within what timeframe should Oxytocin (10 IU IM) be administered following the birth of the baby?",
      options: [
        "Within 1 minute of birth, after ruling out an undiagnosed second twin",
        "Immediately after the delivery of the placenta",
        "Only if maternal blood loss exceeds 300 mL",
        "10 minutes after cord clamping and cutting",
      ],
      correctIndex: 0,
      explanation:
        "Oxytocin 10 IU IM should be given within 1 minute of fetal delivery after abdominal palpation confirms no additional twin is present.",
    },
    {
      question:
        "What is the primary purpose of applying counter-traction above the pubic bone during Controlled Cord Traction (CCT)?",
      options: [
        "To speed up cervical dilation",
        "To prevent acute uterine inversion while the placenta separates",
        "To increase maternal blood pressure",
        "To separate the fetal membranes from the vaginal wall",
      ],
      correctIndex: 1,
      explanation:
        "Counter-traction (the Brandt-Andrews maneuver) stabilizes the lower uterine segment, safeguarding against life-threatening uterine inversion.",
    },
    {
      question:
        "How frequently should uterine tone and fundal firmness be assessed during the immediate first 2 hours postpartum?",
      options: [
        "Once every hour",
        "Every 15 minutes",
        "Only if the patient reports severe cramps",
        "Every 30 minutes for the first hour only",
      ],
      correctIndex: 1,
      explanation:
        "Uterine massage and tone verification must be conducted every 15 minutes during the critical first 2 hours to prevent atonic PPH.",
    },
  ];

  const handleNextQuizQuestion = () => {
    if (selectedAnswer === null) return;

    if (selectedAnswer === quizQuestions[currentQuestionIndex].correctIndex) {
      setQuizScore((prev) => prev + 1);
    }

    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsQuizSubmitted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setIsQuizSubmitted(false);
    setIsQuizOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border border-emerald-200 bg-emerald-50 text-[#194611] text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#194611]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link
            href="/resources"
            className="hover:text-gray-900 transition flex items-center gap-1 font-medium"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#194611]" />
            <span>Clinical Resources</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600 font-medium">Module 4: Intrapartum Care</span>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-[#194611] font-semibold">Lesson 2: AMTSL Protocol</span>
        </div>

        <Link href="/resources">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold border-gray-200 text-gray-700 hover:border-[#194611] hover:text-[#194611] transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Resources</span>
          </Button>
        </Link>
      </div>

      {/* Responsive Grid: 1 col on mobile, 3 cols on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* =========================================================================
            MAIN CONTENT COLUMN (LEFT / CENTER - SPANS 2 COLS)
            ========================================================================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lesson Header Block */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-emerald-50 text-[#194611] border-emerald-200 font-bold text-xs px-2.5 py-0.5 rounded-full"
              >
                Module 4 • Lesson 2
              </Badge>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-200 font-semibold text-xs px-2.5 py-0.5 rounded-full"
              >
                Clinical Competency Core
              </Badge>
              <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                <Clock className="w-3.5 h-3.5" />
                <span>25 mins estimated</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Active Management of the Third Stage of Labor (AMTSL) & PPH Prevention
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Standard operating procedures for prophylactic uterotonic administration,
              controlled cord traction with counter-traction, and immediate uterine massage.
            </p>
          </div>

          {/* Media Player: 16:9 Aspect Ratio Container */}
          <div className="space-y-3">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-950 shadow-lg border border-gray-800 flex items-center justify-center group">
              {/* Simulated Clinical Video Frame / Gradient Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

              {/* Background decorative procedural illustration */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none pointer-events-none">
                <div className="w-96 h-96 rounded-full bg-emerald-600/20 blur-3xl" />
              </div>

              {/* Top Video Overlay Info */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 font-bold text-[10px] tracking-wide uppercase">
                    Procedural Simulation
                  </span>
                  <span className="font-semibold text-gray-200 drop-shadow">
                    WHO Delivery Suite Protocol • High Definition
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="font-mono text-[11px]">1080p Clinical Stream</span>
                </div>
              </div>

              {/* Center Play / Pause Action Button */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="relative z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-2xl group-hover:bg-[#194611]/80 cursor-pointer"
                title={isPlaying ? "Pause Video" : "Play Video"}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-current text-white" />
                ) : (
                  <Play className="w-8 h-8 fill-current text-white translate-x-0.5" />
                )}
              </button>

              {/* Bottom Video Player Control Bar */}
              <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="hover:text-emerald-400 transition"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoProgress(0);
                      showToast("Restarted video from 00:00");
                    }}
                    className="hover:text-emerald-400 transition"
                    title="Restart"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className="hover:text-emerald-400 transition"
                    title="Mute / Unmute"
                  >
                    <Volume2
                      className={cn("w-4 h-4", isAudioMuted && "text-gray-500 line-through")}
                    />
                  </button>
                  <span className="font-mono text-[11px] text-gray-300">
                    14:28 / 18:45
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                    CC • English / Amharic
                  </span>
                  <button
                    type="button"
                    onClick={() => showToast("Fullscreen mode enabled")}
                    className="hover:text-emerald-400 transition"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Completion Progress Bar */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#194611]" />
                  <span>Video Progress</span>
                </span>
                <span className="font-bold text-[#194611]">
                  {videoProgress}% Completed ({Math.round((18.75 * videoProgress) / 100)} / 19 mins)
                </span>
              </div>
              <Progress value={videoProgress} className="h-2.5" />
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5">
                <span>Watch full demonstration to unlock clinical competency quiz</span>
                {videoProgress >= 75 ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Prerequisite Met</span>
                  </span>
                ) : (
                  <span>Minimum 75% required</span>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================================
              CONTENT BLOCKS: REUSABLE PROTOCOL CARDS
              ========================================================================= */}

          {/* Protocol Card 1: Standard Text Block with Key Concept Callout Box */}
          <Card className="border border-gray-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#194611]" />
                <CardTitle className="text-lg font-bold text-gray-900">
                  Clinical Rationale & Physiological Principles
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-500">
                Evidence-based obstetric intervention for preventing severe postpartum hemorrhage (PPH).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                The third stage of labor begins immediately after the delivery of the fetus and ends
                with the complete expulsion of the placenta and membranes. In non-managed physiological
                deliveries, uterine muscle fibers may take up to 30 minutes to contract sufficiently to
                compress the spiral maternal arterioles at the placental attachment site.
              </p>
              <p>
                Active management of the third stage of labor (AMTSL) reduces the incidence of severe
                postpartum hemorrhage by more than 60% and significantly lowers maternal transfusion rates
                in both primary healthcare facilities and referral hospitals.
              </p>

              {/* Highlighted "Key Concept" Callout Box */}
              <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-4 flex items-start gap-3.5 text-emerald-950 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-[#194611] mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#194611]">
                    Key Clinical Concept: The Golden 1-Minute Rule
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-900 leading-normal">
                    Administer <strong>10 IU of Oxytocin intramuscularly (IM)</strong> within{" "}
                    <strong>1 minute</strong> of fetal delivery. Always palpate the maternal abdomen
                    first to confirm uterine contours and strictly rule out the presence of an
                    undiagnosed second twin before uterotonic injection.
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500 italic">
                Note: In low-resource settings where cold-chain storage for oxytocin is unavailable, oral
                misoprostol (600 mcg) serves as the recommended alternative uterotonic.
              </p>
            </CardContent>
          </Card>

          {/* Protocol Card 2: Step-by-Step Clinical Procedure Protocol */}
          <Card className="border border-gray-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Step-by-Step Clinical Procedure Protocol
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Standard Ministry of Health & WHO 4-Stage Protocol for Midwifery Practice
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 text-gray-600">
                  4 Core Steps
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-4 p-3.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-[#194611] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    1
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-bold text-gray-900">
                      Step 1: Abdominal Palpation & Uterotonic Injection
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Place your hand on the mother&apos;s abdomen to ensure there is no undiagnosed twin.
                      Immediately administer 10 IU Oxytocin IM into the anterolateral thigh. Record the
                      exact minute of injection on the maternal clinical partograph.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4 p-3.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-[#194611] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    2
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-bold text-gray-900">
                      Step 2: Controlled Cord Traction (CCT) with Counter-Traction
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Clamp the cord close to the perineum. Await a strong uterine contraction (2–3
                      minutes). Apply gentle downward traction on the cord while simultaneously using
                      your other hand to apply upward counter-pressure above the pubic bone
                      (Brandt-Andrews technique) to prevent uterine inversion.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4 p-3.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-[#194611] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    3
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-bold text-gray-900">
                      Step 3: Immediate Uterine Massage & Fundal Assessment
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Immediately following placental expulsion, perform circular abdominal massage on
                      the uterine fundus until the organ feels &ldquo;grapefruit hard&rdquo;. Re-evaluate
                      uterine firmness and check vaginal bleeding every 15 minutes for the first 2 hours.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4 p-3.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-[#194611] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    4
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-bold text-gray-900">
                      Step 4: Systematic Placental & Membrane Inspection
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Examine both maternal cotyledons and fetal membranes. Ensure all lobes fit together
                      without gaps or torn vessels extending across membranes (succenturiate lobes), which
                      indicate retained placental fragments.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* =========================================================================
              ASSESSMENT GATEWAY: KNOWLEDGE QUIZ & PREREQUISITES
              ========================================================================= */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/40 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-[#194611]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Lesson 2 Knowledge Quiz & Competency Gateway
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Test your understanding of the AMTSL protocol before advancing to Lesson 3.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                Complete this 3-question diagnostic quiz to verify clinical readiness for supervised
                delivery suite shifts. A score of <strong>80% or higher</strong> is required to earn the
                lesson completion badge.
              </p>

              {/* Prerequisites Checkmarks */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Lesson Completion Prerequisites:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">Video Procedural Review (78%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-800 bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">Protocol & Steps Read</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-800 bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">Key Concept Acknowledged</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 bg-white/80 p-2.5 rounded-lg border border-gray-200">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-medium">Knowledge Quiz Pending</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-white/60 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3">
              <div className="text-xs text-gray-500">
                <span>Passing threshold: </span>
                <strong className="text-gray-900">80%</strong> • Instant preceptor log recording
              </div>
              <Button
                onClick={() => setIsQuizOpen(true)}
                className="w-full sm:w-auto bg-[#194611] hover:bg-[#14370d] text-white font-bold h-11 px-8 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Award className="w-4 h-4 text-[#FDD028]" />
                <span>Start Knowledge Assessment</span>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* =========================================================================
            CONTEXTUAL SIDEBAR COLUMN (RIGHT - SPANS 1 COL)
            ========================================================================= */}
        <div className="lg:col-span-1 space-y-6">
          {/* 1. Reference Book Card */}
          <Card className="border border-gray-200 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-[#194611] border-emerald-200 text-[11px] font-bold"
                >
                  Primary Clinical Manual
                </Badge>
                <span className="text-[11px] text-gray-400">PDF • 4.8 MB</span>
              </div>
              <CardTitle className="text-base font-bold text-gray-900 mt-1">
                Standard Treatment Guidelines (2024 Edition)
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Ministry of Health Maternal & Neonatal Clinical Care Standards • Chapter 7: Intrapartum Care
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[#194611] to-[#0f2a0a] p-4 text-white flex flex-col justify-between shadow-inner">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#FDD028]">
                    Official Clinical Guideline
                  </span>
                  <h4 className="text-sm font-bold leading-snug">
                    Obstetric Protocol for Management of Labor & PPH
                  </h4>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-200 pt-2 border-t border-emerald-800">
                  <span>Author: MOH Directorate</span>
                  <span>Rev. 2024</span>
                </div>
              </div>

              {/* Action Buttons: Read Online & Save Offline */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => showToast("Opening Standard Treatment Guidelines in digital reader...")}
                  className="bg-[#194611] hover:bg-[#14370d] text-white text-xs font-semibold h-9 rounded-lg flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Online</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showToast("Downloading guidelines PDF for offline review (4.8 MB)...")}
                  className="border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-semibold h-9 rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Offline</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Module Resources List */}
          <Card className="border border-gray-200 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#194611]" />
                  <span>Module Clinical Resources</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-semibold">
                  5 Attachments
                </Badge>
              </div>
              <CardDescription className="text-xs text-gray-500">
                Supplementary bedside tools and reference guidelines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {/* Resource 1 */}
              <div
                onClick={() => showToast("Downloading WHO Labor Care Guide...")}
                className="group p-2.5 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#194611] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-[#194611]">
                      WHO Labor Care Guide & Partograph
                    </p>
                    <p className="text-[11px] text-gray-400">PDF • 1.2 MB</p>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#194611] shrink-0" />
              </div>

              {/* Resource 2 */}
              <div
                onClick={() => showToast("Opening Clinical Checklist Template...")}
                className="group p-2.5 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-indigo-700">
                      AMTSL Observational Audit Checklist
                    </p>
                    <p className="text-[11px] text-gray-400">PDF Form • 420 KB</p>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-700 shrink-0" />
              </div>

              {/* Resource 3 */}
              <a
                href="https://www.who.int"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50/40 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-amber-800">
                      FIGO Guidelines on Postpartum Hemorrhage
                    </p>
                    <p className="text-[11px] text-gray-400">External Global Registry</p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-800 shrink-0" />
              </a>

              {/* Resource 4 */}
              <div
                onClick={() => showToast("Loading Uterine Balloon Tamponade (UBT) video drill...")}
                className="group p-2.5 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#194611] flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-[#194611]">
                      UBT Emergency Insertion Clinical Drill
                    </p>
                    <p className="text-[11px] text-gray-400">Video Demo • 6 mins</p>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#194611] shrink-0" />
              </div>

              {/* Resource 5 */}
              <div
                onClick={() => showToast("Opening Uterotonics Comparison Chart...")}
                className="group p-2.5 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-700">
                      Uterotonics Comparison (Oxytocin vs Misoprostol)
                    </p>
                    <p className="text-[11px] text-gray-400">Reference Chart • PDF</p>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-700 shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* 3. Mentor Note Card */}
          <Card className="border border-emerald-200 bg-emerald-50/40 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-emerald-300">
                  <AvatarImage src="/mentors/almaz.jpg" alt="Sr. Preceptor Almaz Tadesse" />
                  <AvatarFallback>AT</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 leading-tight">
                    Sr. Preceptor Almaz Tadesse
                  </h4>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Lead Clinical Midwifery Mentor
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <p className="text-xs text-gray-700 italic leading-relaxed bg-white/90 p-3 rounded-xl border border-emerald-100">
                &ldquo;Remember during night shifts: never apply cord traction without supporting the
                lower uterine segment! Uterine inversion is a life-threatening obstetric emergency, but
                100% preventable with correct hand placement.&rdquo;
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast("Opened direct mentoring messaging thread with Sr. Almaz")}
                className="w-full text-xs font-semibold h-8 bg-white border-emerald-200 text-[#194611] hover:bg-emerald-50 transition flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Mentor a Question</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* =========================================================================
          KNOWLEDGE QUIZ MODAL DIALOG
          ========================================================================= */}
      <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="bg-emerald-50 text-[#194611] border-emerald-200 text-xs font-bold"
              >
                Clinical Knowledge Verification
              </Badge>
              <span className="text-xs text-gray-500 font-medium">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </span>
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900 mt-2">
              {isQuizSubmitted ? "Assessment Results" : "AMTSL Clinical Competency Quiz"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {isQuizSubmitted
                ? "Your score has been registered in the digital mentoring log."
                : "Select the most accurate clinical action according to national guidelines."}
            </DialogDescription>
          </DialogHeader>

          {!isQuizSubmitted ? (
            <div className="space-y-4 py-2">
              {/* Question Text */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                  {quizQuestions[currentQuestionIndex].question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {quizQuestions[currentQuestionIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAnswer(idx)}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition flex items-start gap-3 cursor-pointer",
                      selectedAnswer === idx
                        ? "border-[#194611] bg-emerald-50/70 text-[#194611] font-bold shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-white text-gray-800"
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5",
                        selectedAnswer === idx
                          ? "bg-[#194611] text-white"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-normal">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#194611] flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  Score: {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {quizScore >= 2
                    ? "Congratulations! You have passed the Lesson 2 Knowledge Verification and demonstrated clinical competence."
                    : "Review the step-by-step protocol and discuss key takeaways with your mentor before retrying."}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-[#194611] font-semibold">
                Badge Earned: AMTSL Core Protocol Mastery
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {!isQuizSubmitted ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuizOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={selectedAnswer === null}
                  onClick={handleNextQuizQuestion}
                  className="bg-[#194611] hover:bg-[#14370d] text-white text-xs font-bold px-5"
                >
                  {currentQuestionIndex + 1 < quizQuestions.length ? "Next Question" : "Submit Quiz"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={resetQuiz}
                className="w-full bg-[#194611] hover:bg-[#14370d] text-white text-xs font-bold"
              >
                Close & Return to Lesson
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
