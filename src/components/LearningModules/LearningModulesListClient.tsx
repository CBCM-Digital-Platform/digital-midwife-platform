"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LearningModule } from "@/types/learning";
import {
  BookOpen,
  Search,
  ArrowRight,
  GraduationCap,
  Layers,
  Sparkles,
  FileText,
  Calendar,
  Plus,
  ShieldCheck,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  getStoredModules,
  DEFAULT_LEARNING_MODULES,
  isMentorAuthorizedForModule,
} from "@/services/learning.service";

interface LearningModulesListClientProps {
  initialModules: LearningModule[];
  userRole?: string;
  currentUserId?: string | number;
  currentUserEmail?: string;
  currentUserName?: string;
}

export function LearningModulesListClient({
  initialModules,
  userRole,
  currentUserId,
  currentUserEmail,
  currentUserName,
}: LearningModulesListClientProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedThematicArea, setSelectedThematicArea] = useState<string>("ALL");

  // Effective authenticated user context
  const effectiveUser = useMemo(() => {
    return {
      id: user?.id || currentUserId,
      email: user?.email || currentUserEmail,
      name: user?.name || currentUserName,
      role: user?.role || userRole,
    };
  }, [user, currentUserId, currentUserEmail, currentUserName, userRole]);

  // Normalize User Role
  const rawRole = String(effectiveUser.role || "mentor")
    .toLowerCase()
    .replace(/[-_\s]/g, "");
  const isSuperAdmin = rawRole === "superadmin" || rawRole === "admin";
  const isFacilityAdmin = rawRole === "facilityadmin";
  const isMentor = rawRole === "mentor";
  const isMentee = rawRole === "mentee" || (!isSuperAdmin && !isFacilityAdmin && !isMentor);

  // Mentor Tab: "assigned" (My Authorized Modules) vs "all" (All Curriculum Modules)
  const [mentorTab, setMentorTab] = useState<"assigned" | "all">("assigned");

  // Modules List with local cache merge
  const [modules, setModules] = useState<LearningModule[]>(() => {
    if (initialModules && initialModules.length > 0) {
      return initialModules;
    }
    return DEFAULT_LEARNING_MODULES;
  });

  // Set of module IDs this mentor has been authorized to access
  const [authorizedModuleIds, setAuthorizedModuleIds] = useState<Set<string>>(new Set());

  // Function to evaluate mentor access across all modules
  const recomputeAuthorizedModules = useCallback(
    (moduleList: LearningModule[]) => {
      if (typeof window === "undefined") return;

      const authSet = new Set<string>();
      moduleList.forEach((m) => {
        if (isMentorAuthorizedForModule(m.id, effectiveUser)) {
          authSet.add(String(m.id));
        }
      });
      setAuthorizedModuleIds(authSet);
    },
    [effectiveUser]
  );

  // Client-side synchronization on mount & storage change
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Merge server modules with client stored modules
    const stored = getStoredModules();
    const map = new Map<string, LearningModule>();

    // Initial seed/server modules
    const baseList =
      initialModules && initialModules.length > 0
        ? initialModules
        : DEFAULT_LEARNING_MODULES;
    baseList.forEach((m) => map.set(String(m.id), m));

    // Stored custom or updated modules
    stored.forEach((m) => map.set(String(m.id), m));

    const merged = Array.from(map.values());
    setModules(merged);

    // 2. Compute mentor authorization
    recomputeAuthorizedModules(merged);

    // 3. Listen for local grant/revoke changes
    const handleAccessChange = () => {
      recomputeAuthorizedModules(merged);
    };

    window.addEventListener("cbcm_mentor_access_changed", handleAccessChange);
    window.addEventListener("storage", handleAccessChange);

    return () => {
      window.removeEventListener("cbcm_mentor_access_changed", handleAccessChange);
      window.removeEventListener("storage", handleAccessChange);
    };
  }, [initialModules, recomputeAuthorizedModules]);

  // Extract unique thematic areas for filtering
  const thematicAreas = useMemo(() => {
    const areas = new Set<string>();
    modules.forEach((m) => {
      if (m.thematicAreaName) areas.add(m.thematicAreaName);
    });
    return Array.from(areas);
  }, [modules]);

  // Count of modules authorized for this mentor
  const authorizedCount = useMemo(() => {
    return modules.filter((m) => authorizedModuleIds.has(String(m.id))).length;
  }, [modules, authorizedModuleIds]);

  // Filter modules by search query, thematic area, and mentor tab
  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();

    return modules.filter((m) => {
      const idStr = String(m.id);

      // Mentor specific tab filtering: If mentor tab is "assigned", show only authorized modules
      if (isMentor && mentorTab === "assigned") {
        const isAuth = authorizedModuleIds.has(idStr);
        if (!isAuth) return false;
      }

      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.thematicAreaName && m.thematicAreaName.toLowerCase().includes(q));

      const matchesArea =
        selectedThematicArea === "ALL" ||
        m.thematicAreaName === selectedThematicArea;

      return matchesSearch && matchesArea;
    });
  }, [modules, search, selectedThematicArea, isMentor, mentorTab, authorizedModuleIds]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-[#194611] border border-emerald-200">
              <GraduationCap className="w-3.5 h-3.5 text-[#194611]" />
              Hierarchical Clinical Curriculum
            </span>
            <span className="text-xs text-gray-400">
              {isSuperAdmin && "• Master Curriculum Authority"}
              {isFacilityAdmin && "• Facility Preceptor Coordination"}
              {isMentor && "• Clinical Preceptor Authorized Modules"}
              {isMentee && "• Mentee Learning & Procedural Competencies"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#194611]">
            Learning Modules
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
            {isMentee &&
              "Explore your standardized clinical modules, download procedural guidelines, and prepare for bedside assessments."}
            {isMentor &&
              "Access accredited preceptor teaching guides, instructional clinical videos, and evaluate junior midwives on authorized competency packages."}
            {isFacilityAdmin &&
              "Coordinate facility preceptors, authorize mentor access to modules, and review curriculum resources."}
            {isSuperAdmin &&
              "Manage national clinical learning modules, publish evidence-based materials, and govern competency standards."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-xs font-medium text-gray-500">
            Showing <span className="font-bold text-gray-900">{filteredModules.length}</span> of{" "}
            {modules.length} modules
          </span>

          {isSuperAdmin && (
            <Link
              href="/admin/modules/create"
              className={cn(
                buttonVariants(),
                "bg-[#194611] hover:bg-[#13360d] text-white shadow-2xs font-semibold h-9 px-3.5 text-xs cursor-pointer"
              )}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create Module
            </Link>
          )}
        </div>
      </div>

      {/* Mentor Specific Tab Switcher */}
      {isMentor && (
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <button
            type="button"
            onClick={() => setMentorTab("assigned")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border",
              mentorTab === "assigned"
                ? "bg-[#194611] text-white border-[#194611] shadow-xs"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            <ShieldCheck className={cn("w-4 h-4", mentorTab === "assigned" ? "text-[#FDD028]" : "text-emerald-700")} />
            <span>My Authorized Modules</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                mentorTab === "assigned"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-[#194611]"
              )}
            >
              {authorizedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMentorTab("all")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border",
              mentorTab === "all"
                ? "bg-[#194611] text-white border-[#194611] shadow-xs"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            )}
          >
            <BookOpen className="w-4 h-4 text-gray-500" />
            <span>All Curriculum Modules</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                mentorTab === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
              )}
            >
              {modules.length}
            </span>
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search modules by title, keywords, or thematic area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm bg-white border-gray-200 shadow-2xs focus-visible:ring-[#194611]"
          />
        </div>

        {thematicAreas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedThematicArea("ALL")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border",
                selectedThematicArea === "ALL"
                  ? "bg-[#194611] text-white border-[#194611] shadow-2xs"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
            >
              All Areas
            </button>
            {thematicAreas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedThematicArea(area)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border",
                  selectedThematicArea === area
                    ? "bg-[#194611] text-white border-[#194611] shadow-2xs"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {area}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredModules.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-[#194611] flex items-center justify-center">
            {isMentor && mentorTab === "assigned" ? (
              <ShieldAlert className="w-6 h-6 text-amber-600" />
            ) : (
              <BookOpen className="w-6 h-6 text-gray-400" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-900">
              {isMentor && mentorTab === "assigned"
                ? "No Authorized Learning Modules Yet"
                : "No Learning Modules Found"}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              {isMentor && mentorTab === "assigned"
                ? "You haven't been granted preceptor access to any clinical modules yet. Once your Facility Administrator authorizes your account from the module's Mentor Access tab, it will appear here."
                : search
                ? `No clinical learning modules matched "${search}". Try searching with different keywords.`
                : "No learning modules are currently available in this category. Check back soon or contact your administrator."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {isMentor && mentorTab === "assigned" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMentorTab("all")}
                className="text-xs font-semibold text-[#194611] border-emerald-200 hover:bg-emerald-50 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                Browse All Curriculum Modules
              </Button>
            )}

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedThematicArea("ALL");
                }}
                className="text-xs font-semibold text-[#194611] hover:underline cursor-pointer"
              >
                Clear search & filters
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Modules Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => {
            const isPublished = module.status.toLowerCase() === "published";
            const isAuthorizedForThisMentor = authorizedModuleIds.has(String(module.id));

            return (
              <Link
                key={module.id}
                href={`/learning/modules/${module.id}`}
                className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#194611] rounded-2xl block"
              >
                <Card className="h-full border border-gray-200 hover:border-[#194611]/50 bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden rounded-2xl group-hover:-translate-y-0.5">
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#194611] border border-emerald-200/80">
                        <Layers className="w-3 h-3 text-[#194611]" />
                        {module.thematicAreaName || "Clinical Midwifery"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isMentor && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              isAuthorizedForThisMentor
                                ? "bg-emerald-100 text-[#194611] border-emerald-300"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            )}
                          >
                            {isAuthorizedForThisMentor ? (
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-[#194611]" />
                                Authorized
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-gray-400" />
                                Requires Grant
                              </span>
                            )}
                          </Badge>
                        )}

                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                            isPublished
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          )}
                        >
                          {module.status}
                        </Badge>
                      </div>
                    </div>

                    <CardTitle className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#194611] transition-colors leading-snug">
                      {module.title}
                    </CardTitle>

                    <CardDescription className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {module.description ||
                        "Comprehensive clinical training module covering protocol guidelines and supervised procedural rotation requirements."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 pb-3">
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {module.contentsCount !== undefined
                            ? `${module.contentsCount} Materials`
                            : "Curated Materials"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Module #{module.id}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 pb-4 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between text-xs font-semibold text-[#194611] group-hover:bg-emerald-50/50 transition-colors">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FDD028]" />
                      <span>
                        {isMentee && "Continue Learning & View Materials"}
                        {isMentor && (isAuthorizedForThisMentor ? "Open Preceptor Guide & Evaluate" : "View Curriculum Overview")}
                        {isFacilityAdmin && "Manage Preceptors & Resources"}
                        {isSuperAdmin && "Manage Module & Content"}
                      </span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#194611] group-hover:translate-x-1 transition-transform" />
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
