"use client";

import React, { useState, useMemo } from "react";
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
  Stethoscope,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningModulesListClientProps {
  initialModules: LearningModule[];
  userRole?: string;
}

export function LearningModulesListClient({
  initialModules,
  userRole,
}: LearningModulesListClientProps) {
  const [search, setSearch] = useState("");
  const [selectedThematicArea, setSelectedThematicArea] = useState<string>("ALL");

  // Normalize User Role
  const rawRole = String(userRole || "mentor").toLowerCase().replace(/[-_\s]/g, "");
  const isSuperAdmin = rawRole === "superadmin" || rawRole === "admin";
  const isFacilityAdmin = rawRole === "facilityadmin";
  const isMentor = rawRole === "mentor";
  const isMentee = rawRole === "mentee" || (!isSuperAdmin && !isFacilityAdmin && !isMentor);

  // Extract unique thematic areas for filtering
  const thematicAreas = useMemo(() => {
    const areas = new Set<string>();
    initialModules.forEach((m) => {
      if (m.thematicAreaName) areas.add(m.thematicAreaName);
    });
    return Array.from(areas);
  }, [initialModules]);

  // Filter modules by search query and thematic area
  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialModules.filter((m) => {
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
  }, [initialModules, search, selectedThematicArea]);

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
              {isMentor && "• Clinical Mentorship & Verification"}
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
              "Access preceptor teaching guides, instructional clinical videos, and evaluate junior midwives on standardized competency packages."}
            {isFacilityAdmin &&
              "Coordinate facility preceptors, authorize mentor access to modules, and review curriculum resources."}
            {isSuperAdmin &&
              "Manage national clinical learning modules, publish evidence-based materials, and govern competency standards."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-xs font-medium text-gray-500">
            Showing <span className="font-bold text-gray-900">{filteredModules.length}</span> of{" "}
            {initialModules.length} modules
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
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-[#194611] flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No Learning Modules Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {search
              ? `No clinical learning modules matched "${search}". Try searching with different keywords.`
              : "No learning modules are currently published. Check back soon or contact your system administrator."}
          </p>
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
      ) : (
        /* Modules Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => {
            const isPublished = module.status.toLowerCase() === "published";
            return (
              <Link
                key={module.id}
                href={`/learning/modules/${module.id}`}
                className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#194611] rounded-2xl block"
              >
                <Card className="h-full border border-gray-200 hover:border-[#194611]/50 bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden rounded-2xl group-hover:-translate-y-0.5">
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#194611] border border-emerald-200/80">
                        <Layers className="w-3 h-3 text-[#194611]" />
                        {module.thematicAreaName || "Clinical Midwifery"}
                      </span>

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
                        {isMentor && "Review Curriculum & Evaluate"}
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
